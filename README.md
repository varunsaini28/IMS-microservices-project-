# 🚀 Intern Management System – Frontend

A modern, enterprise‑grade frontend for an Intern Management System, built with **React + Vite**. It integrates with a microservices backend via a single API gateway, supports two roles (**Admin** and **Intern**), and provides a rich set of features including authentication (OTP), dashboards, task/project management, attendance, leaves, notifications, analytics, configuration tools, and audit logs. The UI is fully responsive, uses **Tailwind CSS** for styling, **lucide-react** for icons, and includes many client‑side enhancements (dark mode, keyboard shortcuts, export, etc.).

---

## 📚 Table of Contents

- [Features](#-features)
- [Backend Architecture](#-backend-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Integration (Services)](#-api-integration-services)
- [Running the App](#-running-the-app)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## ✨ Features

### 🔐 Authentication & User Onboarding
- Login with email/password
- 2‑step registration with OTP (email verification)
- OTP resend functionality
- JWT-based session management with automatic token refresh
- Role‑based redirects (Admin → `/admin`, Intern → `/intern`)

### 📊 Role‑Based Dashboards
#### Admin Dashboard
- Summary cards: total interns, active projects, pending leaves, task completion rate
- Recent activities (audit logs, notifications)
- Quick actions: create project, assign task, mark attendance, send bulk email

#### Intern Dashboard
- Personal stats: tasks assigned/completed this week, attendance %, upcoming deadlines
- Quick links to tasks, projects, notifications

### 👤 Intern Profile Management
- View/edit personal details (first/last name, DOB, phone, address)
- Upload/download documents
- Manage skills (add/remove)
- View certificates (read‑only) – admin can upload
- View evaluations (read‑only) – admin can create

### 📋 Task Management
- List tasks with filters (status, project, assignedTo)
- Create/edit tasks (admin)
- Update task status (intern)
- Work logs (add/edit/delete)
- Attendance: intern view history, admin view all & mark attendance
- Leave requests: intern apply/delete, admin approve/reject

### 📁 Project Management
- List projects (admin sees all, interns see assigned)
- Project details with assigned interns
- Create/edit projects (admin)
- Assign/remove interns to/from projects (admin)
- Bulk assign interns with idempotency key

### 📈 Analytics & Reporting
- Intern: personal productivity charts (tasks over time, work hours)
- Admin: overall stats, project progress, attendance summaries
- Charts built with **recharts**

### 🔔 Notifications
- Notification bell with unread count
- Dropdown of recent notifications
- Full notifications page with “mark all read”
- Admin bulk email to interns

### ⚙️ Configuration & Admin Tools
- Feature toggles (CRUD)
- Settings (key‑value)
- Form schemas (JSON schema editor)
- Workflow rules (status transitions, required fields)
- Permissions (role‑resource‑actions)

### 📜 Audit Logs (Admin only)
- Table with routing key, event data, timestamp
- Filter by routing key and date range
- Pagination

### 📅 Calendar
- Monthly view showing working days, holidays, non‑working days
- Admin can set day types with labels

### 👥 User Management (Admin only)
- List all users with role, email, full name
- Filter by role

### 🧩 Frontend‑Only Enhancements
- **Dark mode** toggle (persisted in localStorage)
- **Keyboard shortcuts** (`Ctrl+N` new task, `Ctrl+K` global search, `?` help)
- **Data export** to CSV/PDF
- **Form draft autosave** (localStorage)
- **Undo/redo** for destructive actions
- **Bulk actions** with selection
- **Global search** (client‑side)
- **Guided tour** for first‑time users
- **Activity timeline** (personal feed)
- **Session timeout warning** with extend option
- **CSV import** for bulk task/project creation (admin)
- **Customizable dashboard widgets** (drag‑drop, save layout)
- **In‑app documentation & tooltips**
- **Virtualized lists** for large tables
- **Code splitting & prefetching** for performance
- **PWA** – offline support, installable

---

## 🏗 Backend Architecture

The frontend communicates exclusively with a **single API Gateway** that routes requests to the appropriate microservice. The backend consists of the following **8+ microservices**:

| Service          | Prefix          | Description                                                                 |
|------------------|-----------------|-----------------------------------------------------------------------------|
| **Auth Service**   | `/auth`         | Handles authentication, user registration (OTP), token refresh, user listing |
| **Intern Service** | `/intern`       | Manages intern profiles, documents, skills, certificates, evaluations       |
| **Tasks Service**  | `/tasks`        | Manages tasks, attendance, leaves, work logs, calendar                      |
| **Projects Service**| `/projects`     | Manages projects and intern assignments (bulk assign, remove)               |
| **Analytics Service**| `/analytics`    | Provides analytics endpoints for productivity, project progress, etc.       |
| **Notifications Service**| `/notifications`| Handles in‑app notifications and bulk email sending                        |
| **Config Service** | `/config`       | Manages feature toggles, settings, form schemas, workflow rules, permissions|
| **Audit Service**  | `/audit`        | Stores and retrieves audit logs for all significant events                  |

All services are behind the gateway, e.g., `https://ims-gatewayserver.onrender.com/auth/login`. This simplifies frontend integration and centralizes cross‑cutting concerns like CORS and rate limiting.

---

## 🛠 Tech Stack

| Category          | Technology                                                                 |
|-------------------|----------------------------------------------------------------------------|
| **Core**          | React 18, Vite                                                             |
| **Routing**       | React Router v6                                                            |
| **Styling**       | Tailwind CSS                                                               |
| **Icons**         | lucide‑react                                                               |
| **State Management** | Context API (auth), TanStack Query (server state)                          |
| **HTTP Client**   | Axios (with interceptors for auth & refresh)                               |
| **Forms**         | react‑hook‑form + zod                                                      |
| **Charts**        | recharts                                                                   |
| **Dates**         | date‑fns                                                                   |
| **Notifications** | react‑hot‑toast                                                            |
| **Calendar**      | react‑big‑calendar (optional)                                              |
| **Onboarding**    | react‑joyride (optional)                                                   |
| **PWA**           | vite‑plugin‑pwa                                                            |
| **Drag‑drop**     | react‑grid‑layout (optional)                                               |
| **CSV/PDF export**| papaparse, jspdf, jspdf-autotable                                         |
| **Virtualization**| tanstack‑virtual (optional)                                                |

---

## 📦 Prerequisites

- **Node.js** 18+ and **npm** / **yarn**
- Backend services running (or accessible via the deployed gateway)
- A `.env` file with the gateway URL (see below)

---

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/intern-management-frontend.git
   cd intern-management-frontend

2. Install dependencies

npm install
# or
yarn

3. Set up environment variables
Create a .env file in the root (see Environment Variables).


🔗 API Integration (Services)
All API calls are organized into service modules inside src/services/. Each module corresponds to a backend microservice (via the gateway). All modules use the same api instance from src/lib/axios.js, which automatically attaches the JWT token and handles token refresh.

Service Module	File	Description
authApi	authApi.js	Login, register, verify, refresh, logout, me, users
internApi	internApi.js	Profile, documents, skills, certificates, evaluations
tasksApi	tasksApi.js	Tasks, attendance, leaves, worklogs, calendar
projectsApi	projectsApi.js	Projects, assignments, bulk assign
analyticsApi	analyticsApi.js	Analytics endpoints
notificationsApi	notificationsApi.js	Notifications, bulk email
configApi	configApi.js	Feature toggles, settings, schemas, workflows, permissions
auditApi	auditApi.js	Audit logs
Each method returns the data property from the axios response (i.e., the parsed JSON). Error handling is done in the components using react‑query or try/catch.


🏃 Running the App
Development: npm run dev (Vite dev server with HMR)

Production build: npm run build (outputs to dist/)

Preview production build: npm run preview


   
