<div align="center">

# 🚀 Intern Management System (IMS)

**A microservices-based platform for managing interns, tasks, projects, attendance, leaves, and more.**

Built with **Node.js + Express** microservices behind an API Gateway, **MongoDB** & **PostgreSQL**, **RabbitMQ** for events, **Redis** for sessions/rate-limiting, and a **React + Vite** frontend.


</div>

---

## 📖 Overview

IMS is a full-stack, event-driven microservices system for running an internship program end-to-end: onboarding interns (with OTP-verified registration), assigning and tracking tasks and projects, managing attendance and leave, sending notifications and bulk emails, and giving admins analytics, audit logs, and configurable workflows — all behind a single API gateway.

Services communicate synchronously through the **gateway** (HTTP) and asynchronously through **RabbitMQ** (topic exchange `intern-management.topic`) for cross-service events like task assignment, attendance, leave approval, and audit logging.

---

## 🏗 Architecture

```
                              ┌────────────────────┐
                    ┌────────▶│   Frontend (Vite)   │
                    │         └────────────────────┘
                    │                    │
                    │                    ▼
                    │         ┌────────────────────┐
                    │         │   API Gateway       │  ── JWT verify, rate limiting,
                    │         │   (Express)          │     request proxying/logging
                    │         └──────────┬─────────┘
                    │                    │
      ┌─────────────┼─────────┬──────────┼──────────┬─────────────┬─────────────┐
      ▼             ▼         ▼          ▼          ▼             ▼             ▼
  ┌────────┐  ┌──────────┐┌────────┐┌─────────┐┌──────────┐┌─────────────┐┌───────────┐
  │  Auth  │  │  Intern  ││ Tasks  ││Projects ││  Config  ││ Notification││ Analytics │
  │Service │  │ Service  ││Service ││ Service ││ Service  ││   Service   ││  Service  │
  └────┬───┘  └────┬─────┘└───┬────┘└────┬────┘└────┬─────┘└──────┬──────┘└─────┬─────┘
       │            │          │          │          │             │             │
       └────────────┴──────────┴──────────┴──────────┴─────────────┴─────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │   RabbitMQ Topic   │  (intern-management.topic)
                              │      Exchange       │
                              └─────────┬─────────┘
                                        │
                                 ┌──────▼──────┐
                                 │ Audit Service│ (binds to '#', logs every event)
                                 └─────────────┘
```

Each service owns its own database (PostgreSQL or MongoDB — polyglot persistence) and communicates state changes via events rather than direct calls, keeping services loosely coupled.

---

## 🧩 Services

| Service | Port (default) | Database | Responsibility |
|---|---|---|---|
| **Gateway** | 5000 | Redis (rate limiting) | JWT verification, request proxying, rate limiting, structured access logs |
| **Auth Service** | 4001 | PostgreSQL + Redis | Registration (OTP via email), login, refresh tokens, session management, user listing |
| **Intern Service** | 4002 | PostgreSQL | Intern profiles, documents, skills, certificates, evaluations |
| **Tasks Service** | 4003 | MongoDB | Tasks, bulk task assignment, attendance, leave requests, work logs, calendar, deadline reminders |
| **Config Service** | 4004 | MongoDB | Feature toggles, settings, form schemas, workflow rules, permissions |
| **Projects Service** | 4005 | PostgreSQL | Projects, intern assignments (single + bulk), project status |
| **Notification Service** | 4006 | MongoDB | Email delivery (SMTP), in-app notifications, event-driven emails (OTP, welcome, task assigned, deadline reminders) |
| **Analytics Service** | 4007 | PostgreSQL | Productivity metrics, attendance summaries, project progress, overall stats |
| **Audit Service** | 4008 | MongoDB | Listens to *all* RabbitMQ events (`#`) and stores an immutable audit trail |

All services expose a `GET /health` endpoint and share the same event exchange (`intern-management.topic`) for pub/sub communication.

---

## ✨ Frontend Features

- 🔐 **Auth** — login, 2-step OTP registration, JWT with silent refresh, role-based routing (Admin/Manager vs. Intern)
- 📊 **Dashboards** — role-specific stats, quick actions, recent activity
- 👤 **Intern profile** — documents, skills, certificates, evaluations
- 📋 **Tasks** — filters, sorting, status updates, work logs, CSV/PDF export, bulk assignment
- 📁 **Projects** — CRUD, intern assignment (single & bulk with idempotency keys)
- 📈 **Analytics** — productivity & attendance charts (Recharts)
- 🔔 **Notifications** — in-app feed, admin bulk email
- ⚙️ **Admin config** — feature toggles, settings, form schemas, workflow rules, permissions
- 📜 **Audit logs** — filterable, paginated event trail
- 📅 **Calendar** — working days / holidays / non-working days
- 🌗 Dark mode, `Ctrl+K` global search, keyboard shortcuts, offline indicator, local draft autosave

---

## 🛠 Tech Stack

**Backend**
- Node.js, Express 5
- PostgreSQL (`pg`) & MongoDB (`mongoose`) — per-service polyglot persistence
- RabbitMQ (`amqplib`) — event bus
- Redis — sessions, OTP storage, rate limiting
- JWT (access + refresh tokens), bcrypt
- `http-proxy-middleware` — gateway routing
- Nodemailer — transactional email

**Frontend**
- React 19 + Vite
- React Router v7
- TanStack Query (server state) + Context API (auth)
- Tailwind CSS 4
- React Hook Form + Zod
- Recharts, Axios, react-hot-toast
- Papaparse / jsPDF — CSV & PDF export

---

## 📁 Project Structure

```
.
├── backend/
│   ├── gateway/                    # API Gateway (auth, rate limit, proxy)
│   └── services/
│       ├── auth-service/
│       ├── intern-service/
│       ├── tasks-service/
│       ├── config-service/
│       ├── projects-service/
│       ├── notification-service/
│       ├── analytics-service/
│       └── audit-service/
│           each service:
│           └── src/
│               ├── config/         # env, db, redis, rabbitmq
│               ├── controllers/
│               ├── middleware/     # auth, error handling, role guards
│               ├── models/         # (Mongo) or SQL migrations (Postgres)
│               ├── routes/
│               └── server.js
│
└── frontend/
    └── src/
        ├── components/             # layout + reusable UI
        ├── contexts/                # AuthContext
        ├── hooks/                   # useAuth, useDebounce, useLocalStorage...
        ├── pages/                   # admin/, intern/, tasks/, projects/, ...
        ├── routes/                  # ProtectedRoute, RoleBasedRoute
        ├── services/                 # one API client module per backend service
        └── lib/                     # axios instance, react-query client
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL instance
- MongoDB instance
- Redis instance
- RabbitMQ instance
- SMTP credentials (for the notification service)

### 1. Clone & install root tooling
```bash
git clone https://github.com/<your-username>/intern-management-system.git
cd intern-management-system
npm install   # installs `concurrently` used by start:all
```

### 2. Install dependencies per service
```bash
for d in backend/gateway backend/services/*/ frontend; do
  (cd "$d" && npm install)
done
```

### 3. Configure environment variables

Each service reads its own `.env` (see [Environment Variables](#-environment-variables) below). Create one `.env` per service directory.

### 4. Run everything at once (backend)
```bash
npm run start:all
```
This uses `concurrently` to boot the gateway and all 8 services together with colored, labeled logs.

Or run a single service during development:
```bash
cd backend/services/tasks-service
npm run dev
```

### 5. Run the frontend
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173` and will talk to the gateway at the URL configured in `frontend/.env` / `vite.config.js` proxy.

---

## 🔑 Environment Variables

### Gateway (`backend/gateway/.env`)
```env
PORT=5000
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE_URL=http://localhost:4001
INTERN_SERVICE_URL=http://localhost:4002
TASKS_SERVICE_URL=http://localhost:4003
CONFIG_SERVICE_URL=http://localhost:4004
PROJECTS_SERVICE_URL=http://localhost:4005
NOTIFICATION_SERVICE_URL=http://localhost:4006
ANALYTICS_SERVICE_URL=http://localhost:4007
AUDIT_SERVICE_URL=http://localhost:4008
```

### Auth Service
```env
PORT=4001
DATABASE_URL=postgres://user:pass@localhost:5432/ims_auth
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
RABBITMQ_HOST=localhost
JWT_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
INTERNAL_API_KEY=shared_secret_for_service_to_service_calls
```

### Intern / Projects / Analytics Services (PostgreSQL-backed)
```env
PORT=<service-port>
DATABASE_URL=postgres://user:pass@localhost:5432/ims_<service>
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
JWT_SECRET=change_me
```

### Tasks / Config / Audit Services (MongoDB-backed)
```env
PORT=<service-port>
MONGODB_URI=mongodb://localhost:27017/ims_<service>
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
JWT_SECRET=change_me
```

### Notification Service
```env
PORT=4006
MONGODB_URI=mongodb://localhost:27017/ims_notifications
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
JWT_SECRET=change_me
AUTH_SERVICE_URL=http://localhost:4001
INTERNAL_API_KEY=shared_secret_for_service_to_service_calls
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL_FROM="IMS <no-reply@example.com>"
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

> All required env vars are validated on boot — each service will throw and exit immediately if a required key is missing, so misconfiguration fails fast instead of silently.

---

## 🔌 Gateway Routing

| Path prefix | Proxied to |
|---|---|
| `/auth/*` | Auth Service |
| `/intern/*` | Intern Service |
| `/tasks/*` | Tasks Service |
| `/config/*` | Config Service |
| `/projects/*` | Projects Service |
| `/notifications/*` | Notification Service |
| `/analytics/*` | Analytics Service |
| `/audit/*` | Audit Service |

`GET /health`, and everything under `/auth`, is public; all other routes require a valid JWT (verified against the auth service). Bulk endpoints (`/tasks/bulk-assign`, `/projects/:id/interns/bulk`) get a separate, more permissive rate limit than the rest of the API.

---

## 📡 Event Catalog (RabbitMQ)

Selected routing keys published on `intern-management.topic`:

| Routing key | Published by | Consumed by |
|---|---|---|
| `auth.otp.requested` | Auth | Notification |
| `auth.user.registered` | Auth | Notification, Audit |
| `auth.user.loggedin` | Auth | Notification, Audit |
| `tasks.task.assigned` | Tasks | Notification, Analytics, Audit |
| `tasks.task.completed` | Tasks | Analytics, Audit |
| `tasks.tasks.bulkAssigned` | Tasks | Audit |
| `tasks.attendance.checkin` / `.checkout` | Tasks | Analytics, Audit |
| `tasks.leave.applied` / `.updated` | Tasks | Analytics, Audit |
| `tasks.deadline.reminder` | Tasks (scheduled job) | Notification |
| `calendar.day.updated` | Tasks | Notification |
| `projects.project.created` | Projects | Analytics, Audit |
| `projects.intern.assigned` / `.interns.bulkAssigned` | Projects | Notification, Audit |
| `intern.*` (documents, skills, certificates, evaluations) | Intern | Audit |

The **Audit Service** binds a queue to `#` (all routing keys) and persists every event for compliance/traceability.

---

## 🧪 Health Checks

Every service exposes:
```
GET /health → { "status": "ok" }
```
Useful for container orchestrators / load balancer liveness checks.

---


<div align="center">Built as a microservices reference implementation for internship program management.</div>
