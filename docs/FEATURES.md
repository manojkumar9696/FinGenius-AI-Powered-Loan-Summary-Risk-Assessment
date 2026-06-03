# FinGenius — Features Reference

**AI-Powered Loan Application Summary & Risk Assessment System**
**Version**: 1.0.0 | **Stack**: Node.js + Express + MySQL + React (Vite) + Google Gemini AI

---

## Feature Categories

1. [Authentication & Session Management](#1-authentication--session-management)
2. [Role-Based Access Control (RBAC)](#2-role-based-access-control-rbac)
3. [Borrower Profile Management](#3-borrower-profile-management)
4. [Programmatic Risk Assessment Engine](#4-programmatic-risk-assessment-engine)
5. [Google Gemini AI Underwriting Narratives](#5-google-gemini-ai-underwriting-narratives)
6. [KYC & Automated Fraud Detection](#6-kyc--automated-fraud-detection)
7. [Dashboard Analytics & Portfolio Metrics](#7-dashboard-analytics--portfolio-metrics)
8. [PDF Underwriting Report Generation](#8-pdf-underwriting-report-generation)
9. [Immutable Compliance Audit Logging](#9-immutable-compliance-audit-logging)
10. [Production Security Hardening](#10-production-security-hardening)
11. [Visual React Frontend](#11-visual-react-frontend)

---

## 1. Authentication & Session Management

| Feature | Details |
|---------|---------|
| **JWT Token Issuance** | Stateless signed tokens issued on login with configurable expiry (`JWT_EXPIRES_IN`) |
| **bcrypt Password Hashing** | All passwords hashed with 12 salt rounds — never stored in plain text |
| **Session Persistence** | JWT + user object stored in browser `localStorage` for cross-tab session continuity |
| **Auto-Logout on Expiry** | Frontend API wrapper detects `401` responses and automatically clears session + redirects to login |
| **Signup Registration** | New accounts created via `/api/auth/signup` with role selection |

---

## 2. Role-Based Access Control (RBAC)

| Feature | Details |
|---------|---------|
| **Two-Tier Role System** | `admin` (global access) and `loan_officer` (portfolio-isolated access) |
| **JWT Protect Middleware** | `protect()` middleware validates JWT on every protected route |
| **Role Restriction Middleware** | `restrictTo(...roles)` blocks endpoints from unauthorized roles |
| **Portfolio Insulation** | Loan Officers can only view/edit applicants they personally created (`created_by = req.user.id`) |
| **Status Override Protection** | Loan Officers cannot manually change `applicants.status` — only the risk engine or Admins can |
| **Admin Delete Only** | Hard-delete operations on applicant records are restricted exclusively to `admin` role |
| **Audit Log Admin Gate** | `/api/audit-logs` is gated at both route and controller levels for double isolation |
| **Frontend Route Guards** | React `ProtectedRoute` gates redirect unauthenticated users to `/login` and unauthorized roles to `/dashboard` |

---

## 3. Borrower Profile Management

| Feature | Details |
|---------|---------|
| **Full CRUD Operations** | Create, Read, Update, Delete borrower profiles via REST API |
| **Age Validation** | Applicants under 18 years old are automatically rejected at the validation layer |
| **FICO Range Validation** | Credit scores must fall between 300 and 850 (standard FICO range) |
| **Employment Status Enum** | Strict enumeration: `employed`, `self_employed`, `unemployed`, `retired` |
| **SSN Masking on Frontend** | Only last 4 digits of SSN displayed in the UI (`***-**-6789`) |
| **Soft Search & Filters** | Dashboard supports real-time name/email search and status dropdown filters |
| **Cascade on Delete** | Deleting an applicant automatically removes all linked `risk_assessments`, `fraud_checks`, and frees audit log references |
| **Officer History Preservation** | Using `ON DELETE SET NULL` — applicant records persist even if their managing Loan Officer is removed |

---

## 4. Programmatic Risk Assessment Engine

| Feature | Details |
|---------|---------|
| **DTI Calculation** | Debt-to-Income Ratio: `(monthly_debt / monthly_income) × 100` |
| **LTI Calculation** | Loan-to-Income Ratio: `loan_amount / (monthly_income × 12)` |
| **Composite Risk Scoring** | Weighted penalty system producing a 0–100 risk score |
| **Risk Tier Classification** | `low` (0–35), `medium` (36–65), `high` (66–100) |
| **Eligibility Decision** | Binary `eligible` / `ineligible` verdict with plain-language explanation |
| **Approval Recommendation** | `approve`, `review`, or `decline` output fed into parent status update |
| **Parent Status Sync** | Automatically updates `applicants.status` to `approved`, `pending`, or `rejected` |
| **Upsert Safety** | Engine checks for existing assessment before INSERT/UPDATE to prevent duplicate constraint violations |
| **Fraud Override Safeguard** | If fraud status is `flagged`, parent is force-set to `rejected` regardless of risk score |

---

## 5. Google Gemini AI Underwriting Narratives

| Feature | Details |
|---------|---------|
| **Model** | `gemini-2.5-flash` via `@google/genai` SDK |
| **Structured Output** | Enforces strict JSON schema response with 4 defined string fields |
| **4-Part Narrative** | Generates: Profile Summary, Eligibility Explanation, Risk Analysis, Underwriter Recommendation |
| **Fault-Tolerant Fallback** | If Gemini API key is missing or call fails, a realistic contextual mock narrative is generated locally — system never crashes |
| **Async Execution** | AI call runs asynchronously alongside risk and fraud calculations — no blocking |
| **Database Persistence** | All 4 narrative fields stored in `risk_assessments` table columns (`ai_summary`, `ai_eligibility_explanation`, `ai_risk_analysis`, `ai_recommendation`) |
| **Frontend Display** | Rendered in dedicated frosted glass panels on the Underwriting Review page |

---

## 6. KYC & Automated Fraud Detection

| Feature | Details |
|---------|---------|
| **SSN Velocity Check** | Queries the `applicants` table to detect duplicate SSN registrations — instant identity fraud detection |
| **Auto-Decline on Duplicate** | Any applicant with a matching SSN in the database receives `fraud_score +60` and is automatically flagged |
| **Suspicious Income Check** | Flags applicants whose income/FICO ratio exceeds institutional compliance thresholds |
| **Missing Info Check** | Detects null or empty critical fields in the profile |
| **Weighted Fraud Score** | Composite score (0–100) from all three checks combined |
| **Three-Tier Classification** | `pass` (clean), `review` (manual check needed), `flagged` (auto-reject override) |
| **Override Architecture** | `flagged` status bypasses all risk score approvals — even a low-risk profile is rejected if fraud is detected |
| **Visual KYC Checklist** | Frontend displays individual check results with glowing green/red compliance dot indicators |

---

## 7. Dashboard Analytics & Portfolio Metrics

| Feature | Details |
|---------|---------|
| **Concurrent Aggregation** | All 4 SQL queries run simultaneously via `Promise.all()` — minimal database roundtrips |
| **Total Applications Count** | Count of all applicants in portfolio scope |
| **Completed Audits Count** | Count of applicants with a completed risk assessment |
| **Approval Rate %** | `(approved / (approved + rejected)) × 100` — excludes pending to show true decision rate |
| **Status Distribution** | Breakdown of `pending`, `approved`, `rejected` applicant counts |
| **Risk Distribution** | Breakdown of `low`, `medium`, `high` risk-tier counts |
| **Fraud Distribution** | Breakdown of `pass`, `review`, `flagged` fraud status counts |
| **Portfolio Isolation** | Loan Officers receive stats calculated only from their own applicants |
| **Custom SVG Charts** | Frontend renders radial ring meters and horizontal progress bars — no external chart libraries |

---

## 8. PDF Underwriting Report Generation

| Feature | Details |
|---------|---------|
| **PDF Engine** | PDFKit — pure Node.js vector PDF generation |
| **Zero Disk Storage** | PDF is piped directly from PDFKit stream into `res` — never written to disk |
| **Dynamic Content** | Each PDF is generated fresh from the live database — always up-to-date |
| **Report Contents** | Institutional header, borrower profile metrics, programmatic risk scores, fraud diagnostic results, AI narrative summaries, compliance footer |
| **Secure Download** | JWT-authenticated — Loan Officers can only download reports for their own applicants |
| **Filename Convention** | `Underwriting_Report_[FirstName]_[LastName].pdf` |
| **Browser Auto-Download** | Frontend creates a temporary Blob URL and triggers `<a>` click automatically |
| **Assessment Gate** | Attempting to download a report before running assessment returns `HTTP 400` |

---

## 9. Immutable Compliance Audit Logging

| Feature | Details |
|---------|---------|
| **Append-Only Architecture** | No UPDATE/DELETE operations on `audit_logs` at the application layer |
| **13 Tracked Action Types** | Login, signup, all CRUD events, assessments, PDF downloads, and blocked access attempts |
| **Structured JSON Metadata** | Each log entry stores a JSON `details` blob with full operation context (scores, ratios, names, etc.) |
| **IP Address Tracking** | Client IPv4/IPv6 address recorded on every log entry |
| **User Attribution** | Every log entry linked to the operating user via `user_id` |
| **Cascading History Preservation** | `ON DELETE SET NULL` keeps compliance trails even after user deletion |
| **Admin-Only Viewer** | `/api/audit-logs` restricted to `admin` role at both route and controller levels |
| **Pagination Support** | Supports `page`, `limit`, `action`, `userId`, `targetId` filter parameters |
| **Frontend Expandable Drawers** | Admin UI supports clicking any log row to reveal the full parsed JSON metadata inline |

---

## 10. Production Security Hardening

| Feature | Details |
|---------|---------|
| **Helmet HTTP Headers** | Injects CSP, HSTS, X-Frame-Options, X-Content-Type-Options on every response |
| **Auth Rate Limiter** | 100 requests per 15 minutes per IP on `/api/auth/*` |
| **Global API Rate Limiter** | 500 requests per 15 minutes per IP on all routes |
| **Winston Structured Logger** | Persistent JSON file logging to `logs/combined.log` and `logs/error.log` with daily rotation |
| **Error Sanitization** | Production error handler strips stack traces — clients never see internal server details |
| **Parameterized SQL Queries** | All database queries use `?` placeholders — SQL injection impossible |
| **CORS Configuration** | Configurable allowed origins via `FRONTEND_URL` environment variable |
| **Operational Error Classes** | Custom `AppError` class distinguishes operational errors from programmer bugs |

---

## 11. Visual React Frontend

| Feature | Details |
|---------|---------|
| **Framework** | Vite + React 18 |
| **Design System** | Vanilla CSS — Inter & Outfit fonts, dark glassmorphism theme, CSS variables |
| **Login Page** | Split-panel frosted glass with live underwriting file highlights on the left |
| **Dashboard** | KPI ribbon, custom SVG charts, full CRUD table with search, filter, and action buttons |
| **Underwriting Review Page** | Double SVG circular gauges, KYC checklist, 4-panel AI narratives, Lead Auditor signature stamp |
| **Admin Audit Log Viewer** | Filterable timeline grid, expandable JSON drawers, pagination controls |
| **Custom CSS Charts** | Radial ring meters + horizontal progress bars — no chart library dependencies |
| **Micro-Animations** | Fade-in transitions, hover glows, gauge animations, stamp scale-up effects |
| **Protected Route Gates** | Unauthenticated → redirect to `/login`; Unauthorized role → redirect to `/dashboard` |
| **Responsive API Wrapper** | Centralized `api.js` auto-injects JWT headers, handles `401` expiry, and triggers PDF downloads |
| **Production Bundle** | 307 kB JS (gzip: 88 kB) — built in ~235ms with zero warnings |
