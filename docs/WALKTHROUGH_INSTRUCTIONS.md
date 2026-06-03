# FinGenius — End-to-End System Walkthrough & Compliance Instructions

**AI-Powered Loan Application Summary & Risk Assessment System**
**Classification: GLBA / SOC2 Institutional Compliance Documentation**
**Version: 1.0.0 | Build: Production**

---

## 1. System Overview

**FinGenius** is an enterprise-grade credit underwriting platform combining:
- Programmatic DTI / LTI / FICO risk calculations
- Google Gemini generative AI underwriting narratives
- Automated KYC & SSN velocity fraud detection
- Immutable MySQL compliance audit logging
- Cryptographically secured JWT session management
- PDF vector report streaming pipelines (PDFKit)
- Rate-limited, Helmet-hardened Express REST API

---

## 2. Seed Credentials (Default Accounts)

| Role          | Email                  | Password      | Access Scope                          |
|---------------|------------------------|---------------|---------------------------------------|
| **Admin**     | `admin@bank.com`       | `Password123` | Full system access + Audit Log viewer |
| **Loan Officer** | `officer@bank.com` | `Password123` | Portfolio-isolated applicant files    |

> ⚠️ **Security Note**: Change all default credentials immediately before any production deployment using `backend/src/utils/setup-db.js`.

---

## 3. Starting the System

### Step 1 — Start the Backend API Server
```bash
cd backend
npm start
```
Expected output:
```
[INFO] FinGenius API server initialized on port 5000
[INFO] MySQL database connection pool established successfully
[INFO] Winston structured loggers initialized — writing to logs/combined.log
```

### Step 2 — Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
Expected output:
```
  VITE ready in Xms
  ➜  Local:   http://localhost:5173/
```

### Step 3 — Open the Application
Navigate to `http://localhost:5173/` in your browser.

---

## 4. End-to-End Compliance Walkthrough

### 📋 STEP 1: Authentication & Session Establishment

1. Navigate to `http://localhost:5173/login`
2. Enter credentials: `officer@bank.com` / `Password123`
3. Click **SIGN IN TO COMPLIANCE COCKPIT**
4. **Verify**: You are redirected to `/dashboard` and the Header bar shows your username and `LOAN_OFFICER` role badge
5. **Verify**: The local browser storage (`localStorage`) contains a valid `token` JWT and `user` object

**Security boundary test:**
- Open a new incognito tab and navigate directly to `/dashboard`
- **Expected**: You are instantly redirected to `/login` (ProtectedRoute gate fires)

---

### 📋 STEP 2: Register a New Borrower Profile

1. From the Dashboard, click **➕ REGISTER BORROWER FILE**
2. Fill in the modal form with the following sample data:

| Field              | Value                     |
|--------------------|---------------------------|
| First Name         | `Thomas`                  |
| Last Name          | `Carter`                  |
| Email              | `thomas.carter@email.com` |
| Phone              | `555-0199`                |
| SSN                | `444-55-6789`             |
| Date of Birth      | `1985-03-12`              |
| Monthly Income     | `7500`                    |
| Monthly Debt       | `1800`                    |
| Credit Score       | `690`                     |
| Employment Status  | `employed`                |
| Loan Amount        | `45000`                   |
| Loan Purpose       | `home improvement`        |
| Loan Term (Months) | `60`                      |

3. Click **REGISTER APPLICANT**
4. **Verify**: Thomas Carter appears in the Cockpit Records grid with status badge `PENDING`
5. **Verify**: The DTI column shows `24%` — calculated inline on the frontend `(1800 / 7500 * 100)`

**Validation boundary test:**
- Try setting Date of Birth to any date within the last 18 years
- **Expected**: The form rejects it with `Applicant must be at least 18 years old`
- Try setting Credit Score to `200` (below valid FICO floor)
- **Expected**: The form rejects it with `Credit score must be between 300 and 850`

---

### 📋 STEP 3: Run Programmatic Risk Assessment & AI Engine

1. In the Cockpit Records grid, find **Thomas Carter**
2. Click **⚙️ RUN RISKS** on his row
3. **Verify**: The button changes to `ASSESSING...` during the calculation
4. **Verify**: After completion, Thomas Carter's status badge updates to either `APPROVED` or `REJECTED` based on engine output
5. **Verify**: Dashboard KPI counters update — "Completed Audits" increments by 1

**What fires behind the scenes:**
- `POST /api/assessments/:id` triggers:
  - `riskService.evaluateRisk()` — calculates DTI, LTI, risk score, risk tier, eligibility
  - `aiService.generateUnderwritingReport()` — calls Gemini 2.5 Flash for 4-part narrative JSON
  - `fraudService.checkFraudProfile()` — SSN duplicate check, income/FICO ratio validation, missing info check
  - Upserts computed results into `risk_assessments` and `fraud_checks` MySQL tables
  - Updates parent `applicants.status` field
  - Writes a full `ASSESS_APPLICANT` entry to `audit_logs`

---

### 📋 STEP 4: Inspect the AI Underwriting Review Cockpit

1. Click the borrower name **Thomas Carter** (glowing cyan link) OR click **🔬 REVIEW**
2. **Verify**: You are routed to `/applicants/:id`
3. **Verify the Metrics Ribbon**: Displays masked SSN (`***-**-6789`), gross income, loan amount, purpose, and DTI footprint
4. **Verify the FICO Gauge**: Animates to 690 score position — the SVG circle fills in **orange** (subprime tier: 600–699)
5. **Verify the Fraud Gauge**: SVG animates to the computed fraud score — color corresponds to risk severity
6. **Verify the KYC Checklist**:
   - `SSN Velocity Check`: Green dot (444-55-6789 is unique in database)
   - `Suspicious Earnings Check`: Green or Orange dot depending on income/FICO correlation
   - `Identity Integrity Check`: Green dot (all fields provided)
7. **Verify the Gemini AI Synthesis Panels**:
   - Section 1: Borrower profile narrative summary
   - Section 2: Mitigating credit factors and capacity strengths
   - Section 3: Debt leverage risk vector breakdowns
   - Section 4: Manual underwriter audit directives
8. **Perform Lead Auditor Sign-Off**:
   - Check ✅ `I verify that all compliance & duplicate identity checks have been resolved`
   - Check ✅ `I verify that the Gemini AI synthesis has been audited for risk vectors`
   - Click **🖋️ SIGN-OFF COMPLIANCE REGISTRY**
   - **Verify**: A rotating red metallic seal stamp (`AURA SECURED — COMPLIANCE CERTIFIED`) animates into view
   - **Verify**: A locked signature block appears: `[USERNAME] | SHA256-SECURED | [TIMESTAMP]`

---

### 📋 STEP 5: Download the PDF Underwriting Report

1. From the Underwriting Review page, click **📄 DOWNLOAD COMPLIANCE REPORT**  
   — OR from the Dashboard, click **📄 PDF** on Thomas Carter's row
2. **Verify**: Your browser automatically downloads `Underwriting_Report_Thomas_Carter.pdf`
3. **Verify**: The PDF contains:
   - Institutional header (`FinGenius Compliance Report`)
   - All borrower profile metrics (income, debt, FICO, loan details)
   - Programmatic risk assessment scores (DTI, LTI, risk tier)
   - KYC fraud diagnostic results
   - Generative AI narrative summary sections
   - Official compliance footer

**Security boundary test:**
- Log in as `officer@bank.com` and attempt to download the PDF for an applicant owned by the Admin
- **Expected**: `403 Forbidden` — `You do not have permission to download this underwriting report`

---

### 📋 STEP 6: Inspect the Compliance Audit Trail (Admin Only)

1. **Log out** and log back in as `admin@bank.com` / `Password123`
2. Click **🔒 INSPECT AUDIT TRAILS** in the Header navigation bar
3. **Verify**: You are routed to `/audit` and the timeline grid loads the 20 most recent compliance logs
4. **Verify the Log Grid contains**:
   - A `ASSESS_APPLICANT` entry for Thomas Carter (from Step 3)
   - A `DOWNLOAD_REPORT` entry (from Step 5)
   - A `LOGIN_SUCCESS` entry for your current session
5. **Test Action Filter**:
   - Select `LOGIN_FAILURE` from the dropdown
   - **Verify**: The grid filters down to only failed authentication attempts
6. **Test JSON Drawer**:
   - Click any `ASSESS_APPLICANT` row
   - **Verify**: An expandable drawer opens showing the complete JSON metadata:
     ```json
     {
       "message": "Successfully executed underwriting assessment...",
       "dti": 24,
       "lti": 1.00,
       "riskScore": 52,
       "riskLevel": "medium",
       "fraudScore": 0,
       "fraudStatus": "pass",
       "parentStatus": "approved"
     }
     ```
7. **Test Pagination**:
   - Switch limit to `10 entries` — verify the grid shows exactly 10 rows
   - Click **NEXT ▶** — verify the page increments and fetches the next offset

**Security boundary test:**
- Log in as `officer@bank.com` and manually navigate to `/audit`
- **Expected**: Instantly redirected to `/dashboard` — `403 Access Denied` header fires

---

## 5. Production Security Verification Matrix

| Security Control              | Implementation                        | Verified |
|-------------------------------|---------------------------------------|----------|
| JWT Bearer Token Auth         | `auth.middleware.js` → `protect()`    | ✅       |
| Role-Based Access Control     | `restrictTo('admin')` middleware       | ✅       |
| Portfolio Insulation          | `created_by` WHERE clause             | ✅       |
| Password Hashing              | bcrypt (salt rounds: 12)              | ✅       |
| Helmet HTTP Security Headers  | CSP, HSTS, X-Frame-Options            | ✅       |
| Auth Brute Force Rate Limiter | 100 req / 15 min per IP on `/api/auth`| ✅       |
| Global API Rate Limiter       | 500 req / 15 min per IP               | ✅       |
| Winston Persistent Logging    | `logs/combined.log`, `logs/error.log` | ✅       |
| SQL Injection Guard           | Parameterized `?` MySQL queries       | ✅       |
| CORS Policy                   | `cors()` with configurable origins    | ✅       |

---

## 6. Database Schema Reference

| Table              | Purpose                                   | Key Relations              |
|--------------------|-------------------------------------------|----------------------------|
| `users`            | Authentication & role management          | —                          |
| `applicants`       | Borrower credit profile registry          | `created_by → users.id`    |
| `risk_assessments` | Programmatic + AI underwriting decisions  | `applicant_id → applicants.id` |
| `fraud_checks`     | KYC automated compliance diagnostics      | `applicant_id → applicants.id` |
| `audit_logs`       | Immutable SOC2 compliance event ledger    | `user_id → users.id`       |

---

## 7. API Endpoints Reference

| Method | Endpoint                         | Auth Required | Role     | Description                          |
|--------|----------------------------------|---------------|----------|--------------------------------------|
| POST   | `/api/auth/login`                | No            | Any      | Session login + JWT issuance         |
| POST   | `/api/auth/signup`               | No            | Any      | Account registration                 |
| GET    | `/api/applicants`                | Yes           | Any      | Fetch portfolio (scoped by role)     |
| POST   | `/api/applicants`                | Yes           | Any      | Register new borrower profile        |
| GET    | `/api/applicants/:id`            | Yes           | Any      | Fetch single applicant               |
| PUT    | `/api/applicants/:id`            | Yes           | Any      | Update borrower profile              |
| DELETE | `/api/applicants/:id`            | Yes           | Admin    | Hard-delete applicant record         |
| GET    | `/api/applicants/:id/report`     | Yes           | Any      | Stream PDF underwriting report       |
| POST   | `/api/assessments/:applicantId`  | Yes           | Any      | Run risk + AI + fraud engine         |
| GET    | `/api/assessments/:applicantId`  | Yes           | Any      | Fetch saved underwriting assessment  |
| GET    | `/api/dashboard/stats`           | Yes           | Any      | Portfolio aggregate statistics       |
| GET    | `/api/audit-logs`                | Yes           | Admin    | Fetch paginated compliance log trail |
| GET    | `/api/health`                    | No            | Any      | System health ping                   |

---

## 8. Environment Configuration Reference

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# Server
PORT=5000
NODE_ENV=production

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=loan_assessment_db

# JWT Security
JWT_SECRET=your_256bit_minimum_random_secret_key
JWT_EXPIRES_IN=8h

# Google Gemini AI (Optional — falls back to mock if missing)
GEMINI_API_KEY=your_google_ai_studio_api_key

# CORS
FRONTEND_URL=http://localhost:5173
```

---

## 9. Production Deployment Notes

Refer to `DEPLOYMENT.md` in the project root for:
- PM2 Node.js process cluster configuration
- Nginx reverse proxy virtual host templates
- MySQL indexing optimisation commands
- SSL/TLS certificate setup via Certbot
- Environment variable security hardening

---

*FinGenius v1.0.0 — GLBA / SOC2 Compliance Platform*
*Built with Node.js (Express), MySQL, React (Vite), Google Gemini AI*
