<<<<<<< HEAD
# EduQueue: Web-Based Student Service Appointment & Queue Management System

**EduQueue** is an integrated academic student services platform developed for **St. Rita's College of Balingasag (SRCB)**. It unifies **Appointment-Based Scheduling** and **On-Demand Walk-In Queue Management** with real-time transactional Email API notifications.

---

## 🌟 Key System Features

### 1. Dual Service Architecture
- **Appointment-Based Services:** Time slot allocation, conflict-free booking, daily capacity limits, status lifecycle (`pending` → `approved` / `rejected` / `rescheduled` / `completed` / `cancelled`).
- **Queue-Based Services:** Daily automatic sequence ticketing (`REG-001`, `FIN-002`, `IT-003`), live queue position tracking, estimated wait time calculation, and staff counter desk terminal.
- **Public Display Monitor (`/display`):** Fullscreen lobby kiosk screen showing currently called tickets per counter, digital clock, and upcoming waiting lists.

### 2. Multi-Tiered Role-Based Access Control (RBAC)
- **Student:** Register, book appointments, join walk-in queues, view real-time line position, receive email & in-app alerts, manage profile.
- **Staff:** Process appointment requests (Approve with email confirmation, Decline with reason, Reschedule with revised date/time), counter desk calling (`Call Next Student`, `Start Serving`, `Complete`, `Skip No-Show`).
- **Administrator:** Comprehensive operational overview, service CRUD, operating hours & schedule configuration, account provisioning, audit logging, and transactional email dispatch monitoring.

### 3. Genuine Transactional Email API Integration
- Supports **Resend**, **Brevo (Sendinblue)**, **SendGrid**, standard **SMTP**, and **Log driver**.
- Automated HTML-formatted email notifications dispatched on:
  - Appointment Approval (Includes appointment code, date, time window, counter location, required prerequisites).
  - Appointment Decline (Includes official staff reason for decline).
  - Appointment Reschedule (Includes revised date, time, and instructions).
- Complete traceability with database logging in `email_logs`.

---

## 🏗️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6.
- **Backend:** PHP 8.2+ RESTful Architecture, MVC/Service Pattern, PDO Prepared Statements, JWT (HMAC-SHA256).
- **Database:** MySQL 8.0 (Normalized Relational Schema, Foreign Key Constraints, Indexes).
- **Deployment:** Ubuntu Server 22.04/24.04 LTS, Nginx, PHP-FPM, UFW Firewall, OpenSSH.

---

## 📁 Project Structure

```
WEB_SYSTEMG2/
├── frontend/                     # React + TypeScript + Vite Application
│   ├── src/
│   │   ├── components/common/    # Navbar, Sidebar, Modal, Badge, NotificationBell
│   │   ├── context/              # AuthContext (JWT/Session), NotificationContext (Polling)
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Register
│   │   │   ├── public/           # PublicDisplay (Lobby TV Screen)
│   │   │   ├── student/          # StudentDashboard, ServicesCatalog, MyAppointments, MyQueueStatus
│   │   │   ├── admin/            # AdminDashboard, ServiceManagement, AppointmentManagement, QueueManagement, UserManagement, AuditLogs
│   │   │   └── shared/           # Profile
│   │   ├── services/             # api.ts (Typed HTTP Client with JWT interceptor)
│   │   ├── types/                # TypeScript Interfaces
│   │   ├── App.tsx               # Route Guards & RBAC Routing
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # PHP RESTful API
│   ├── public/
│   │   └── index.php             # API Front Controller & Router Dispatcher
│   ├── src/
│   │   ├── Core/                 # Database, JWT, Request, Response, Router, Env
│   │   ├── Middleware/           # AuthMiddleware, RoleMiddleware, CorsMiddleware
│   │   ├── Controllers/          # Auth, User, Service, Appointment, Queue, Notification, Dashboard, Audit
│   │   └── Services/             # AuthService, ServiceManager, AppointmentService, QueueService, EmailService, NotificationService, AuditService
│   ├── storage/                  # Logs & temporary files
│   ├── .env.example
│   └── .env
│
├── database/                     # MySQL Relational Schema & Seed Data
│   ├── schema.sql                # Complete DDL tables & indexes
│   └── seeds.sql                 # Initial seed accounts & services
│
├── deploy/                       # Ubuntu Server Deployment Assets
│   ├── nginx.conf                # Production virtual host configuration
│   ├── setup_server.sh           # Automated provisioning script
│   └── eduqueue-cron             # Background cron jobs
│
├── DEPLOYMENT.md                 # Complete Ubuntu Server Deployment Guide
└── README.md
```

---

## 🚀 Quick Start Guide (Local Development)

### 1. Database Setup
Ensure MySQL is running on port 3306, then import the database schema and seed data:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seeds.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Start the PHP built-in server or serve via Apache/Nginx
php -S localhost:8000 -t public
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Seed User Accounts

All seed accounts use the default password: **`password123`**

| Role | Email / Identifier | Description |
| :--- | :--- | :--- |
| **Administrator** | `admin@srcb.edu.ph` | Full system administration, service configuration, user management, audit logs |
| **Staff Personnel** | `staff@srcb.edu.ph` | Appointment approval/rescheduling, Queue counter calling & servicing |
| **Student 1** | `student1@srcb.edu.ph` (ID: `2026-0001`) | BSIT 3rd Year Student Account |
| **Student 2** | `student2@srcb.edu.ph` (ID: `2026-0002`) | BSBA 2nd Year Student Account |

*(Quick demo fill buttons are also provided on the Login page for one-click testing)*

---

## 📡 REST API Reference

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Student account self-registration |
| `POST` | `/api/auth/login` | Public | User authentication & JWT issuance |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update personal profile |
| `PUT` | `/api/auth/password` | Authenticated | Change account password |
| `GET` | `/api/services` | Authenticated | List all active student services |
| `GET` | `/api/services/{id}/slots` | Public / Auth | Compute available appointment slots for a date |
| `POST` | `/api/appointments` | Student | Book a new service appointment |
| `GET` | `/api/appointments` | Authenticated | List appointments (Student: own; Staff: all) |
| `PUT` | `/api/appointments/{id}/status` | Staff / Admin | Approve, Decline, or Reschedule appointment (Triggers Email) |
| `PUT` | `/api/appointments/{id}/cancel` | Student | Cancel student's own pending booking |
| `POST` | `/api/queue/join` | Student | Join walk-in queue and get daily ticket number |
| `GET` | `/api/queue/my-active` | Student | Get real-time position of student's active tickets |
| `POST` | `/api/queue/service/{id}/call-next` | Staff / Admin | Call the next waiting ticket to the counter desk |
| `PUT` | `/api/queue/{id}/status` | Staff / Admin | Update queue ticket status (`serving`, `completed`, `skipped`) |
| `GET` | `/api/public/queue/display` | Public | Live feed for campus lobby monitors |
| `GET` | `/api/dashboard/stats` | Authenticated | Real-time KPIs & 7-day volume analytics |
| `POST` | `/api/services` | Admin | Create new institutional service |
| `GET` | `/api/users` | Admin | Manage user accounts & permissions |
| `GET` | `/api/audit-logs` | Admin | Query system audit trail and Email logs |

---

## 🔒 Security Best Practices Implemented

- **Password Hashing:** Standard `PASSWORD_BCRYPT` with cost factor 10.
- **SQL Injection Defense:** Strict PDO prepared statements across all database queries.
- **Role-Based Authorization:** Server-side `AuthMiddleware` and `RoleMiddleware` route protection.
- **Secret Isolation:** All database credentials, JWT secrets, and Email API keys reside exclusively in backend `.env` variables and are never exposed to the frontend.
- **Transactional Integrity:** Fail-safe email logging where email delivery issues never break primary appointment or queue database transactions.

---

## 🖥️ Ubuntu Server Production Deployment

For complete instructions on deploying with **Ubuntu Server, Nginx, PHP-FPM, MySQL, OpenSSH, and UFW Firewall**, refer to [DEPLOYMENT.md](DEPLOYMENT.md) or run the automated script in [deploy/setup_server.sh](deploy/setup_server.sh).
=======
# SRCB-Web-Based-Student-Service-Appointment-and-Queue-Management-System-
ANOTHER PROJECT NANAMAN, ARAYYYY KOOOOO
>>>>>>> 4545d1076c66a65fcb6f43af0d3e08f4b227c75c
