# CRM Dashboard Starter (Node.js + Express + Prisma + SQLite + Power BI CSV)

## ERD
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
```

## Quickstart

```bash
# 1) Install deps
npm install

# 2) Create DB and generate client
npx prisma migrate dev --name init

# 3) Seed sample data
npm run seed

# 4) Run server
npm run dev
# -> http://localhost:3000/

# 5) Check APIs
GET  /tickets
POST /tickets
GET  /tickets/:id
PATCH /tickets/:id
POST /tickets/:id/comments

# 6) KPI + CSV export
GET  /kpi/response
GET  /kpi/sla
GET  /kpi/status
GET  /kpi/workload
GET  /kpi/trend/daily

POST /kpi/export   # writes CSV files into ./exports
# After export, you can browse http://localhost:3000/exports/ to download CSVs

# 7) Power BI
# In Power BI: Get Data -> Folder -> point to ./exports
# then build visuals using the 5 CSVs.
```

## Notes
- Cron job runs every 5 minutes to mark overdue tickets.
- `.env` has `EXPORT_DIR`, `PORT`, and cron expression.
- Keep scope aligned with the course requirement (MVP: API + CSV + Power BI).
