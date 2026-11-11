# SPEC 02: Kiến Trúc Hệ Thống (Architecture)

## 1. Mô hình Phân tầng (Layered Architecture)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc phân tầng và đảo ngược phụ thuộc (Dependency Injection):

```mermaid
graph TD
    subgraph Frontend ["Frontend (React + Vite)"]
        UI["UI Components (Dashboard, Form, BudgetList)"]
        State["State Management (Custom Hooks / Context)"]
        APIService["FE API Service (Fetch Client)"]
        UI --> State
        State --> APIService
    end

    subgraph Backend ["Backend (Node.js + Express)"]
        Route["Routes Layer (/api/v1/*)"]
        Controller["Controllers (Request Parsing, Validation)"]
        Service["Services (Business Logic, OOP, DSA)"]
        Repo["Repositories (Data Access / SQLite)"]
        
        Route --> Controller
        Controller --> Service
        Service --> Repo
    end

    subgraph External ["External & Storage"]
        DB[("SQLite Database")]
        Gemini["Google Gemini Flash API"]
    end

    APIService -->|HTTP JSON| Route
    Repo --> DB
    Service -->|Aggregated Data| Gemini
```

---

## 2. Phân công Trách nhiệm Từng Tầng

### 2.1 Backend
- **Route**: Định nghĩa endpoint URL, HTTP methods, và gắn middleware xác thực input.
- **Controller**: Trích xuất `req.body`, `req.query`, thực thi schema validation (Zod), gọi Service tương ứng và định dạng response HTTP (200, 201, 400, 500).
- **Service**:
  - Chứa 100% logic nghiệp vụ, tính toán cảnh báo ngân sách (`BudgetAlertService`), áp dụng cấu trúc dữ liệu (`AnalyticsService`), tích hợp AI & Fallback (`AiAdvisorService`).
  - Các dependency (Repo, AI Client) được truyền vào qua constructor (Dependency Injection).
- **Repository**: Thực thi các câu lệnh SQL trên SQLite, ánh xạ dữ liệu bảng thành đối tượng Domain.

### 2.2 Frontend
- **Components**: Chỉ đảm nhiệm hiển thị và nhận tương tác từ người dùng (dumb components & container components).
- **State Layer**: Lưu trữ danh sách giao dịch, ngân sách, cảnh báo vừa phát sinh, và kết quả gợi ý AI.
- **Service Layer**: Đóng gói các hàm gọi `fetch`, xử lý HTTP header, serialize query params, bắt lỗi mạng.

---

## 3. Luồng Xử lý Cảnh Báo Tức Thời (Instant Alert Flow)

Khi người dùng ghi nhận một khoản chi mới, hệ thống tính toán và phản hồi cảnh báo ngay trong kết quả của request tạo giao dịch:

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Form Giao Dịch
    participant API as BE Controller
    participant AlertSvc as BudgetAlertService
    participant Repo as Budget & Tx Repositories
    participant DB as SQLite

    User->>UI: Nhập khoản chi & bấm "Lưu"
    UI->>API: POST /api/v1/transactions
    API->>Repo: Lưu giao dịch mới
    Repo->>DB: INSERT INTO transactions
    API->>AlertSvc: checkAlert(categoryId, month, newAmount)
    AlertSvc->>Repo: Lấy ngân sách & tổng chi hiện tại
    Repo->>DB: SELECT budget & sum(expenses)
    DB-->>AlertSvc: budget = 2.000.000, current = 1.700.000 (85%)
    AlertSvc-->>API: Alert: WARNING_80 (đã đạt 85%)
    API-->>UI: 201 Created { transaction, alert: { level: 'WARNING_80', pct: 85 } }
    UI-->>User: Hiển thị Toast / Banner Cảnh báo Vàng (85%)
```

---

## 4. Luồng Dự Phòng AI (Gemini + Rule-Based Fallback)

Đảm bảo hệ thống không gián đoạn khi AI gặp sự cố:

```mermaid
flowchart TD
    Req[Yêu cầu gợi ý chi tiêu] --> Aggregate[Tổng hợp chi tiêu theo danh mục]
    Aggregate --> CheckNet{Có Gemini Key & Kết nối?}
    
    CheckNet -- Không --> RuleEngine[Kích hoạt Rule-Based Advisor]
    CheckNet -- Có --> CallGemini[Gọi Gemini Flash với Timeout 5s]
    
    CallGemini --> Eval{Phản hồi hợp lệ & đúng Schema?}
    Eval -- Có --> ReturnAI[Trả về gợi ý từ Gemini Flash]
    Eval -- Lỗi / Timeout / 429 --> RuleEngine
    
    RuleEngine --> ReturnRule[Trả về gợi ý theo luật cố định]
    ReturnAI --> Client[Trả về FE hiển thị]
    ReturnRule --> Client
```
