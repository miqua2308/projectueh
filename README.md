# SmartFinance VND - Web Quản Lý Tài Chính Cá Nhân

Hệ thống web quản lý thu chi cá nhân hoàn chỉnh bằng JavaScript (Frontend React Vite + Backend Node.js/Express + Cơ sở dữ liệu SQLite qua `node:sqlite` tích hợp sẵn), hỗ trợ cảnh báo ngân sách tức thời và trợ lý gợi ý chi tiêu tài chính định lượng (kèm cơ chế Bot Sleeping & Fallback ngoại tuyến).

---

## 1. Cài Đặt & Khởi Chạy

Dự án sử dụng **`node:sqlite`** có sẵn trong Node.js (Node 22+ / Node 24+), **100% pure JavaScript**, hoàn toàn không cần cài đặt Visual Studio C++ build tools hay `node-gyp`.

### Bước 1: Cài đặt các gói phụ thuộc
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```
*(Nếu chạy local, file `.env` đã có sẵn các cấu hình cổng 5000 và database path).*

### Bước 3: Khởi chạy dự án
```bash
npm run dev
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1

### Bước 4: Chạy kiểm thử Unit Tests
```bash
npm test
```
Kiểm thử tự động cho `BudgetAlertService`, các cấu trúc dữ liệu DSA (`MinHeap`, `binarySearch`, `aggregateByCategory`), luồng Gemini/fallback (`aiAdvisor.test.js`) và bộ sprite linh vật (`petController.test.js`).

### Linh vật pixel
Sprite heo đất (PNG 32×32) được sinh từ asset CC0 trong `assets/pet-src/` (xem `CREDITS.md`):
```bash
npm run sprites   # = python scripts/build_pet_sprites.py (cần Pillow)
```
Kết quả: `assets/pet-sprites/*.png` (đặt tên `idle_1..4`, `happy_1..4`, `eat_1..4`, `sad_1..2`, `evolve_1..3`; stage 2–5 có tiền tố `s{n}_`) và `client/src/pet/sprites.js` (object `SPRITES` chứa data URI).

---

## Deploy (GitHub Actions + Render)

App gồm backend Express (API + Gemini key) nên **không chạy được trên GitHub Pages**. Ở production, Express phục vụ luôn bản build `dist/`, vì vậy chỉ cần 1 web service.

1. Đẩy code lên GitHub (nhánh `main`). Workflow `.github/workflows/ci-cd.yml` tự chạy: `npm ci` → `npm test` → `npm run build` → smoke test server.
2. Trên [Render](https://render.com): **New → Blueprint** → chọn repo; Render đọc `render.yaml`.
3. Ở service vừa tạo: **Environment** → nhập `GEMINI_API_KEY`.
4. **Settings → Deploy Hook** → copy URL, rồi trên GitHub: **Settings → Secrets and variables → Actions** → tạo secret `RENDER_DEPLOY_HOOK_URL`.
5. Từ đó mỗi lần push lên `main`: test pass thì job `deploy` gọi hook và Render build và deploy.

> Lưu ý: gói free của Render dùng ổ đĩa tạm, nên SQLite được seed lại sau mỗi lần deploy/khởi động lại.

---

## 2. Bảng Ánh Xạ SPEC & Mã Nguồn (Traceability Matrix)

Mọi yêu cầu trong tài liệu [SPEC/](file:///d:/binem/SPEC/) đều tương ứng với mã nguồn cụ thể:

| Yêu cầu trong SPEC | File mã nguồn triển khai | Mô tả chi tiết |
|---|---|---|
| **Kiến trúc phân tầng BE** | [server/routes/api.routes.js](file:///d:/binem/server/routes/api.routes.js)<br>[server/controllers/](file:///d:/binem/server/controllers/)<br>[server/services/](file:///d:/binem/server/services/)<br>[server/repositories/](file:///d:/binem/server/repositories/) | Phân tầng rõ rệt: Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository. Tiêm phụ thuộc qua Constructor. |
| **Kiến trúc phân tầng FE** | [client/src/components/](file:///d:/binem/client/src/components/)<br>[client/src/services/api.js](file:///d:/binem/client/src/services/api.js)<br>[client/src/hooks/useFinanceData.js](file:///d:/binem/client/src/hooks/useFinanceData.js) | Tách bạch Component hiển thị, API Client và Custom Hook quản lý Reactive State. |
| **OOP Single Responsibility** | [server/models/Transaction.js](file:///d:/binem/server/models/Transaction.js)<br>[server/models/Budget.js](file:///d:/binem/server/models/Budget.js)<br>[server/services/budgetAlert.service.js](file:///d:/binem/server/services/budgetAlert.service.js) | Mỗi class 1 trách nhiệm duy nhất, tự kiểm định và tính toán hạn mức tiêu thụ. |
| **DSA 1: Gom tổng danh mục** | [server/dsa/categoryAggregator.js](file:///d:/binem/server/dsa/categoryAggregator.js) | Dùng cấu trúc `Map` tính tổng chi/thu theo từng danh mục trong 1 lần duyệt ($O(n)$ thời gian, $O(k)$ không gian). |
| **DSA 2: Top-K Khoản chi lớn** | [server/dsa/MinHeap.js](file:///d:/binem/server/dsa/MinHeap.js) | Cài đặt cấu trúc Min-Heap kích thước $k=5$ để trích xuất Top-5 khoản chi lớn nhất ($O(n \log k)$). |
| **DSA 3: Lọc khoảng ngày** | [server/dsa/binarySearch.js](file:///d:/binem/server/dsa/binarySearch.js) | Tìm mốc ngày `lower_bound` và `upper_bound` bằng Binary Search trên danh sách đã sắp xếp ($O(\log n + m)$). |
| **Cảnh báo ngân sách tức thì** | [server/services/budgetAlert.service.js](file:///d:/binem/server/services/budgetAlert.service.js)<br>[client/src/components/AlertBanner.jsx](file:///d:/binem/client/src/components/AlertBanner.jsx) | Ngay khi tạo chi tiêu, BE tính toán và trả về cảnh báo (80% hoặc 100%), UI hiển thị Banner/Toast tức thời. |
| **Cố vấn AI & Bot Sleeping** | [server/services/aiAdvisor.service.js](file:///d:/binem/server/services/aiAdvisor.service.js)<br>[client/src/components/AiSuggestions.jsx](file:///d:/binem/client/src/components/AiSuggestions.jsx) | Khi tương tác báo popup "Bot đng ngủ rồi", tự động hiển thị gợi ý định lượng theo quy tắc tài chính dự phòng. |
| **Validation & Error Handling** | [server/validators/](file:///d:/binem/server/validators/)<br>[server/middleware/errorHandler.js](file:///d:/binem/server/middleware/errorHandler.js) | Xác thực schema bằng Zod, bắt lỗi tập trung, không hardcode số liệu hay cấu hình. |
| **Quy chuẩn hàm $\le 30$ dòng** | Toàn bộ codebase | Mọi hàm đều được thiết kế ngắn gọn, tách nhỏ và đặt tên rõ nghĩa theo đúng ràng buộc kỹ thuật. |
