# Log Pro - Enterprise Log Sheet Upload & Management System

[![Python](https://img.shields.io/badge/Python-3.14-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.2-green.svg)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19.2-cyan.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-emerald.svg)](https://mongodb.com)
[![Tests](https://img.shields.io/badge/Tests-21%2F21%20Passing%20(100%25)-brightgreen.svg)](./backend/test_suite.py)

**Log Pro** is a centralized, production-grade enterprise web application where employees can upload their daily log sheets, track real-time submission deadlines with a live 24-hour countdown timer, and review submission history. Administrators can monitor organization-wide compliance, review and download authorized log sheets, track submission timestamps, inspect version replacement audit trails, and export weekly compliance reports (CSV, styled Excel `.xlsx`, and executive PDF).

---

## 📑 Table of Contents
- [Key Features](#-key-features)
  - [Employee Portal](#-employee-portal)
  - [Administrator Console](#-administrator-console)
- [Technology Architecture](#-technology-architecture)
- [MongoDB Atlas Integration](#-mongodb-atlas-integration)
- [Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
- [Quickstart & Local Setup](#-quickstart--local-setup)
- [Automated Test Suite (21/21 Passing)](#-automated-test-suite)
- [Security & Validation Policies](#-security--validation-policies)
- [REST API Endpoints Reference](#-rest-api-endpoints-reference)

---

## 🌟 Key Features

### 👤 Employee Portal
- **Secure Authentication**: Dedicated user sign-in with JWT access and refresh token management.
- **Personalized Dashboard**: Real-time welcome greeting, today's submission status, and KPI summary metrics (Total, On-Time, Late).
- **Live 24-Hour Countdown Timer**: Dynamic ticking timer calculating remaining hours, minutes, and seconds until the daily cutoff with live status pill (**On-Time Window** vs. **Late Submission Window**).
- **Daily Submission Activity Card**: Displays today's business date, current status, uploaded file format, size, version, and download link.
- **Drag-and-Drop Upload Modal**:
  - Validates `.pdf`, `.doc`, `.docx`, and `.txt` files up to 10 MB (configurable).
  - Inspects file extensions, MIME types, and binary magic byte signatures server-side.
  - Upload progress bar and optional task notes summary.
  - **Version Replacement Handling**: Employees can upload an updated log sheet before the daily cutoff. The system automatically archives earlier submissions in an audit history trail.
- **Searchable Submission History**: Search by file name or task notes, filter by status (On-Time / Late) and date range, with one-click secure file download.
- **Profile & Password Management**: Update personal profile details (Name, Department, Employee ID) and change security password.
- **Theme Preferences**: One-click toggle between Dark and Light modes.

### 🛡️ Administrator Console
- **Dedicated Admin Login**: Separate sign-in experience enforcing strict role-based access control (RBAC).
- **Executive Analytics Dashboard**:
  - Real-time summary metrics: Total Registered Employees, Submitted Today, On-Time vs. Late Today, and Missing Submissions.
  - **7-Day Submission Trends**: Visual bar/line charts powered by **Recharts** (On-Time, Late, and Missing volumes).
  - **Department Compliance Breakdown**: Progress completion bars per business unit.
  - Live incoming submission feed with instant file download.
- **Enterprise Submissions Repository**:
  - Filter across all employees by date range, department, and status.
  - **Version Audit Trail Modal**: View all past file replacements, previous versions, and timestamps.
  - Protected file download endpoints ensuring documents are never served publicly.
- **User Accounts & Compliance Management**:
  - List all employees with individual compliance rates (%), on-time counts, and late counts.
  - **Provision New Users**: Add new employee and administrator accounts directly to MongoDB.
  - One-click account activation / deactivation toggle.
- **Weekly Reports & Multi-Format Exports**:
  - Customizable date range reporting window.
  - **CSV Export**: Standard comma-delimited export stream.
  - **Excel Export**: Formatted `.xlsx` workbook generated via `openpyxl` with navy headers, KPI block, auto-fitted columns, and color-coded status cells.
  - **PDF Export**: Executive PDF compliance report generated via `reportlab` with landscape layout, summary KPI tables, and detailed submission logs.
- **System Settings & Policies**:
  - Configurable daily deadline time cutoff (e.g., `17:00` / 5:00 PM).
  - File replacement policy toggle (allow replacement before deadline).
  - Maximum upload file size threshold (MB).
  - Permitted file extensions manager.

---

## 🛠️ Technology Architecture

```
a:/Log Pro/
├── backend/
│   ├── logpro_backend/
│   │   ├── settings.py           # Django, DRF, CORS, MongoDB config
│   │   ├── urls.py               # Main API router
│   ├── core/
│   │   ├── db.py                 # PyMongo DAL, connection pooling & indexes
│   │   ├── authentication.py     # Custom JWT authentication & MongoUser model
│   │   ├── permissions.py        # RBAC: IsMongoAuthenticated, IsMongoAdmin
│   │   ├── deadline_policy.py    # 24-hr countdown calculator & On-Time/Late policy
│   │   ├── file_validator.py     # Magic bytes, MIME types, size & secure storage names
│   │   ├── views_auth.py         # Login, JWT refresh, profile update, logout
│   │   ├── views_submission.py   # Today's status, upload/replace, history, secure download
│   │   ├── views_admin.py        # Executive stats, all submissions, user management, settings
│   │   ├── views_reports.py      # Weekly summaries, CSV, styled Excel (.xlsx), PDF exports
│   │   └── urls.py               # Core API routing table
│   ├── media/submissions/        # Protected local storage for uploaded log sheets
│   ├── seed_data.py              # Automated MongoDB seed script for admin & users
│   ├── test_suite.py             # 21 automated backend test cases
│   └── .env                      # Secrets & MongoDB Atlas URI
└── frontend/
    ├── src/
    │   ├── api/                  # Axios client, auth, submissions, admin, reports APIs
    │   ├── context/              # AuthContext (session/role state) & ThemeContext (light/dark)
    │   ├── components/           # Navbar, Sidebar, CountdownTimer, UploadModal, StatCard, etc.
    │   ├── pages/                # UserLogin, AdminLogin, UserDashboard, UserHistory,
    │   │                         # UserProfile, AdminDashboard, AdminSubmissions, AdminUsers,
    │   │                         # AdminReports, AdminSettings, NotFound
    │   ├── App.jsx               # Protected/Public route guards and layout
    │   └── index.css             # Tailwind CSS v4 styling & animations
    └── vite.config.js            # Vite config with @tailwindcss/vite and API proxy
```

---

## 🍃 MongoDB Atlas Integration

The system communicates directly with your **MongoDB Atlas** cloud cluster via a thread-safe PyMongo Repository Data Access Layer (DAL).

### Environment Configuration (`backend/.env`):
```env
SECRET_KEY=django-insecure-logpro-enterprise-production-grade-secret-key-2026
DEBUG=True
MONGO_DB_NAME=log_sheet_system
MONGODB_URI="mongodb+srv://harshakonigala_db_user:jA4FUkCguegiEA1m@cluster0.ryuiyf8.mongodb.net"
```

### Collections & Indexes:
- `users`: Unique indexes on `email` and `username`.
- `submissions`: Compound indexes on `(user_id, business_date, is_active)`, `business_date`, `status`, and `upload_timestamp`.
- `system_settings`: Stores global policies (deadline, max file size, replacement rules).
- `audit_logs`: Tracks all authentication, uploads, replacements, and exports.

---

## 🔑 Pre-Seeded Demo Credentials

The database is pre-seeded with genuine demo accounts:

| Role | Portal URL | Username / Email | Password | Pre-seeded Details |
|---|---|---|---|---|
| **Administrator** | `/admin/login` | `admin@logpro.com` / `admin` | `AdminPassword123!` | Executive Management (`ADM-001`) |
| **Employee** | `/login` | `john.doe@company.com` | `UserPassword123!` | Engineering (`ENG-1042`) |
| **Employee** | `/login` | `sarah.jenkins@company.com` | `UserPassword123!` | Product & Design (`PRD-2019`) |
| **Employee** | `/login` | `michael.chang@company.com` | `UserPassword123!` | Quality Assurance (`QA-3112`) |
| **Employee** | `/login` | `emily.davis@company.com` | `UserPassword123!` | Operations (`OPS-4401`) |

> [!TIP]
> Both login pages feature an **Autofill Demo Account** button for instant one-click login.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
1. Python 3.10+ installed
2. Node.js 18+ and npm installed
3. MongoDB running locally or cloud MongoDB Atlas URI in `backend/.env`

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install django djangorestframework django-cors-headers pymongo pyjwt openpyxl reportlab python-magic-bin python-dotenv

# Run database indexing and seed data script:
python seed_data.py

# Start Django backend server:
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install node dependencies:
npm install

# Start Vite development server:
npm run dev
```

The application will be accessible at **`http://localhost:5173`**.

---

## 🧪 Automated Test Suite

A comprehensive test suite is available in `backend/test_suite.py`. It tests all endpoints and policies directly against the live database:

```bash
cd backend
python test_suite.py
```

### Results: **21 PASSED | 0 FAILED (100% Success Rate)**

| Suite | Test ID | Description | Latency | Result |
|---|---|---|---|---|
| **Suite 1: Auth & RBAC** | `TC-01` | Admin Login with Valid Credentials | 714 ms | ✅ **PASS** |
| | `TC-02` | Employee Login with Valid Credentials | 510 ms | ✅ **PASS** |
| | `TC-03` | Reject Login with Invalid Password (401) | 568 ms | ✅ **PASS** |
| | `TC-04` | Enforce Portal Role Separation (403 on Admin Portal) | 765 ms | ✅ **PASS** |
| | `TC-05` | JWT Refresh Token Endpoint | 41 ms | ✅ **PASS** |
| | `TC-06` | Get and Update User Profile | 256 ms | ✅ **PASS** |
| **Suite 2: Submissions** | `TC-07` | Live Countdown Timer Data & Status Query | 160 ms | ✅ **PASS** |
| | `TC-08` | Reject Invalid File Extension (`.exe` blocked) | 39 ms | ✅ **PASS** |
| | `TC-09` | Detect Mismatched Binary Magic Bytes | 39 ms | ✅ **PASS** |
| | `TC-10` | Upload Daily Log Sheet (`v1` Created) | 243 ms | ✅ **PASS** |
| | `TC-11` | Replace Log Sheet with Audit Trail (`v2` + `v1` archived) | 249 ms | ✅ **PASS** |
| | `TC-12` | Secure Download Authorization Check (Owner/Admin allowed, Others 403) | 265 ms | ✅ **PASS** |
| **Suite 3: Administration**| `TC-13` | Admin Dashboard KPI & 7-Day Trends Analytics | 604 ms | ✅ **PASS** |
| | `TC-14` | Admin All Submissions Query & Filter | 41 ms | ✅ **PASS** |
| | `TC-15` | Admin Provision New Employee Account | 696 ms | ✅ **PASS** |
| | `TC-16` | Admin Toggle User Status (Deactivate & Activate) | 279 ms | ✅ **PASS** |
| | `TC-17` | Admin System Settings Configuration | 245 ms | ✅ **PASS** |
| **Suite 4: Reports** | `TC-18` | Weekly Compliance Report JSON Summary | 90 ms | ✅ **PASS** |
| | `TC-19` | Export Report to CSV Stream (`text/csv`) | 137 ms | ✅ **PASS** |
| | `TC-20` | Export Styled Excel Workbook (`.xlsx`) via OpenPyXL | 192 ms | ✅ **PASS** |
| | `TC-21` | Export Executive PDF Document (`.pdf`) via ReportLab | 150 ms | ✅ **PASS** |

---

## 🔒 Security & Validation Policies

1. **Server-Side File Validation**:
   - Files are validated using extension matching, MIME type verification, and **binary magic byte inspection** (`%PDF-`, ZIP container `PK\x03\x04`, and OLE header `\xd0\xcf\x11\xe0`).
   - Plain text `.txt` files are checked for binary control characters to reject disguised executables.
2. **Cryptographic Storage Names**:
   - Files are renamed using `UUID4` storage names to eliminate path traversal (`../`) and file overwrite attacks.
3. **Non-Public File Storage**:
   - Files are never served statically. All file downloads pass through `GET /api/submissions/<id>/download/`, requiring ownership verification for employees and role checks for administrators.
4. **Password & Token Security**:
   - Passwords hashed using PBKDF2 with SHA-256.
   - JWT tokens signed with SHA-256 HMAC, expiring in 60 minutes for access and 7 days for refresh.

---

## 📡 REST API Endpoints Reference

### Authentication
- `POST /api/auth/login/` - Authenticate user or admin with role enforcement
- `POST /api/auth/refresh/` - Refresh JWT access token
- `GET /api/auth/profile/` - Fetch current user profile
- `PUT /api/auth/profile/` - Update profile information and change password
- `POST /api/auth/logout/` - Invalidate session & record audit event

### Employee Submissions
- `GET /api/submissions/status/today/` - Today's submission status, live countdown data, and user KPIs
- `POST /api/submissions/upload/` - Upload new log sheet or replace existing submission
- `GET /api/submissions/my-history/` - Searchable, filterable list of user's past uploads
- `GET /api/submissions/<id>/download/` - Secure file download (ownership-verified)

### Administration & Compliance
- `GET /api/admin/dashboard/` - Executive summary cards, 7-day trend data, department breakdown
- `GET /api/admin/submissions/` - All enterprise submissions with multi-criteria filters
- `GET /api/admin/users/` - User list with individual compliance rates
- `POST /api/admin/users/` - Provision a new user account
- `PATCH /api/admin/users/<id>/toggle-status/` - Activate or deactivate an account
- `GET /api/admin/settings/` - Retrieve system configuration (deadline, file limits)
- `PUT /api/admin/settings/` - Update system configuration

### Reports & Exports
- `GET /api/reports/weekly/` - JSON summary of submission compliance for selected date range
- `GET /api/reports/export/csv/` - Download submission report as CSV
- `GET /api/reports/export/excel/` - Download styled Excel spreadsheet (`.xlsx`)
- `GET /api/reports/export/pdf/` - Download formatted PDF compliance report
