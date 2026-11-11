# SPEC 01: Tổng Quan Dự Án (Overview)

## 1. Mục tiêu
Hệ thống web quản lý tài chính cá nhân dành cho người dùng đơn lẻ (single-user), tiền tệ Việt Nam Đồng (VND). Tập trung vào sự đơn giản, tin cậy, phản hồi cảnh báo ngân sách tức thì và trợ lý gợi ý chi tiêu thông minh bằng Google Gemini Flash (kèm fallback ngoại tuyến).

## 2. Phạm vi & Giả định (Assumptions)
- **Mô hình người dùng**: Đơn người dùng (không cần cơ chế xác thực JWT/OAuth phức tạp).
- **Tiền tệ**: VND (định dạng `₫` hoặc `VND`, dấu chấm phân cách hàng nghìn).
- **Cơ sở dữ liệu**: SQLite (file local, nhẹ, không cần cài đặt DBMS riêng).
- **Môi trường chạy**: Node.js & trình duyệt hiện đại, khởi động bằng `npm install && npm run dev`.

## 3. Tech Stack
- **Backend**:
  - Runtime: Node.js (ES Modules).
  - Framework: Express.js.
  - Database: SQLite (thư viện `better-sqlite3`).
  - Validation: Zod.
  - AI Client: `@google/genai` (Gemini Flash Free Tier) + Rule-Based Fallback.
  - Test: Vitest / Node Test Runner.
- **Frontend**:
  - Framework: React (Vite).
  - Styling: Vanilla CSS hiện đại (CSS Modules / CSS Variables).
  - Charting: Chart.js hoặc thư viện Canvas nhẹ.
  - State: React Context + Custom Hooks.
- **Giao tiếp**: RESTful JSON API.

## 4. Tiêu chí thành công (Acceptance Criteria)
1. **CRUD Thu/Chi**: Thao tác thêm/sửa/xóa/lọc hoạt động mượt mà, lưu trữ bền vững vào SQLite.
2. **Cảnh báo tức thời**: Ngay khi thêm khoản chi chạm mốc 80% hoặc 100% ngân sách tháng/danh mục, UI hiển thị cảnh báo ngay lập tức.
3. **Chống sập AI**: Khi mất mạng, hết quota hoặc tắt API key, hệ thống tự động chuyển sang chế độ Rule-Based, trả về $\le 5$ gợi ý có số liệu cụ thể.
4. **Clean Code & Test**: Tuân thủ phân tầng (Route-Controller-Service-Repo), hàm $\le 30$ dòng, có unit test cho `BudgetAlertService` và các cấu trúc dữ liệu giải thuật.
