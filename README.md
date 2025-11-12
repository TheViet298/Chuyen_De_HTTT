
# CRM Dashboard Starter
### (Node.js + Express + Prisma + SQLite + Power BI)

---

## Tổng quan

Dự án **CRM Dashboard chăm sóc khách hàng (Customer Relationship Management)** giúp theo dõi hiệu suất xử lý vé hỗ trợ (Ticket), thời gian phản hồi và mức độ tuân thủ SLA của từng Agent.  
Giải pháp gồm 2 phần chính:

1. **Backend API**: Xây dựng bằng **Node.js + Express + Prisma ORM + SQLite**, có khả năng xuất dữ liệu KPI ra file CSV.  
2. **Power BI Dashboard**: Trực quan hóa dữ liệu KPI từ CSV với các biểu đồ và bộ lọc tương tác.

---

## 🧩 Mô hình ERD

```mermaid
erDiagram
  Customer ||--o{ Ticket : has
  Agent ||--o{ Ticket : assigned
  Ticket ||--o{ Comment : has

  Customer {
    Int id PK
    String name
    String email UNIQUE
    String phone
    DateTime createdAt
  }

  Agent {
    Int id PK
    String name
    String email UNIQUE
    DateTime createdAt
  }

  Ticket {
    Int id PK
    String title
    String description
    TicketStatus status
    Priority priority
    DateTime createdAt
    DateTime updatedAt
    DateTime dueAt
    DateTime closedAt
    DateTime firstResponseAt
    Int slaMinutes
    Int customerId FK
    Int agentId FK
  }

  Comment {
    Int id PK
    String content
    DateTime createdAt
    AuthorType authorType
    Int ticketId FK
    Int agentId FK
  }
````

---

## Hướng dẫn chạy dự án

### 1️. Cài đặt & khởi tạo cơ sở dữ liệu

```bash
# Cài đặt thư viện
npm install

# Tạo database và client Prisma
npx prisma migrate dev --name init

# Sinh dữ liệu mẫu
npm run seed

# Chạy server
npm run dev
# -> http://localhost:3000/
```

### 2️. Các API chính

| Endpoint                     | Mô tả                                  |
| ---------------------------- | -------------------------------------- |
| `GET /tickets`               | Danh sách ticket                       |
| `GET /tickets/:id`           | Chi tiết ticket                        |
| `POST /tickets`              | Tạo ticket mới                         |
| `PATCH /tickets/:id`         | Cập nhật ticket                        |
| `POST /tickets/:id/comments` | Thêm comment                           |
| `GET /kpi/response`          | KPI phản hồi                           |
| `GET /kpi/sla`               | KPI SLA                                |
| `GET /kpi/status`            | Thống kê theo trạng thái               |
| `GET /kpi/workload`          | Phân bổ công việc theo Agent           |
| `GET /kpi/trend/daily`       | Xu hướng ticket theo ngày              |
| `POST /kpi/export`           | Xuất 5 file CSV vào thư mục `/exports` |

Sau khi export xong, có thể truy cập:

>  [http://localhost:3000/exports/](http://localhost:3000/exports/)

---

## Cấu trúc thư mục chính

```
crm-dashboard-starter/
├── prisma/
│   ├── schema.prisma
│   ├── dev.db
│   └── seed.js
├── src/
│   ├── routes/
│   │   ├── tickets.js
│   │   ├── kpi.js
│   │   └── utils.js
│   ├── jobs/
│   │   ├── exportCsv.js
│   │   └── slaChecker.js
├── exports/
│   ├── response_stats.csv
│   ├── sla_stats.csv
│   ├── tickets_by_status.csv
│   ├── tickets_trend_daily.csv
│   └── workload_by_agent.csv
└── crm_dashboard.pbix   ← file Power BI
```

---

## Power BI Dashboard

### Cấu hình dữ liệu

* `Get Data → Folder → chọn ./exports`
* Kết hợp 5 file CSV thành các bảng dữ liệu:

  * `response_stats`
  * `sla_stats`
  * `tickets_by_status`
  * `workload_by_agent`
  * `tickets_trend_daily`

### Tạo DateTable

```DAX
DateTable = CALENDAR(DATE(2025,1,1), DATE(2025,12,31))
```

Kết nối `DateTable[Date]` với các bảng có cột `Date`.

---

### Các Measure KPI (DAX)

```DAX
Response Rate % = AVERAGE(response_stats[response_rate_pct])
Avg First Response (min) = AVERAGE(response_stats[avg_first_response_min])
SLA OK % = AVERAGE(sla_stats[sla_ok_pct])
Overdue % = 100 - [SLA OK %]
LastRefresh = "Last refresh: " & FORMAT(NOW(), "dd/MM/yyyy HH:mm")
```

---

### Thành phần trong Dashboard

| Thành phần                                               | Nguồn dữ liệu       | Ghi chú                        |
| -------------------------------------------------------- | ------------------- | ------------------------------ |
| Response Rate %, Avg First Response, SLA OK %, Overdue % | Measures            | 4 KPI Cards                    |
| Tickets by Status                                        | tickets_by_status   | Bar Chart                      |
| Workload by Agent                                        | workload_by_agent   | Bar Chart                      |
| Tickets Trend Daily                                      | tickets_trend_daily | Line Chart                     |
| Lọc thời gian                                            | DateTable[Date]     | Slicer ngày bắt đầu – kết thúc |
| Last Refresh                                             | Measure             | Thời điểm cập nhật dữ liệu     |

---

## Data Dictionary

| File                    | Cột                    | Kiểu   | Mô tả                             |
| ----------------------- | ---------------------- | ------ | --------------------------------- |
| response_stats.csv      | response_rate_pct      | Float  | % tỷ lệ phản hồi                  |
|                         | avg_first_response_min | Int    | Phút phản hồi đầu tiên trung bình |
| sla_stats.csv           | sla_ok_pct             | Float  | % vé đạt SLA                      |
|                         | overdue_rate_pct       | Float  | % vé trễ SLA                      |
| tickets_by_status.csv   | status                 | String | OPEN, RESOLVED, CLOSED...         |
|                         | cnt                    | Int    | Số lượng ticket                   |
| workload_by_agent.csv   | agent                  | String | Tên agent                         |
|                         | open_cnt               | Int    | Số vé đang xử lý                  |
| tickets_trend_daily.csv | Date                   | Date   | Ngày tạo                          |
|                         | Số Vé                  | Int    | Tổng vé theo ngày                 |

---

## Cập nhật dữ liệu

Dashboard hoạt động ở **Import mode**:

* Mỗi lần export mới bằng `POST /kpi/export` hoặc `npm run export`, các CSV được ghi đè.
* Trong Power BI → **Refresh** là cập nhật số liệu mới.
* Có thể bật **Scheduled Refresh** nếu publish lên Power BI Service.

---

## Cron job tự động

* Chạy mỗi **5 phút** để đánh dấu ticket quá hạn (`OVERDUE`).
* Cấu hình trong `.env`:

```bash
EXPORT_DIR=./exports
PORT=3000
CRON_SCHEDULE=*/5 * * * *
```

---

## Kết quả hiện tại

✅ API hoạt động đầy đủ
✅ CSV export tự động
✅ Power BI dashboard hiển thị:

* 4 KPI chính
* Biểu đồ trạng thái, workload, xu hướng ngày
* Slicer lọc thời gian
* Thẻ “Last Refresh” hiển thị giờ cập nhật

 **Dự án đạt mức độ “Hoàn thiện Phase 1 – Báo cáo giữa kỳ”**

---

## Hướng phát triển tiếp theo

*  Kết nối trực tiếp PostgreSQL (DirectQuery mode)
*  KPI theo tháng / quý (MTD, QTD)
*  Drill-through chi tiết ticket theo agent
*  Alert Overdue % > ngưỡng (qua Power BI Service)

---

## Công nghệ sử dụng

| Thành phần | Công nghệ         |
| ---------- | ----------------- |
| Backend    | Node.js + Express |
| ORM        | Prisma ORM        |
| Database   | SQLite (`dev.db`) |
| Scheduler  | node-cron         |
| Export     | fast-csv          |
| Dashboard  | Power BI Desktop  |

---

##  Tài liệu & tham khảo

* [Prisma ORM Docs](https://www.prisma.io/docs)
* [Express.js](https://expressjs.com/)
* [Power BI Desktop](https://powerbi.microsoft.com/desktop)
* [DAX CALENDAR()](https://learn.microsoft.com/en-us/dax/calendar-function-dax)

---

 **By:** VietN.B21DVCN195 | **Phiên bản:** v1.0 — Hoàn thiện phase giữa kỳ
