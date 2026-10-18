# St. Rita's College of Balingasag, Inc.
**Higher Education Department | Information Technology Program**

---

# System Requirement Specifications (SRS)
## EduQueue: Web-Based Student Service Appointment and Queue Management System

**Group 2 | Capstone & Web Systems Project | S.Y. 2025–2026**  
**St. Rita's College of Balingasag, Inc.**  
*Balingasag, Misamis Oriental, Philippines*  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the comprehensive functional and non-functional requirements for the **EduQueue: Web-Based Student Service Appointment and Queue Management System**. The primary objective of this SRS is to establish a rigorous, formal specification of the software solution developed for **St. Rita's College of Balingasag (SRCB)**. It serves as the definitive reference agreement between the system developers, academic evaluators, institutional administrators, department heads (Registrar, Dean's Office, Guidance Office, Finance/Cashier, IT Helpdesk, and Library), and the student body.

The system replaces manual paper logs, congested physical walk-in queues, and fragmented scheduling with a centralized, full-stack digital platform featuring real-time walk-in sequence ticketing, conflict-free appointment slot booking, role-based staff desk calling terminals, a lobby display monitor, and automated transactional email notifications.

### 1.2 Project Scope
The EduQueue system is an enterprise-grade, full-stack web application architected with a **React 18 + TypeScript + Vite** frontend, a native **PHP 8.2+ RESTful API** backend adhering to the MVC and Service Layer architecture, and a normalized **MySQL 8.0** relational database.

The project scope encompasses:
1. **Public & Student Self-Service Portal:**
   - Student self-registration and credential authentication with JSON Web Tokens (JWT).
   - Institutional Student Service Catalog displaying office locations, requirements, daily limits, and duration.
   - Interactive appointment reservation with dynamic daily time-slot calculation and conflict prevention.
   - On-demand walk-in queue ticketing with automated daily sequence codes (e.g., `REG-001`, `FIN-002`).
   - Real-time personal ticket queue tracker showing current serving ticket, students ahead, and estimated wait duration.
   - In-app notification center for appointment and queue updates.
   - Student profile and security management.
2. **Staff & Counter Desk Terminal:**
   - Counter desk operations terminal with "Call Next Student", "Start Serving", "Mark Completed", and "Skip / No-Show" workflows.
   - Appointment disposition workflow: one-click **Approval** (with automated email voucher), **Decline** (with recorded justification), and **Reschedule** (with revised date/time).
   - Department-specific filtering across Registrar, Dean, Guidance, Finance, IT, and Library services.
3. **Public Lobby TV Display Monitor (`/display`):**
   - Fullscreen lobby kiosk display featuring live called tickets per counter desk, active ticket callouts, real-time digital clock, and upcoming waiting lists with auto-refresh polling.
4. **Administrative Management Panel:**
   - Executive dashboard featuring real-time KPIs, daily throughput statistics, and 7-day traffic analytics.
   - Service Management module for creating services, setting daily capacities, prerequisites, and operating days/hours.
   - User Provisioning module for managing student, staff, and admin accounts with status toggles.
   - System Audit Trail and Transactional Email Dispatch Logs for institutional compliance and transparency.
5. **Multi-Channel Transactional Email Engine:**
   - Built-in integration with modern Email APIs (Resend, Brevo, SendGrid, SMTP, and Log driver) for automated delivery of appointment confirmations, cancellations, and reschedule advisories.
6. **Security & Responsive Design:**
   - Server-side JWT authentication, BCrypt password hashing, PDO prepared statements, and role-based route middleware.
   - Fully responsive design optimized across mobile (320px), tablet (768px), and desktop (1920px) screens.

### 1.3 Definitions, Acronyms, and Abbreviations
* **UI:** User Interface
* **UX:** User Experience
* **SRS:** System Requirement Specifications
* **HCI:** Human-Computer Interaction
* **WCAG:** Web Content Accessibility Guidelines
* **FR:** Functional Requirement
* **NF:** Non-Functional Requirement
* **SRCB:** St. Rita's College of Balingasag
* **BSIT:** Bachelor of Science in Information Technology
* **API:** Application Programming Interface — backend service providing structured JSON responses
* **REST:** Representational State Transfer — architectural style for networked web API endpoints
* **JWT:** JSON Web Token (RFC 7519) — compact URL-safe token format for stateless authentication
* **RBAC:** Role-Based Access Control — security authorization restricting access based on user role (`admin`, `staff`, `student`)
* **PDO:** PHP Data Objects — consistent abstraction layer for secure database interaction with prepared statements
* **3NF:** Third Normal Form — relational database schema normalization standard eliminating data redundancy
* **CORS:** Cross-Origin Resource Sharing — browser security mechanism regulating cross-origin HTTP requests
* **KPI:** Key Performance Indicator — metric tracking operational volume and processing efficiency
* **MIME:** Multipurpose Internet Mail Extensions — standard for classifying document and media types

### 1.4 References
1. St. Rita's College of Balingasag, Inc. (2025). *Higher Education Department Capstone Project Manual and Software Development Guidelines*. Balingasag, Misamis Oriental.
2. World Wide Web Consortium (W3C). (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
3. Mozilla Developer Network (MDN). (2024). *Web APIs, HTTP Headers, and Modern JavaScript Reference*. https://developer.mozilla.org
4. Internet Engineering Task Force (IETF). (2015). *RFC 7519: JSON Web Token (JWT)*. https://datatracker.ietf.org/doc/html/rfc7519
5. Open Web Application Security Project (OWASP). (2023). *OWASP Top 10 Web Application Security Risks and Prevention Cheat Sheets*. https://owasp.org
6. Nielsen, J. (1994). *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/
7. The PHP Group. (2024). *PHP Manual: PHP Data Objects (PDO) and Password Hashing*. https://www.php.net/manual/en/

---

## 2. Overall Description

### 2.1 User Needs and Pain Points
* **Need 1: Eliminating Physical Queue Congestion & Long Waiting Times**
  * *Pain Point:* During peak enrollment, clearance, and grading periods, students endure hours standing in crowded hallways outside school offices without knowing their queue status or estimated wait duration.
* **Need 2: Conflict-Free Scheduling for High-Demand Services**
  * *Pain Point:* Services requiring extensive face-to-face consultation (e.g., Dean's Academic Advising, Guidance Counseling, Transcript evaluation) suffer from double bookings, uncoordinated schedules, and lost manual appointment logbooks.
* **Need 3: Real-Time Transparency for Staff and Campus Lobby**
  * *Pain Point:* Office staff have no visibility into daily student load, cannot forecast incoming student volume, and lack digital calling screens in lobby areas, causing missed turns and chaotic counter crowds.
* **Need 4: Automated Verification & Communication**
  * *Pain Point:* When appointment dates change or cancellations occur, staff have no automated medium to notify students promptly, resulting in wasted trips to campus.
* **Need 5: Centralized Institutional Auditing & Service Capacity Control**
  * *Pain Point:* Department heads and school administrators lack unified reporting tools to evaluate office turnaround times, monitor staff activity, and adjust daily student quotas.

### 2.2 User Personas

#### Persona 1 – The College Student: "Juan Dela Cruz"
* **Demographics:** 20 years old, 3rd Year BS Information Technology, Working Student.
* **Goals:** Book Transcript of Records requests and Academic Advising around his class timetable; join cashier queues virtually without missing lectures; receive SMS/email alerts when his ticket is called.
* **Frustrations:** Long physical lines at the Registrar and Cashier offices; unclear document requirements resulting in repeated office visits; lack of real-time queue position tracking.
* **Preferred Devices:** Smartphone (Android / iOS) and Laptop.

#### Persona 2 – The Department Staff: "Maria Santos"
* **Demographics:** 34 years old, Administrative Staff, Registrar Office.
* **Goals:** View daily student appointments in advance; call next walk-in ticket with one click; communicate appointment approvals, reschedules, or rejections with automated email receipts.
* **Frustrations:** Disorganized physical crowds around her counter window; manual logbooks and paper clearance forms; handling frustrated students who missed their turn.
* **Preferred Devices:** Desktop PC and Counter Desk Terminal.

#### Persona 3 – The System Administrator & Dean: "Dr. Ernesto Ramos"
* **Demographics:** 48 years old, Dean / Academic Administrator.
* **Goals:** Configure office operating hours and daily capacity thresholds; provision staff accounts; inspect system-wide audit logs and email delivery metrics; evaluate peak hour traffic analytics.
* **Frustrations:** Absence of centralized operational reports; inability to restrict daily service volume to prevent staff burnout; unorganized student clearance tracking.
* **Preferred Devices:** Desktop Workstation and Laptop.

### 2.3 Assumptions and Dependencies
* **Client Environment:** End-users access the system using modern standards-compliant web browsers (Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari) with JavaScript enabled.
* **Full-Stack Architecture:** The frontend is a single-page application (SPA) built with React 18, Vite, and Tailwind CSS. The backend is an asynchronous-ready PHP 8.2+ REST API connected to MySQL 8.0.
* **Authentication:** Stateless token authentication using JWT with symmetric HMAC-SHA256 signature verification.
* **Database State:** The database schema is initialized and populated with seed institutional services and role accounts.
* **Network & Mail Transport:** Transactional email dispatch requires server internet access to external REST mail APIs (Resend, Brevo, SendGrid) or configured institutional SMTP servers. In local offline modes, emails automatically route to the internal `email_logs` database table.
* **Development & Hosting:** The system supports unified local development via `npm run dev` (Node.js runner triggering PHP and Vite servers concurrently) and production deployment on Ubuntu Server with Nginx, PHP-FPM, and MySQL.

---

## 3. System Features and Requirements

### 3.1 Feature: Student Self-Service & Authentication
**Description:** Provides secure authentication, account registration, role authorization, and personal profile management for students, staff, and administrators.

**Functional Requirements:**
* **FR1:** The system shall provide a registration form allowing students to register with their Student ID Number, First Name, Last Name, institutional Email, Password, Contact Number, Degree Program, and Year Level.
* **FR2:** The system shall enforce client-side and server-side validation to ensure Student ID Numbers and Email addresses are unique within the database.
* **FR3:** The system shall hash user passwords using standard `PASSWORD_BCRYPT` with a cost factor of 10 prior to database insertion.
* **FR4:** The system shall authenticate users via email or student ID number along with password, issuing an HMAC-SHA256 JWT upon successful verification.
* **FR5:** The system shall enforce Role-Based Access Control (RBAC) redirecting students to `/dashboard`, staff to `/admin/appointments`, and administrators to `/admin/dashboard`.
* **FR6:** The system shall provide quick one-click demo login buttons on the login screen for rapid evaluative testing of Admin, Staff, and Student roles.
* **FR7:** The system shall allow authenticated users to update personal profile details and change account passwords with current password verification.
* **FR8:** The system shall provide secure session termination by clearing client tokens and logging the logout event in the audit trail.

### 3.2 Feature: Institutional Service Catalog
**Description:** Displays all active academic, financial, and student support services offered across SRCB departments.

**Functional Requirements:**
* **FR9:** The system shall display a service catalog categorized by office (Registrar, Dean's Office, Guidance, Finance/Cashier, IT Helpdesk, Library).
* **FR10:** Each service card shall indicate its service classification (`appointment` or `queue`), office counter location, estimated duration in minutes, daily quota, and prerequisites/requirements.
* **FR11:** The system shall provide dynamic search and category filtering allowing students to filter services instantly without reloading the page.
* **FR12:** For appointment-based services, clicking a service card shall launch the Appointment Booking modal; for walk-in queue services, it shall launch the Join Queue modal.

### 3.3 Feature: Appointment Booking & Conflict Management
**Description:** Enables students to schedule appointments with conflict-free slot calculation and automated confirmation.

**Functional Requirements:**
* **FR13:** The system shall compute and display available appointment time slots for any selected date based on service operating schedules, slot duration, and maximum capacity limits.
* **FR14:** The system shall prevent overlapping bookings by checking existing active appointments for the requested time window before booking confirmation.
* **FR15:** The system shall prevent students from booking past dates, weekend non-operating days, or slots exceeding maximum daily capacity.
* **FR16:** The system shall allow students to input their specific consultation purpose or document request notes.
* **FR17:** The system shall assign a unique tracking code (e.g., `APT-20260904-XXXX`) to each confirmed appointment.
* **FR18:** The system shall provide a "My Appointments" management page where students can view upcoming, completed, rescheduled, or rejected bookings.
* **FR19:** The system shall allow students to cancel pending appointments, automatically freeing up the time slot for other students.

### 3.4 Feature: Walk-in Queue Ticketing & Real-Time Position Tracking
**Description:** Manages on-demand physical office queues with automated ticketing sequence generation and live progress tracking.

**Functional Requirements:**
* **FR20:** The system shall allow registered students to join the walk-in queue for an active queue-based service with a single click.
* **FR21:** The system shall automatically generate sequential daily queue ticket numbers formatted with service code prefixes (e.g., `FIN-001`, `REG-002`, `IT-003`).
* **FR22:** The system shall restrict a student to one active queue ticket per service at any given time to prevent queue hoarding.
* **FR23:** The system shall calculate and display the student's real-time queue position, the ticket currently being served at the counter, and estimated remaining wait time.
* **FR24:** The system shall provide a visual status badge (`waiting`, `calling`, `serving`, `completed`, `skipped`, `cancelled`) that updates in real time.
* **FR25:** The system shall allow students to cancel their queue ticket if they are unable to attend.

### 3.5 Feature: Staff Appointment Processing & Email Dispatch
**Description:** Enables department personnel to manage, review, approve, decline, and reschedule student appointments.

**Functional Requirements:**
* **FR26:** The system shall provide staff with an Appointment Management dashboard filtered by service, status, date range, and student search query.
* **FR27:** The system shall allow staff to **Approve** pending appointments, transitioning status to `approved` and triggering an automated HTML email voucher to the student.
* **FR28:** The system shall allow staff to **Decline** appointments with mandatory reason input, dispatching an official cancellation advisory email.
* **FR29:** The system shall allow staff to **Reschedule** appointments with revised date, start time, end time, and staff notes, notifying the student via email.
* **FR30:** The system shall log every email dispatch attempt (driver, recipient, subject, status, error) into the `email_logs` database table.

### 3.6 Feature: Staff Queue Counter Desk Terminal
**Description:** Provides counter staff with an operational calling interface for processing walk-in students efficiently.

**Functional Requirements:**
* **FR31:** The system shall provide staff with a Counter Calling Terminal showing the current queue list for their assigned service desk.
* **FR32:** The system shall provide a prominent **"Call Next Student"** action that selects the oldest waiting ticket, marks it as `calling`, assigns the staff counter window, and broadcasts to the public display.
* **FR33:** The system shall allow staff to transition ticket states to **"Start Serving"** (`serving`) upon student arrival at the counter.
* **FR34:** The system shall allow staff to finalize transactions by clicking **"Complete"** (`completed`) or mark no-shows with **"Skip"** (`skipped`).
* **FR35:** The system shall track timestamps for `called_at`, `served_at`, and `completed_at` to compute accurate service turnaround analytics.

### 3.7 Feature: Public Lobby Live Display Monitor (`/display`)
**Description:** Fullscreen public kiosk display for campus lobby television monitors and waiting areas.

**Functional Requirements:**
* **FR36:** The system shall provide a dedicated public route at `/display` accessible without user authentication.
* **FR37:** The display shall render high-contrast visual cards for every active counter desk indicating the service name, counter window, and currently called ticket number.
* **FR38:** The display shall include visual audio-cue alerts when a new ticket is called.
* **FR39:** The display shall feature an upcoming waiting list ticker, a live digital clock, and institutional SRCB branding.
* **FR40:** The display shall automatically refresh ticket data via interval polling every 5 seconds.

### 3.8 Feature: Administrator Dashboard & Analytics
**Description:** Provides executive visibility into campus-wide student service operations.

**Functional Requirements:**
* **FR41:** The dashboard shall display live summary KPI cards: Total Appointments Today, Active Walk-In Queue Count, Completed Services, and Total Registered Users.
* **FR42:** The dashboard shall render a 7-Day Throughput Bar Chart comparing appointment volume against walk-in queue transactions.
* **FR43:** The dashboard shall display a breakdown of service utilization by department.
* **FR44:** The dashboard shall list recent system activity in an interactive live feed.

### 3.9 Feature: Service & Schedule Management
**Description:** Allows administrators to configure institutional services, operating schedules, and slot capacities.

**Functional Requirements:**
* **FR45:** The system shall allow administrators to create and edit service records including code, title, category, type (`appointment` vs `queue`), counter location, duration, daily capacity, and prerequisites.
* **FR46:** The system shall allow administrators to toggle services as active or inactive with immediate effect.
* **FR47:** The system shall allow administrators to configure recurring weekly schedules (Monday to Friday, 8:00 AM – 5:00 PM) with custom slot durations and capacity limits per time slot.

### 3.10 Feature: User Provisioning & Permissions
**Description:** Manages institutional user accounts and access privileges.

**Functional Requirements:**
* **FR48:** The system shall allow administrators to view all registered users with role-based filtering and real-time search.
* **FR49:** The system shall allow administrators to provision new Staff or Administrator accounts directly with assigned departments.
* **FR50:** The system shall allow administrators to toggle user account status (`active` / `disabled`) to immediately grant or revoke system access.

### 3.11 Feature: Audit Trail & Transactional Email Dispatch Logs
**Description:** Maintains an immutable record of all security, operational, and communication activities.

**Functional Requirements:**
* **FR51:** The system shall log all critical actions (user logins, failed logins, appointment status modifications, queue state changes, service updates) with user ID, action tag, entity type, entity ID, client IP address, and JSON metadata.
* **FR52:** The system shall allow administrators to inspect and search the audit log repository.
* **FR53:** The system shall provide a dedicated email dispatch monitor detailing every outbound notification, dispatch timestamp, driver used, recipient email, subject, and delivery status.

---

## 4. Non-Functional Requirements (HCI Focus)

### 4.1 Usability
* **NF1 (3-Click Navigation):** A user shall be able to reach any major functional section (Services Catalog, Appointment Booking, Queue Status, Profile) within a maximum of 3 clicks from the main navigation menu.
* **NF2 (Efficient Booking Workflow):** The primary task of discovering a service, selecting an available time slot, entering purpose, and submitting an appointment booking shall be completable in under 60 seconds by a first-time student user.
* **NF3 (Inline Form Validation & Immediate Feedback):** All interactive forms (Registration, Login, Appointment Modal, Service Editor) shall provide clear, real-time inline validation with descriptive error feedback before network dispatch.
* **NF4 (Cohesive Design Language & HCI Feedback):** The interface shall utilize a polished institutional color palette (SRCB Navy `#1E3A8A`, Royal Blue `#2563EB`, Emerald Green `#10B981`, Amber `#F59E0B`, and Slate `#64748B`) with consistent typography, micro-animations, and visual status badges.
* **NF5 (Zero-Coding Administration):** All operational adjustments—such as changing service hours, modifying counter names, or adjusting slot capacities—shall be performed entirely through graphical UI modals without requiring manual SQL or code modifications.

### 4.2 Performance
* **NF6 (Sub-Second API Response Times):** Backend REST API endpoints shall execute and respond within 200 milliseconds under standard institutional network loads.
* **NF7 (Client-Side Rendering Speed):** Initial page loads shall render within 1.5 seconds on modern desktop browsers and under 3 seconds on standard 4G mobile connections.
* **NF8 (Database Query Efficiency):** All frequently filtered fields (`user_id`, `service_id`, `appointment_date`, `queue_date`, `status`, `created_at`) shall be indexed in MySQL, ensuring sub-10ms query execution across datasets exceeding 50,000 records.
* **NF9 (Optimized Polling & Background Refresh):** Live queue trackers and notification centers shall utilize lightweight, debounced REST polling (5-second intervals) consuming negligible client and server CPU cycles.

### 4.3 Accessibility
* **NF10 (WCAG 2.1 Level AA Compliance):** The application shall adhere to WCAG 2.1 Level AA accessibility criteria across all public, student, and administrative screens.
* **NF11 (Color Contrast Ratio):** All body typography, headings, buttons, and alert badges shall maintain a minimum color contrast ratio of 4.5:1 against their respective backgrounds.
* **NF12 (Full Keyboard Navigation):** All interactive elements (form fields, dropdowns, modal triggers, pagination controls, tab bars) shall be fully navigable and actionable using only keyboard inputs (`Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape`).
* **NF13 (Accessible Semantic HTML & ARIA):** All custom interactive dialogs and icons shall incorporate appropriate ARIA attributes (`aria-label`, `aria-expanded`, `role="dialog"`, `role="alert"`) for full screen reader compatibility.

### 4.4 Compatibility & Responsiveness
* **NF14 (Cross-Browser Compatibility):** The web application shall render identically and operate defect-free on the latest stable versions of Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and mobile browser variants.
* **NF15 (Responsive Breakpoints):** The user interface shall dynamically adapt across viewports from 320px (compact mobile), 640px (large mobile), 768px (tablet), 1024px (small desktop/laptop), to 1920px+ (large monitor / Lobby TV Kiosk) using Tailwind CSS responsive utility classes.
* **NF16 (Device Input Versatility):** All buttons and interactive controls shall provide minimum touch target dimensions of 44x44 pixels to accommodate touchscreen mobile navigation.

### 4.5 Security
* **NF17 (Prepared Statements & SQLi Defense):** All database interactions across models and controllers shall strictly utilize PDO prepared statements with parameterized inputs. Emulated prepared statements shall be disabled (`PDO::ATTR_EMULATE_PREPARES = false`).
* **NF18 (Strong Password Hashing):** All user credentials shall be secured using standard `PASSWORD_BCRYPT` with cost factor 10. Plaintext passwords shall never be persisted or logged.
* **NF19 (Stateless JWT Security):** All private API routes shall validate incoming HMAC-SHA256 JWT tokens via `AuthMiddleware`. Tokens shall carry standard expiration claims (24 hours) and be verified on every request.
* **NF20 (Role Authorization Enforcement):** Administrative and staff endpoints shall be guarded on the server side by `RoleMiddleware`, preventing unauthorized privilege escalation regardless of client state.
* **NF21 (XSS & Input Sanitization):** All incoming request payloads shall be sanitized and escaped upon output formatting (`htmlspecialchars(ENT_QUOTES, 'UTF-8')`).
* **NF22 (CORS & Header Security):** The backend API shall enforce explicit CORS origin headers and secure HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`).
* **NF23 (Secret Key Isolation):** All database passwords, JWT signing keys, and third-party mail API keys shall reside exclusively in server-side `.env` files and shall never be committed to source repositories or exposed to frontend bundles.

### 4.6 Maintainability & Architecture
* **NF24 (Layered Architectural Separation):** The backend codebase shall strictly enforce separation of concerns across `Core/` (Database, Router, JWT, Request/Response), `Middleware/` (Auth, Role, CORS), `Controllers/` (HTTP parameter handling), and `Services/` (business logic, transaction management, email dispatch).
* **NF25 (Single-Point Typed HTTP Client):** The frontend application shall channel all network interactions through a centralized API service module (`src/services/api.ts`) featuring typed TypeScript interfaces and automatic JWT authorization header injection.
* **NF26 (Transactional Fail-Safe Logging):** External email dispatch failures shall be captured gracefully and logged in `email_logs` without disrupting or rolling back primary appointment or queue database transactions.

---

## 5. User Interface Design & Aesthetics

### 5.1 Wireframes & Layout Hierarchy
The user interface is structured into four distinct layout archetypes:
1. **Public & Guest Layout (`/login`, `/register`, `/display`):**
   - Clean, centered card authentication forms with institutional crest, quick demo autofill selectors, and clear status notifications.
   - Dedicated distraction-free fullscreen lobby display layout with high-contrast typography and digital clock header.
2. **Student Self-Service Portal (`/dashboard`, `/services`, `/appointments`, `/queue`, `/profile`):**
   - Top navigation bar featuring brand identity, breadcrumbs, notification bell badge with live counter, and user profile dropdown.
   - Modular dashboard layout featuring active queue countdown ticker, upcoming appointment alert cards, and one-click action cards.
   - Interactive modals for service appointment scheduling and queue ticket generation.
3. **Staff Operations Terminal (`/admin/appointments`, `/admin/queue`):**
   - Streamlined calling interface with prominent status toggle buttons ("Call Next", "Start Serving", "Complete", "Skip").
   - Filterable data tables with status color indicators, student contact details, and modal disposition forms.
4. **Administrator Control Panel (`/admin/dashboard`, `/admin/services`, `/admin/users`, `/admin/audit-logs`):**
   - Sidebar navigation for rapid switching between Dashboard, Services, Appointments, Queue Management, Users, and Audit Trails.
   - Analytical metric cards, SVG volume trend charts, and paginated tabular data viewers with instant search.

### 5.2 High-Fidelity UI Design System
* **Typography:**
  - Primary UI Font: **Inter** / **Roboto** (Google Fonts) for crisp legibility across high-density operational data tables and mobile screens.
  - Heading Display Font: **Outfit** / **Inter** for modern aesthetic hierarchy.
* **Color Palette & Visual Tokens:**
  - **Primary Institutional Brand:** Deep Navy (`#1E3A8A` / `#1E293B`) symbolizing academic trust and integrity.
  - **Interactive Accent:** Vibrant Royal Blue (`#2563EB`) for primary buttons, active tabs, and focus rings.
  - **Success / Completed:** Emerald Green (`#10B981`) for approved appointments, completed services, and active status indicators.
  - **Warning / Pending:** Warm Amber (`#F59E0B`) for pending approvals, waiting queue positions, and reschedule alerts.
  - **Danger / Cancellation:** Rose Red (`#EF4444`) for rejected requests, skipped tickets, and account deactivation buttons.
  - **Neutral Surfaces:** Cool Slate (`#F8FAFC` background, `#FFFFFF` card surfaces, `#E2E8F0` borders) ensuring high contrast and minimal visual clutter.
* **Component Styling & Micro-Interactions:**
  - Subtle card drop shadows (`shadow-sm` transitioning to `shadow-md` on hover).
  - Glassmorphic modal overlays with smooth fade and slide-up transitions (`transition-all duration-200 ease-in-out`).
  - Skeleton loading states and spinners ensuring seamless perceived performance during asynchronous API queries.
  - Semantic Lucide React icons pairing visual meaning with every navigation link, status badge, and action button.

---

*Document prepared by the Group 2 Development Team for St. Rita's College of Balingasag, Inc. – Information Technology Program.*
