# SPEC 06: Trợ Lý Gợi Ý Chi Tiêu Thông Minh (AI Suggestions Specification)

## 1. Nguyên Tắc Thiết Kế & Bảo Mật

1. **Bảo mật & Quyền riêng tư (Privacy-by-Design)**:
   - **Tuyệt đối không gửi giao dịch thô** (raw transactions): Không gửi thời gian chi tiết, không gửi nội dung ghi chú (note), không gửi lịch sử từng ngày.
   - **Chỉ gửi dữ liệu đã tổng hợp** (aggregated data theo danh mục):
     - Tổng thu nhập và tổng chi tiêu của tháng.
     - Danh sách: `{ categoryName, budgetAmount, actualSpent, percentage }`.
     - Số ngày còn lại trong tháng.
2. **Quản lý Khóa bí mật (Secret Management)**:
   - Biến môi trường: `GEMINI_API_KEY` nằm hoàn toàn trong `.env` của Backend.
   - Không xuất hiện trong source control (`.gitignore`), không bao giờ truyền xuống Frontend.
3. **Giới hạn thời gian (Timeout) & Chống nghẽn**:
   - Timeout cứng: 5000ms (5 giây). Nếu Gemini không phản hồi trong 5 giây, hủy kết nối và chuyển ngay sang Fallback.
   - Thử lại (Retry): Tối đa 1 lần nếu gặp lỗi mạng tạm thời, không retry nếu là lỗi xác thực hoặc 429 (Rate Limit).

---

## 2. Cấu Trúc Dữ Liệu Gửi Lên Gemini (Payload)

```json
{
  "month": "2026-10",
  "daysRemainingInMonth": 9,
  "totalIncome": 25000000,
  "totalExpense": 16400000,
  "savingsRate": 34.4,
  "categoryBudgets": [
    { "category": "Ăn uống", "budget": 2000000, "spent": 1700000, "percentage": 85.0 },
    { "category": "Đi lại", "budget": 1000000, "spent": 1050000, "percentage": 105.0 },
    { "category": "Tiền nhà", "budget": 5000000, "spent": 5000000, "percentage": 100.0 },
    { "category": "Mua sắm", "budget": 1500000, "spent": 600000, "percentage": 40.0 }
  ]
}
```

---

## 3. System Prompt & Ràng Buộc Schema JSON

### 3.1 System Instruction
```text
Bạn là chuyên gia tư vấn tài chính cá nhân thông minh và thực tế cho người Việt Nam (đơn vị tiền tệ: VND).
Nhiệm vụ: Phân tích bảng tổng hợp ngân sách tháng và đưa ra TỐI ĐA 5 gợi ý chi tiêu cụ thể, hành động được ngay.
Yêu cầu bắt buộc:
1. Mỗi gợi ý PHẢI có con số cụ thể (số tiền cắt giảm, số tiền chi tối đa mỗi ngày, hoặc mục tiêu tiết kiệm).
2. Lời khuyên ngắn gọn, súc tích (1-2 câu mỗi gợi ý).
3. Luôn trả về định dạng JSON thuần túy theo schema được chỉ định, không thêm markdown formatting hay văn bản ngoài JSON.
```

### 3.2 Zod Validation Schema (Validate đầu ra của Gemini)
```javascript
const AiSuggestionOutputSchema = z.object({
  summary: z.string().min(10).max(200),
  suggestions: z.array(
    z.object({
      id: z.number(),
      category: z.string(),
      type: z.enum(['WARNING', 'SAVING', 'OPTIMIZATION']),
      targetAmount: z.number(),
      savingPotential: z.number(),
      message: z.string().min(10).max(180)
    })
  ).max(5)
});
```

---

## 4. Cơ Chế Dự Phòng (Rule-Based Fallback Engine)

Khi xảy ra bất kỳ điều kiện nào sau đây:
- Không cấu hình `GEMINI_API_KEY` trong `.env`.
- Request gọi Gemini bị timeout (> 5s).
- Gemini trả mã lỗi 429 (Hết hạn mức / Rate limit) hoặc 5xx.
- Lỗi mạng (offline).
- JSON trả về từ AI không vượt qua được bước Zod validation.

Hệ thống lập tức kích hoạt `RuleBasedAdvisor` với 4 quy tắc tài chính chuẩn xác:

| Quy tắc | Điều kiện kích hoạt | Công thức tính số liệu cụ thể | Nội dung gợi ý |
|---|---|---|---|
| **R1: Báo động bội chi** | Danh mục có `spent >= budget` | `overAmount = spent - budget` | "Đã vượt ngân sách [X] ₫. Ngừng chi thêm ở danh mục này và trích quỹ dự phòng bù vào." |
| **R2: Phân bổ ngày còn lại** | Danh mục có `80% <= % < 100%` | `dailyCap = (budget - spent) / daysLeft` | "Đã chi [X]% ngân sách. Giới hạn tối đa [dailyCap] ₫/ngày trong [daysLeft] ngày còn lại." |
| **R3: Tối ưu danh mục lớn nhất** | Top 1 danh mục chi nhiều tiền nhất | `save10Pct = spent * 0.1` | "Danh mục chi lớn nhất tháng ([spent] ₫). Cắt giảm 10% ([save10Pct] ₫) cho tháng tới." |
| **R4: Tỷ lệ 50/30/20** | `totalExpense > 0.7 * totalIncome` | `gap = totalExpense - 0.7 * totalIncome` | "Tổng chi tiêu vượt 70% thu nhập. Nên giảm [gap] ₫ để duy trì mục tiêu tiết kiệm 20-30%." |

Kết quả từ Rule-Based Engine luôn bảo đảm trả về $\le 5$ gợi ý, có con số tiền VND cụ thể, phản hồi lập tức trong $< 5$ms mà không phụ thuộc vào Internet.
