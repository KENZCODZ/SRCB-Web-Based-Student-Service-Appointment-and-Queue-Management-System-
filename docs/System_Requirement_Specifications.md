# St. Rita's College of Balingasag, Inc.
**Higher Education Department | Information Technology Program**

---

# System Requirement Specifications (SRS)
## EduQueue: Web-Based Student Service Appointment and Queue Management System

**Document Version:** 1.2 (Current Implemented State)  
**Academic Year:** S.Y. 2025–2026  
**Capstone & Web Systems Project | Group 2**  
**St. Rita's College of Balingasag, Inc.**  
*Balingasag, Misamis Oriental, Philippines*  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the definitive, operational System Requirement Specifications (SRS) for the **EduQueue: Web-Based Student Service Appointment and Queue Management System**. Developed specifically for **St. Rita's College of Balingasag (SRCB)**, EduQueue is a production-ready, full-stack enterprise web application designed to resolve campus queue congestion, eliminate manual paper logbooks, prevent double bookings, and streamline communication between students and institutional offices.

This document serves as the formal technical agreement and evaluation benchmark for academic defense panels, software engineers, system administrators, department heads (Registrar, Dean's Office, Guidance, Finance/Cashier, IT Helpdesk, and Library), and student users.

### 1.2 Project Scope
EduQueue integrates two core academic service delivery models into a unified, responsive single-page application (SPA):
1. **Scheduled Online Appointments:** For high-touch, consultation-heavy transactions (e.g., Transcript of Records issuance, Dean's Academic Advising, Guidance Counseling, Good Moral Certification) featuring dynamic time-slot allocation and conflict prevention.
2. **On-Demand Walk-In Queue Management:** For high-volume, rapid-turnaround counter operations (e.g., Tuition Payments, RFID/ID Validation, Semester Clearance Signing, Library Circulation) featuring daily sequential ticketing (`REG-001`, `FIN-002`) and live estimated wait calculations.
3. **Public Lobby TV Display Monitor (`/display`):** Dedicated unauthenticated fullscreen kiosk interface for waiting area TV monitors broadcasting called tickets, counter windows, audio turn alerts, upcoming waiting lists, and a live institutional clock.
4. **Staff Counter Operations Terminal:** Desk calling interface providing one-click "Call Next Student", "Start Serving", "Mark Completed", and "Skip / No-Show" actions.
5. **Multi-Driver Transactional Email Engine:** Automated HTML-formatted dispatch supporting Resend, Brevo, SendGrid, standard SMTP, and a local fail-safe log driver for appointment approval vouchers, reschedule advisories, and cancellation notices.
6. **Executive Administration & Auditing:** Comprehensive KPI metrics, 7-day volume comparative charts, service and weekly schedule matrix configuration, user provisioning, and immutable audit logging.

### 1.3 Definitions, Acronyms, and Abbreviations
* **SRCB:** St. Rita's College of Balingasag, Inc.
* **BSIT:** Bachelor of Science in Information Technology
* **SRS:** System Requirement Specifications
* **UI / UX:** User Interface / User Experience
* **HCI:** Human-Computer Interaction
* **WCAG:** Web Content Accessibility Guidelines (W3C standard)
* **REST:** Representational State Transfer
* **API:** Application Programming Interface
* **JWT:** JSON Web Token (RFC 7519) — compact stateless authentication token
* **RBAC:** Role-Based Access Control (`admin`, `staff`, `student`)
* **PDO:** PHP Data Objects — secure abstraction layer utilizing parameterized prepared statements
* **3NF:** Third Normal Form — relational database schema normalization standard
* **CORS:** Cross-Origin Resource Sharing
* **KPI:** Key Performance Indicator
* **ETA:** Estimated Time of Arrival / Estimated Wait Time

### 1.4 References
1. St. Rita's College of Balingasag, Inc. (2025). *Higher Education Department Capstone Project Manual and Software Development Guidelines*. Balingasag, Misamis Oriental.
2. World Wide Web Consortium (W3C). (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
3. Mozilla Developer Network (MDN). (2024). *Web APIs, HTTP Headers, and Modern JavaScript Reference*. https://developer.mozilla.org
4. Internet Engineering Task Force (IETF). (2015). *RFC 7519: JSON Web Token (JWT)*. https://datatracker.ietf.org/doc/html/rfc7519
5. Open Web Application Security Project (OWASP). (2023). *OWASP Top 10 Web Application Security Risks*. https://owasp.org
6. Nielsen, J. (1994). *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/

---

## 2. Overall Description

### 2.1 Real-World Campus Challenges & Digital Solutions

* **Challenge 1: Physical Hallway Congestion & Unpredictable Wait Times**
  * *Context:* During peak enrollment, clearance, and midterms, students stand in long, unorganized queues outside office windows without knowing how long they will wait.
  * *Solution:* Virtual walk-in ticketing with automated sequence generation (`FIN-001`, `REG-002`) and real-time personal line tracking showing exact students ahead and estimated wait minutes.
* **Challenge 2: Scheduling Conflicts & Double Bookings**
  * *Context:* Manual appointment logbooks lead to double-booked advising slots, scheduling overlaps, and staff overload.
  * *Solution:* Conflict-free slot engine calculating availability from weekly operating schedules, slot durations, and student-per-slot capacity limits.
* **Challenge 3: Lobby Noise & Missed Turns**
  * *Context:* Staff shouting student names over crowded hallways causes missed turns, confusion, and friction.
  * *Solution:* Synchronized Public Lobby Display (`/display`) for campus TV monitors paired with visual callouts and audio alerts.
* **Challenge 4: Communication Gaps & Wasted Campus Trips**
  * *Context:* When appointments are cancelled or rescheduled, students are unaware until arriving on campus.
  * *Solution:* Automated transactional HTML email dispatch (Resend, Brevo, SendGrid, SMTP) delivering vouchers, reschedule dates, or cancellation reasons.
* **Challenge 5: Administrative Opacity & Lack of Service Metrics**
  * *Context:* Department heads lack objective data on office turnaround times, daily volume, and peak bottleneck hours.
  * *Solution:* Centralized executive dashboard with real-time KPIs, 7-day throughput analytics, immutable security audit trails, and email delivery monitoring.

### 2.2 User Personas

#### Persona 1: The College Student ("Juan Dela Cruz")
* **Profile:** 20 years old, 3rd Year BSIT, working student balancing academics and work shifts.
* **Needs:** Book Transcript of Records (TOR) requests and Dean's advising without conflicting with classes; join the cashier queue virtually from anywhere on campus; receive email reminders and live turn alerts.
* **Pain Points:** Wasting hours in physical lines; ambiguous document requirements; missed turns when stepping out of the lobby.

#### Persona 2: The Department Staff ("Maria Santos")
* **Profile:** 34 years old, Administrative Staff at the Registrar's Office.
* **Needs:** View upcoming daily appointments in advance; call next walk-in student with one click; approve, decline, or reschedule requests with automated student notifications.
* **Pain Points:** Physical crowd pressure at counter windows; messy manual clearance forms; student disputes over queue positions.

#### Persona 3: The System Administrator & Dean ("Dr. Ernesto Ramos")
* **Profile:** 48 years old, Academic Administrator / IT Department Head.
* **Needs:** Define office operating hours, slot capacities, and counter windows; provision staff accounts; inspect system-wide audit logs and email delivery metrics; evaluate peak hour traffic.
* **Pain Points:** Inability to limit daily service quotas; absence of institutional compliance logs.

### 2.3 System Architecture & Operating Environment
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6.
* **Backend:** PHP 8.2+ native RESTful architecture following MVC and Service Layer patterns.
* **Database:** MySQL 8.0 normalized relational database (InnoDB, Foreign Key constraints, UTF-8mb4).
* **Network & API Protocol:** JSON over HTTP/HTTPS, stateless JWT authentication with symmetric HMAC-SHA256 signatures.
* **Deployment Platform:** Ubuntu Server 22.04/24.04 LTS, Nginx reverse proxy, PHP-FPM, UFW firewall, and OpenSSH.

---

## 3. System Features and Functional Requirements

### 3.1 Authentication, Authorization & Identity Management
* **FR1:** The system shall provide a registration interface allowing students to self-register with Student ID Number, First Name, Last Name, Email, Password, Contact Number, Degree Program / Course, and Year Level.
* **FR2:** The system shall enforce uniqueness validation for Student ID Numbers and Email addresses on both client and server sides.
* **FR3:** The system shall hash user passwords using standard `PASSWORD_BCRYPT` with cost factor 10.
* **FR4:** The system shall authenticate users via Email or Student ID Number combined with Password, returning a signed JWT token on success.
* **FR5:** The system shall enforce Role-Based Access Control (RBAC), restricting route access and API endpoints based on role (`admin`, `staff`, `student`).
* **FR6:** The system shall provide one-click demo login buttons on the authentication screen for rapid evaluative testing of Admin, Staff, and Student roles.
* **FR7:** The system shall allow authenticated users to update their personal contact details and academic program information.
* **FR8:** The system shall allow authenticated users to update their password upon verifying their current active password.
* **FR9:** The system shall provide secure session termination, invalidating local tokens and logging the logout event in the audit repository.

### 3.2 Institutional Service Catalog & Requirements
* **FR10:** The system shall display an institutional service catalog categorized by office (Registrar, Dean's Office, Guidance, Finance/Cashier, IT Helpdesk, Library).
* **FR11:** Each service card shall display its service classification (`appointment` vs `queue`), office counter location, estimated duration in minutes, daily capacity, and required prerequisite documents.
* **FR12:** The catalog shall provide instant client-side search and category filtering without requiring full page reloads.
* **FR13:** Clicking an appointment-based service shall launch the Appointment Booking modal; clicking a walk-in queue service shall launch the Join Queue modal.

### 3.3 Appointment Booking, Slot Engine & Conflict Management
* **FR14:** The system shall compute real-time available time slots for any chosen date based on service operating schedules (`service_schedules`), slot duration, and maximum student limits per slot.
* **FR15:** The slot computation engine shall automatically deduct existing active bookings (`pending`, `approved`, `rescheduled`) to ensure slots do not exceed capacity.
* **FR16:** The system shall prevent students from scheduling appointments on past dates or non-operating days (e.g., weekends or unscheduled weekdays).
* **FR17:** The system shall prevent students from holding more than one active appointment for the same service on the same date.
* **FR18:** The system shall generate a unique tracking code for every booking formatted as `APT-YYYYMMDD-XXXX` (e.g., `APT-20261019-A8F2`).
* **FR19:** The system shall provide a dedicated "My Appointments" portal where students can view their bookings filtered by status (`pending`, `approved`, `rejected`, `rescheduled`, `completed`, `cancelled`).
* **FR20:** The system shall allow students to cancel their own pending or approved appointments, immediately freeing the reserved time slot for other students.

### 3.4 Walk-In Queue Ticketing & Real-Time Position Tracking
* **FR21:** The system shall allow registered students to join an active queue-based service with one click.
* **FR22:** The system shall generate sequential daily ticket numbers with institutional service prefixes (e.g., `FIN-001`, `REG-002`, `IT-003`).
* **FR23:** The system shall enforce an anti-hoarding rule preventing a student from holding more than one active ticket (`waiting`, `calling`, `serving`) per service at the same time.
* **FR24:** The system shall reject new queue admissions once a service reaches its configured `max_daily_capacity`.
* **FR25:** The system shall calculate the student's real-time position in line (`ahead_in_line`) and estimated remaining wait time in minutes (`(ahead_in_line + 1) * duration`).
* **FR26:** The system shall display dynamic visual status badges (`waiting`, `calling`, `serving`, `completed`, `skipped`, `cancelled`) updating via 5-second polling.
* **FR27:** The system shall allow students to cancel their active queue tickets if they must leave campus.

### 3.5 In-App Notification Center & Alerts
* **FR28:** The system shall maintain an in-app notification center accessible via the header navigation bell.
* **FR29:** The system shall display an unread notification count badge that updates dynamically via background polling.
* **FR30:** The system shall generate automatic notifications for:
  - Appointment booking submission, approval, decline, and rescheduling.
  - Queue ticket issuance, calling to counter window, service completion, and skip notices.
* **FR31:** The system shall allow users to mark individual notifications as read or mark all notifications as read in a single action.

### 3.6 Staff Appointment Workbench & Transactional Email Dispatch
* **FR32:** The system shall provide staff with an Appointment Management workbench filterable by department, status, date, and student name or student ID.
* **FR33:** Staff shall be able to **Approve** pending appointments, transitioning the status to `approved` and triggering an automated HTML email confirmation voucher to the student.
* **FR34:** Staff shall be able to **Decline** appointments with mandatory reason input, transitioning the status to `rejected` and dispatching an official cancellation email with the justification.
* **FR35:** Staff shall be able to **Reschedule** appointments with revised date, start/end time, and staff notes, transitioning status to `rescheduled` and dispatching a reschedule advisory email.
* **FR36:** The email engine shall support Resend, Brevo, SendGrid, SMTP, and local log drivers, logging all dispatch attempts into `email_logs`.
* **FR37:** The system shall enforce fail-safe email handling: an external email delivery failure shall never break or roll back the primary appointment database transaction.

### 3.7 Staff Counter Desk Calling Terminal
* **FR38:** The system shall provide counter staff with an operational calling interface for their assigned service counter window.
* **FR39:** The system shall provide a **"Call Next Student"** action that selects the oldest waiting ticket, sets status to `calling`, assigns the staff counter window, and broadcasts immediately to the public display.
* **FR40:** The system shall allow staff to transition tickets to **"Start Serving"** (`serving`) upon student arrival at the desk.
* **FR41:** The system shall allow staff to finalize transactions by clicking **"Complete"** (`completed`) or record no-shows with **"Skip"** (`skipped`).
* **FR42:** The system shall record timestamps for `called_at`, `served_at`, and `completed_at` to enable office turnaround analytics.

### 3.8 Public Lobby Live TV Display Monitor (`/display`)
* **FR43:** The system shall provide a dedicated public route at `/display` accessible without user authentication for campus lobby TV screens.
* **FR44:** The display shall render high-contrast visual cards for every active counter desk indicating Counter Window, Ticket Number, and Service Name.
* **FR45:** The display shall provide animated visual callouts and audio chime alerts whenever a new ticket is called.
* **FR46:** The display shall feature an upcoming waiting list ticker summarizing waiting student counts and next-in-line tickets per department.
* **FR47:** The display shall render a live institutional digital clock and SRCB branding.
* **FR48:** The display shall automatically synchronize data via 5-second interval polling.

### 3.9 Administrator Executive Dashboard & Analytics
* **FR49:** The dashboard shall display live operational KPI cards: Total Appointments Today, Active Walk-In Queue Load, Completed Services, and Total Registered Users.
* **FR50:** The dashboard shall render a 7-Day Throughput Bar Chart comparing appointment volume against walk-in queue transactions.
* **FR51:** The dashboard shall render a breakdown of service utilization by academic department.
* **FR52:** The dashboard shall display an interactive live feed of recent system activities.

### 3.10 Service Catalog & Weekly Operating Schedule Matrix
* **FR53:** Administrators shall be able to create, update, and toggle active/inactive status for all institutional services.
* **FR54:** Administrators shall be able to configure weekly operating schedules (`service_schedules`) per service, defining operating day-of-week (Monday through Friday), time windows, slot duration (e.g., 15, 30, 45 minutes), and student capacity per slot.

### 3.11 User Provisioning & Account Access Control
* **FR55:** Administrators shall be able to view all registered accounts with role-based filtering (`student`, `staff`, `admin`) and real-time search.
* **FR56:** Administrators shall be able to provision new Staff or Administrator accounts directly with assigned department designations.
* **FR57:** Administrators shall be able to toggle user account status (`active` / `disabled`) to immediately grant or revoke system access.

### 3.12 System Audit Trail & Transactional Email Monitoring
* **FR58:** The system shall log all critical actions (user logins, failed logins, appointment status changes, queue state transitions, service edits) into `audit_logs` with User ID, Action Tag, Entity Type, Entity ID, Client IP, and JSON details.
* **FR59:** Administrators shall be able to search and inspect the audit log repository.
* **FR60:** Administrators shall be able to monitor all outbound transactional emails, viewing recipient email, subject, template, delivery status, timestamp, and JSON payloads.

---

## 4. Non-Functional Requirements (HCI Focus)

### 4.1 Usability & Human-Computer Interaction
* **NF1 (3-Click Navigation):** Any primary module (Services Catalog, Appointment Booking, Queue Status, Profile) shall be reachable within a maximum of 3 user clicks from the main navigation menu.
* **NF2 (Under 60-Second Booking):** The entire booking flow—discovering a service, picking an open time slot, entering purpose, and submitting—shall be completable in under 60 seconds by a first-time student user.
* **NF3 (Inline Validation & Immediate Feedback):** All forms (Registration, Login, Booking Modal, Service Editor) shall provide real-time inline validation with descriptive error feedback before network dispatch.
* **NF4 (Cohesive Design Language):** The interface shall utilize the SRCB institutional color palette: Deep Navy (`#1E3A8A`), Royal Blue (`#2563EB`), Emerald Green (`#10B981`), Amber (`#F59E0B`), Rose Red (`#EF4444`), and Slate (`#F8FAFC`).
* **NF5 (Zero-Coding Administration):** All operational adjustments (service hours, counter assignments, slot capacities) shall be configurable entirely through graphical UI modals without direct database manipulation.

### 4.2 Performance
* **NF6 (Sub-200ms API Execution):** Backend REST API endpoints shall execute and respond within 200 milliseconds under standard campus network loads.
* **NF7 (Client Rendering Speed):** Initial page loads shall render within 1.5 seconds on desktop browsers and under 3 seconds on standard mobile connections.
* **NF8 (Database Indexing Efficiency):** Key relational fields (`user_id`, `service_id`, `appointment_date`, `queue_date`, `status`, `created_at`) shall be indexed in MySQL, ensuring sub-10ms query times across datasets exceeding 50,000 records.
* **NF9 (Optimized Lightweight Polling):** Live queue trackers and notification badges shall utilize lightweight REST polling (5-second intervals) consuming negligible client and server CPU cycles.

### 4.3 Accessibility
* **NF10 (WCAG 2.1 Level AA Compliance):** All public, student, and administrative screens shall adhere to WCAG 2.1 Level AA standards.
* **NF11 (Color Contrast Ratio):** Body typography, headings, buttons, and alert badges shall maintain a minimum contrast ratio of 4.5:1 against their backgrounds.
* **NF12 (Full Keyboard Navigation):** All interactive elements (form fields, dropdowns, modal triggers, tab bars) shall be fully navigable and actionable using only keyboard inputs (`Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape`).
* **NF13 (Accessible Semantic HTML & ARIA):** Modals, alerts, and icons shall include appropriate ARIA attributes (`aria-label`, `aria-expanded`, `role="dialog"`, `role="alert"`) for full screen reader compatibility.

### 4.4 Compatibility & Responsiveness
* **NF14 (Cross-Browser Compatibility):** The application shall render identically and operate defect-free on current stable versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.
* **NF15 (Responsive Breakpoints):** The interface shall dynamically adapt across viewports from 320px (compact mobile), 768px (tablet), 1024px (laptop), to 1920px+ (large lobby TV displays) using Tailwind CSS responsive utilities.
* **NF16 (Touch Target Versatility):** All buttons and interactive touchpoints shall maintain minimum dimensions of 44x44 pixels for comfortable mobile touchscreen interaction.

### 4.5 Security
* **NF17 (SQL Injection Defense):** All database interactions across models and controllers shall strictly utilize PDO prepared statements with parameterized inputs. Emulated prepared statements shall be disabled (`PDO::ATTR_EMULATE_PREPARES = false`).
* **NF18 (Strong Password Hashing):** All user passwords shall be hashed using standard `PASSWORD_BCRYPT` with cost factor 10. Plaintext passwords shall never be persisted or logged.
* **NF19 (Stateless JWT Security):** All private API routes shall validate incoming HMAC-SHA256 JWT tokens via `AuthMiddleware`. Tokens shall carry standard expiration claims (24 hours) and be verified on every request.
* **NF20 (Role Authorization Enforcement):** Administrative and staff endpoints shall be guarded on the server side by `RoleMiddleware`, preventing unauthorized privilege escalation regardless of client state.
* **NF21 (XSS & Input Sanitization):** All incoming request payloads shall be sanitized and escaped upon output formatting (`htmlspecialchars(ENT_QUOTES, 'UTF-8')`).
* **NF22 (CORS & Header Security):** The backend API shall enforce explicit CORS origin headers and secure HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`).
* **NF23 (Secret Key Isolation):** All database passwords, JWT signing keys, and third-party mail API keys shall reside exclusively in server-side `.env` files and shall never be committed to source repositories or exposed to frontend bundles.

### 4.6 Reliability & Maintainability
* **NF24 (Layered Architectural Separation):** The backend codebase shall strictly enforce separation of concerns across `Core/` (Database, Router, JWT, Request/Response), `Middleware/` (Auth, Role, CORS), `Controllers/` (HTTP parameter handling), and `Services/` (business logic, transaction management, email dispatch).
* **NF25 (Single-Point Typed HTTP Client):** The frontend application shall channel all network interactions through a centralized API service module (`src/services/api.ts`) featuring typed TypeScript interfaces and automatic JWT authorization header injection.
* **NF26 (Transactional Fail-Safe Logging):** External email dispatch failures shall be captured gracefully and logged in `email_logs` without disrupting or rolling back primary appointment or queue database transactions.

---

## 5. Relational Database Schema Model

The system utilizes an indexed, normalized schema (`student_services_db`) adhering to Third Normal Form (3NF):

| Table Name | Description | Key Columns | Relationships / Constraints |
| :--- | :--- | :--- | :--- |
| **`users`** | Identity, authentication, and RBAC | `id`, `student_id_number`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `department_or_course`, `year_level`, `is_active` | Root entity; referenced by all operational tables |
| **`services`** | Institutional catalog of services | `id`, `name`, `code`, `category`, `service_type` (`appointment`\|`queue`), `location_or_counter`, `estimated_duration_mins`, `max_daily_capacity`, `requirements`, `is_active` | Referenced by schedules, appointments, queues |
| **`service_schedules`** | Weekly operating schedule matrix | `id`, `service_id`, `day_of_week` (0–6), `start_time`, `end_time`, `slot_duration_mins`, `max_students_per_slot`, `is_active` | `service_id` → `services(id)` ON DELETE CASCADE |
| **`appointments`** | Scheduled service reservations | `id`, `appointment_code`, `user_id`, `service_id`, `appointment_date`, `start_time`, `end_time`, `purpose`, `status`, `admin_notes`, `rejection_reason`, `processed_by` | `user_id` → `users(id)`, `service_id` → `services(id)`, `processed_by` → `users(id)` |
| **`queue_entries`** | Daily walk-in queue tickets | `id`, `queue_number`, `user_id`, `service_id`, `queue_date`, `sequence_number`, `status`, `counter_number`, `called_by`, `called_at`, `served_at`, `completed_at` | `user_id` → `users(id)`, `service_id` → `services(id)`, `called_by` → `users(id)` |
| **`notifications`** | In-app user notifications | `id`, `user_id`, `title`, `message`, `type`, `related_id`, `is_read`, `created_at` | `user_id` → `users(id)` ON DELETE CASCADE |
| **`email_logs`** | Transactional email audit logs | `id`, `recipient_email`, `recipient_name`, `subject`, `template`, `payload_json`, `status` (`sent`\|`failed`), `error_message`, `external_message_id` | Standalone audit monitor |
| **`audit_logs`** | System security and audit trail | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `details_json`, `ip_address`, `created_at` | `user_id` → `users(id)` ON DELETE SET NULL |

---

## 6. Requirements Traceability Matrix (RTM)

| Requirement ID | Module / Feature | Backend Controller / Service | Frontend Component / Page |
| :--- | :--- | :--- | :--- |
| **FR1 – FR9** | Auth, Profile & RBAC | `AuthController.php`, `AuthService.php`, `AuthMiddleware.php` | `Login.tsx`, `Register.tsx`, `Profile.tsx`, `AuthContext.tsx` |
| **FR10 – FR13** | Institutional Service Catalog | `ServiceController.php`, `ServiceManager.php` | `ServicesCatalog.tsx`, `ServiceModal.tsx` |
| **FR14 – FR20** | Appointment Booking & Slots | `AppointmentController.php`, `AppointmentService.php` | `MyAppointments.tsx`, `AppointmentModal.tsx` |
| **FR21 – FR27** | Walk-In Queue & Tracking | `QueueController.php`, `QueueService.php` | `MyQueueStatus.tsx`, `QueueModal.tsx` |
| **FR28 – FR31** | In-App Notification Center | `NotificationController.php`, `NotificationService.php` | `NotificationBell.tsx`, `NotificationContext.tsx` |
| **FR32 – FR37** | Staff Appointment Workbench & Mail | `AppointmentController.php`, `EmailService.php` | `AppointmentManagement.tsx` |
| **FR33 – FR42** | Staff Desk Calling Terminal | `QueueController.php`, `QueueService.php` | `QueueManagement.tsx` |
| **FR43 – FR48** | Public Lobby TV Kiosk | `QueueController.php::publicDisplay` | `PublicDisplay.tsx` |
| **FR49 – FR52** | Executive Analytics Dashboard | `DashboardController.php` | `AdminDashboard.tsx` |
| **FR53 – FR54** | Service & Schedule Configuration | `ServiceController.php`, `ServiceManager.php` | `ServiceManagement.tsx` |
| **FR55 – FR57** | User Provisioning & Roles | `UserController.php` | `UserManagement.tsx` |
| **FR58 – FR60** | System Audit & Email Logging | `AuditController.php`, `AuditService.php` | `AuditLogs.tsx` |

---

*Document prepared and verified by the Group 2 Development Team for St. Rita's College of Balingasag, Inc. – Information Technology Program.*
