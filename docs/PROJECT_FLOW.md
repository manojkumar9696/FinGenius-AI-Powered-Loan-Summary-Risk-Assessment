# FinGenius — Project Flow

**AI-Powered Loan Application Summary & Risk Assessment System**
**Architecture**: React SPA → Express REST API → MySQL → Google Gemini AI

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER CLIENT                             │
│  React (Vite) SPA — http://localhost:5173                       │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  ┌─────────┐  │
│  │  Login   │  │Dashboard │  │UnderwritingReview│  │AuditLog │  │
│  │ Signup   │  │          │  │                 │  │ Viewer  │  │
│  └──────────┘  └──────────┘  └─────────────────┘  └─────────┘  │
│       │              │                │                  │      │
│       └──────────────┴────────────────┴──────────────────┘      │
│                          api.js (HTTP + JWT)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST (port 5000)
┌──────────────────────────────▼──────────────────────────────────┐
│                    BACKEND API SERVER                           │
│  Node.js + Express — http://localhost:5000                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Middleware Stack                                        │   │
│  │  Helmet → CORS → Rate Limiter → JSON Parser → Auth Gate  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────┐   │
│  │   Auth    │ │Applicants │ │Assessment│ │  Audit Logs    │   │
│  │ Controller│ │Controller │ │Controller│ │  Controller    │   │
│  └───────────┘ └───────────┘ └──────────┘ └────────────────┘   │
│       │              │             │                │           │
│  ┌────▼────────────────▼───────────▼────────────────▼──────┐   │
│  │              Service Layer                               │   │
│  │  risk.service │ ai.service │ fraud.service │ pdf.service  │   │
│  │              audit.service                              │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │         Winston Logger — logs/combined.log               │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ MySQL2 Connection Pool
┌──────────────────────────────▼──────────────────────────────────┐
│                       MySQL DATABASE                            │
│  loan_assessment_db (port 3306)                                 │
│  ┌──────────┐ ┌────────────┐ ┌──────────────┐ ┌────────────┐   │
│  │  users   │ │ applicants │ │risk_assessm..│ │fraud_check │   │
│  └──────────┘ └────────────┘ └──────────────┘ └────────────┘   │
│                        ┌──────────────┐                         │
│                        │  audit_logs  │                         │
│                        └──────────────┘                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS API
┌──────────────────────────────▼──────────────────────────────────┐
│                    GOOGLE GEMINI AI                             │
│  gemini-2.5-flash — generativelanguage.googleapis.com          │
│  (Structured JSON narrative output — fault-tolerant fallback)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Journey Flows

### Flow A — Loan Officer: Full Application Processing

```
1. LOGIN
   ─────────────────────────────────────────────────────
   Officer enters email/password
        → POST /api/auth/login
        → bcrypt.compare(password, hash)
        → JWT issued (8h expiry)
        → audit_log: LOGIN_SUCCESS
        → Frontend stores token in localStorage
        → Redirect to /dashboard

2. REGISTER BORROWER
   ─────────────────────────────────────────────────────
   Officer opens "Register Borrower" modal → fills form
        → Client validates: age ≥ 18, FICO 300–850
        → POST /api/applicants
        → Server validates with Joi schema
        → INSERT applicants (status: 'pending', created_by: officer_id)
        → audit_log: CREATE_APPLICANT
        → New row appears in dashboard grid

3. RUN UNDERWRITING ENGINE
   ─────────────────────────────────────────────────────
   Officer clicks "⚙️ RUN RISKS" on applicant row
        → POST /api/assessments/:applicantId
        → Parallel execution:
            ├── riskService.evaluateRisk()
            │       Calculates DTI, LTI, risk_score, risk_level
            │       Determines eligibility_status
            │       Sets approval_recommendation
            │
            ├── aiService.generateUnderwritingReport()
            │       Sends structured prompt to Gemini 2.5 Flash
            │       Returns 4-field JSON narrative
            │       Falls back to mock if API unavailable
            │
            └── fraudService.checkFraudProfile()
                    SSN duplicate query → applicants table
                    Income anomaly threshold check
                    Missing field check
                    Computes fraud_score and status

        → UPSERT risk_assessments (all computed columns)
        → UPSERT fraud_checks (all flag columns)
        → UPDATE applicants.status
             (If fraud_status = 'flagged' → force 'rejected')
             (Else if approval_recommendation = 'approve' → 'approved')
             (Else if recommendation = 'decline' → 'rejected')
             (Else → 'pending')
        → audit_log: ASSESS_APPLICANT (with full metadata JSON)
        → Dashboard status badge updates live

4. REVIEW AI UNDERWRITING COCKPIT
   ─────────────────────────────────────────────────────
   Officer clicks applicant name → navigates to /applicants/:id
        → GET /api/applicants/:id
        → GET /api/assessments/:id
        → Page renders:
            - Metrics ribbon (income, debt, loan, DTI)
            - FICO gauge (SVG circle animates to score)
            - Fraud score gauge (SVG animates to fraud_score)
            - KYC checklist (3 flag indicators with dot colors)
            - 4 AI narrative panels (Gemini output)
        → Officer reviews and checks both compliance checkboxes
        → Clicks "SIGN-OFF COMPLIANCE REGISTRY"
        → Red metallic seal stamp animates in
        → Locked signature block displays: [username] | SHA256 | [timestamp]

5. DOWNLOAD PDF REPORT
   ─────────────────────────────────────────────────────
   Officer clicks "📄 PDF" or "📄 DOWNLOAD COMPLIANCE REPORT"
        → GET /api/applicants/:id/report
        → Auth check: verify token + portfolio ownership
        → PDFKit generates binary stream:
              Institutional header
              Borrower metrics table
              Risk assessment scores
              Fraud diagnostic results
              AI narrative summaries
              Compliance footer
        → Response piped directly (no disk write)
        → Browser auto-downloads: "Underwriting_Report_[Name].pdf"
        → audit_log: DOWNLOAD_REPORT
```

---

### Flow B — Admin: Compliance Audit Review

```
1. LOGIN as Admin
   ─────────────────────────────────────────────────────
   admin@bank.com → POST /api/auth/login → JWT (role: admin)
   audit_log: LOGIN_SUCCESS

2. VIEW GLOBAL PORTFOLIO
   ─────────────────────────────────────────────────────
   Admin's /dashboard shows ALL applicants (not portfolio-scoped)
   Dashboard stats show totals across all Loan Officers

3. INSPECT AUDIT TRAIL
   ─────────────────────────────────────────────────────
   Admin clicks "🔒 INSPECT AUDIT TRAILS" in header
        → GET /api/audit-logs?limit=20
        → Admin role validated at route level (restrictTo)
        → Admin role re-validated at controller level (double guard)
        → Timeline grid renders with:
              Timestamp | Username | Action Badge | Target | IP
        → Filter by action type (dropdown) → re-fetch with ?action=X
        → Filter by target ID → re-fetch with ?targetId=Y
        → Click any row → expandable JSON drawer opens
        → Paginate with PREV / NEXT controls

4. MANAGE APPLICANTS
   ─────────────────────────────────────────────────────
   Admin can view, edit, or DELETE any applicant (cross-portfolio)
        → DELETE /api/applicants/:id
        → Cascade deletes: risk_assessments, fraud_checks
        → Audit log reference SET NULL (preserved for compliance)
        → audit_log: DELETE_APPLICANT
```

---

## Security Interception Flows

### Brute Force Attack Scenario
```
Attacker → POST /api/auth/login (× 101 within 15 min)
     → Request 1–100: normal auth processing
     → Request 101+:
          express-rate-limit intercepts BEFORE controllers
          → HTTP 429
          → audit_log: Brute force warning (winston WARN)
          → No database query executed
```

### Unauthorized Access Attempt
```
Loan Officer → GET /api/audit-logs
     → protect() validates JWT ✅
     → restrictTo('admin') checks req.user.role
     → role = 'loan_officer' → throws AppError(403)
     → audit_log: No entry (blocked at middleware)
     → Frontend receives 403 → renders error banner → redirects to /dashboard
```

### Token Expiry Flow
```
User sends request with expired JWT
     → protect() middleware: jwt.verify() throws TokenExpiredError
     → AppError(401): "Your session has expired. Please log in again."
     → Frontend api.js intercepts 401 response
     → Calls authContext.logout()
     → Clears localStorage (token + user)
     → Redirects to /login
```

---

## Data State Lifecycle

```
APPLICANT STATUS TRANSITIONS:

                    [Registration]
                         │
                         ▼
                    ┌─────────┐
                    │ PENDING │  ← Default on creation
                    └────┬────┘
                         │
               [Risk Engine triggered]
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
       ┌──────────┐ ┌─────────┐ ┌──────────┐
       │ APPROVED │ │ PENDING │ │ REJECTED │
       └──────────┘ └─────────┘ └──────────┘
      (risk=low +   (risk=med,  (risk=high /
       fraud=pass)  review rec)  fraud=flagged)
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 + Vite | Component-based SPA |
| **Frontend Routing** | react-router-dom v7 | Client-side navigation + route protection |
| **Frontend Styling** | Vanilla CSS + CSS Variables | Design system, glassmorphism, animations |
| **Backend Runtime** | Node.js 18+ | JavaScript server runtime |
| **Backend Framework** | Express.js | HTTP routing, middleware composition |
| **Database** | MySQL 8.x | Relational data persistence |
| **DB Driver** | mysql2/promise | Async pool connections + parameterized queries |
| **Authentication** | jsonwebtoken + bcryptjs | JWT issuance + password hashing |
| **Validation** | Joi | Server-side request body validation |
| **AI Engine** | @google/genai (Gemini 2.5 Flash) | Underwriting narrative generation |
| **PDF Generation** | PDFKit | Binary PDF stream construction |
| **HTTP Security** | Helmet | HTTP response header hardening |
| **Rate Limiting** | express-rate-limit | Brute force and abuse protection |
| **Logging** | Winston | Structured persistent file logging |
| **Environment** | dotenv | Secrets and config management |
