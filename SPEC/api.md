# SPEC 04: Tài Liệu Giao Diện API (API Specification)

## 1. Quy Ước Chung
- **Base URL**: `/api/v1`
- **Header**: `Content-Type: application/json`
- **Envelope Response Thống nhất**:
  - **Thành công**:
    ```json
    {
      "success": true,
      "data": {}
    }
    ```
  - **Thất bại**:
    ```json
    {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Mô tả lỗi ngắn gọn",
        "details": []
      }
    }
    ```

---

## 2. Danh Sách Endpoints

### 2.1 Danh Mục (Categories)
- `GET /api/v1/categories`
  - Trả về toàn bộ danh mục thu/chi.

---

### 2.2 Giao Dịch (Transactions)
- `GET /api/v1/transactions`
  - **Query Params**: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD), `month` (YYYY-MM), `categoryId`, `type` (`INCOME` | `EXPENSE`).
  - **Response**: Mảng danh sách giao dịch kèm thông tin tên/icon danh mục, đã được sắp xếp giảm dần theo ngày.

- `POST /api/v1/transactions`
  - **Body**: `{ "category_id": 1, "type": "EXPENSE", "amount": 500000, "date": "2026-10-22", "note": "Ăn trưa bạn bè" }`
  - **Response (201 Created)**:
    ```json
    {
      "success": true,
      "data": {
        "transaction": { "id": 12, "category_id": 1, "amount": 500000, "...": "..." },
        "alert": {
          "triggered": true,
          "level": "WARNING_80", // hoặc "EXCEEDED_100", "NONE"
          "percentage": 82.5,
          "categoryName": "Ăn uống",
          "budgetAmount": 2000000,
          "spentAmount": 1650000,
          "message": "Cảnh báo: Danh mục 'Ăn uống' đã chạm 82.5% ngân sách tháng!"
        }
      }
    }
    ```

- `PUT /api/v1/transactions/:id`
  - **Body**: Các trường cần cập nhật (`amount`, `category_id`, `date`, `note`).

- `DELETE /api/v1/transactions/:id`
  - **Response**: `{ "success": true, "data": { "deletedId": 12 } }`

- `GET /api/v1/transactions/top-expenses`
  - **Query Params**: `limit=5`, `month=2026-10`
  - **Mô tả**: Sử dụng thuật toán Min-Heap lấy Top-K khoản chi lớn nhất trong tháng.

---

### 2.3 Ngân Sách (Budgets)
- `GET /api/v1/budgets`
  - **Query Params**: `month=YYYY-MM`
  - **Response**: Danh sách ngân sách theo danh mục trong tháng kèm `spentAmount`, `remainingAmount`, `percentage`, `status` (`OK` | `WARNING_80` | `EXCEEDED_100`).

- `POST /api/v1/budgets`
  - **Mô tả**: Upsert (thêm mới hoặc cập nhật hạn mức) cho 1 danh mục trong tháng.
  - **Body**: `{ "category_id": 1, "month": "2026-10", "amount": 2500000 }`

- `DELETE /api/v1/budgets/:id`
  - Xóa thiết lập ngân sách.

---

### 2.4 Dashboard & Thống Kê (Dashboard)
- `GET /api/v1/dashboard/summary`
  - **Query Params**: `month=YYYY-MM`
  - **Response**:
    ```json
    {
      "totalIncome": 25000000,
      "totalExpense": 16400000,
      "netBalance": 8600000,
      "savingsRate": 34.4
    }
    ```

- `GET /api/v1/dashboard/category-breakdown`
  - **Query Params**: `month=YYYY-MM`, `type=EXPENSE`
  - **Mô tả**: Gom nhóm tổng chi theo từng danh mục bằng cấu trúc `Map`.
  - **Response**: Danh sách `{ categoryId, categoryName, color, total, percentage }`.

- `GET /api/v1/dashboard/monthly-trend`
  - **Query Params**: `months=6`
  - **Response**: Mảng 6 tháng gần nhất với `month`, `income`, `expense`, `balance`.

---

### 2.5 Trợ Lý Gợi Ý Chi Tiêu (AI Advisor)
- `GET /api/v1/ai/suggestions`
  - **Query Params**: `month=YYYY-MM`
  - **Mô tả**: Gửi dữ liệu đã tổng hợp sang Gemini Flash hoặc Fallback sang Rule-Based.
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "month": "2026-10",
        "engine": "GEMINI_FLASH", // hoặc "RULE_BASED_FALLBACK"
        "summary": "Chi tiêu tháng 10 đang chiếm 65% thu nhập, danh mục Ăn uống tiệm cận ngưỡng ngân sách.",
        "suggestions": [
          {
            "id": 1,
            "category": "Ăn uống",
            "type": "WARNING",
            "message": "Chi tiêu ăn uống đã đạt 85% hạn mức. Đề xuất giới hạn dưới 70.000 ₫/ngày trong 9 ngày còn lại.",
            "targetAmount": 350000,
            "savingPotential": 630000
          }
        ]
      }
    }
    ```
