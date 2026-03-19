# 🚀 Intern Management System – Frontend

A modern, enterprise‑grade frontend for an Intern Management System, built with **React + Vite**. It integrates with a microservices backend via a single API gateway, supports two roles (**Admin** and **Intern**), and provides a rich set of features including authentication (OTP), dashboards, task/project management, attendance, leaves, notifications, analytics, configuration tools, and audit logs. The UI is fully responsive, uses **Tailwind CSS** for styling, **lucide-react** for icons, and includes many client‑side enhancements (dark mode, keyboard shortcuts, export, etc.).

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

## 🛠 Tech Stack

| Category          | Technology                                                                 |
|-------------------|----------------------------------------------------------------------------|
| Core              | React 18, Vite                                                             |
| Routing           | React Router v6                                                            |
| Styling           | Tailwind CSS                                                               |
| Icons             | lucide‑react                                                               |
| State Management  | Context API (auth), TanStack Query (server state)                          |
| HTTP Client       | Axios (with interceptors for auth & refresh)                               |
| Forms             | react‑hook‑form + zod                                                      |
| Charts            | recharts                                                                   |
| Dates             | date‑fns                                                                   |
| Notifications     | react‑hot‑toast                                                            |
| Calendar          | react‑big‑calendar (optional)                                              |
| Onboarding        | react‑joyride (optional)                                                   |
| PWA               | vite‑plugin‑pwa                                                            |
| Drag‑drop         | react‑grid‑layout (optional)                                               |
| CSV/PDF export    | papaparse, jspdf, jspdf-autotable                                         |
| Virtualization    | tanstack‑virtual (optional)                                                |

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

Set up environment variables
Create a .env file in the root



