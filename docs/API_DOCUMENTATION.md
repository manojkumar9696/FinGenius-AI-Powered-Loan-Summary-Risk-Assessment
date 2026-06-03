# FinGenius — API Documentation

**AI-Powered Loan Application Summary & Risk Assessment System**
**Base URL**: `http://localhost:5000/api`
**Auth Scheme**: `Bearer JWT` (via `Authorization` header)
**Content-Type**: `application/json`

---

## Authentication

All protected endpoints require a valid JWT token issued at login.

```
Authorization: Bearer <token>
```

Tokens expire based on `JWT_EXPIRES_IN` in `.env` (default: `8h`).

---

## 1. Auth Endpoints

### POST `/api/auth/login`
Authenticate a user and receive a JWT session token.

**Request Body:**
```json
{
  "email": "admin@bank.com",
  "password": "Password123"
}
```

**Success Response `200`:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@bank.com",
      "role": "admin"
    }
  }
}
```

**Error Responses:**
| Code | Reason |
|------|--------|
| `400` | Missing email or password |
| `401` | Incorrect email or password |
| `429` | Too many login attempts (brute-force rate limit) |

---

### POST `/api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@bank.com",
  "password": "SecurePass123",
  "role": "loan_officer"
}
```

**Success Response `201`:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "data": {
    "user": {
      "id": 3,
      "username": "newuser",
      "email": "newuser@bank.com",
      "role": "loan_officer"
    }
  }
}
```

**Error Responses:**
| Code | Reason |
|------|--------|
| `400` | Validation failed (missing fields, weak password) |
| `409` | Email already registered |
| `429` | Too many registration attempts |

---

## 2. Applicant Endpoints

> 🔒 All applicant endpoints require a valid JWT. Loan Officers can only access applicants they created. Admins have full portfolio access.

### GET `/api/applicants`
Retrieve all applicant profiles in the caller's portfolio scope.

**Headers:** `Authorization: Bearer <token>`

**Success Response `200`:**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "applicants": [
      {
        "id": 1,
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@email.com",
        "ssn": "123-45-6789",
        "credit_score": 750,
        "loan_amount": "35000.00",
        "status": "approved",
        "created_at": "2026-06-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET `/api/applicants/:id`
Retrieve a single applicant profile by ID.

**URL Params:** `id` — Applicant's database ID

**Success Response `200`:**
```json
{
  "status": "success",
  "data": {
    "applicant": { ...full applicant object... }
  }
}
```

**Error Responses:**
| Code | Reason |
|------|--------|
| `403` | You do not own this applicant profile |
| `404` | No applicant found with that ID |

---

### POST `/api/applicants`
Register a new borrower credit profile.

**Request Body:**
```json
{
  "first_name": "Thomas",
  "last_name": "Carter",
  "email": "thomas.carter@email.com",
  "phone": "555-0199",
  "ssn": "444-55-6789",
  "date_of_birth": "1985-03-12",
  "monthly_income": 7500,
  "monthly_debt": 1800,
  "credit_score": 690,
  "employment_status": "employed",
  "loan_amount": 45000,
  "loan_purpose": "home improvement",
  "loan_term_months": 60
}
```

**Validation Rules:**
- `date_of_birth`: Applicant must be **18 years or older**
- `credit_score`: Must be between **300 and 850** (FICO range)
- `employment_status`: One of `employed`, `self_employed`, `unemployed`, `retired`
- `monthly_income` / `monthly_debt` / `loan_amount`: Must be positive numbers

**Success Response `201`:**
```json
{
  "status": "success",
  "data": { "applicant": { ...new applicant object... } }
}
```

---

### PUT `/api/applicants/:id`
Update an existing borrower profile.

> 🔒 Loan Officers cannot manually change `status` — only Admins can.

**Request Body:** Any subset of applicant fields to update.

**Success Response `200`:**
```json
{
  "status": "success",
  "data": { "applicant": { ...updated applicant object... } }
}
```

---

### DELETE `/api/applicants/:id`
Permanently delete an applicant record and all associated data (cascades to `risk_assessments`, `fraud_checks`, `audit_logs`).

> 🔴 **Admin only.**

**Success Response `200`:**
```json
{
  "status": "success",
  "message": "Applicant record successfully deleted."
}
```

---

### GET `/api/applicants/:id/report`
Stream a binary PDF underwriting report directly to the client.

**Success Response `200`:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Underwriting_Report_John_Smith.pdf"
[Binary PDF stream]
```

**Error Responses:**
| Code | Reason |
|------|--------|
| `400` | Assessment not yet run for this applicant |
| `403` | Not your applicant |

---

## 3. Assessment Endpoints

### POST `/api/assessments/:applicantId`
Trigger the full underwriting engine: programmatic risk calculations + Gemini AI narratives + fraud diagnostics.

**URL Params:** `applicantId` — Target applicant's ID

**What fires:**
1. `riskService.evaluateRisk()` — DTI, LTI, risk score, risk tier, eligibility
2. `aiService.generateUnderwritingReport()` — Gemini 2.5 Flash 4-part narrative JSON
3. `fraudService.checkFraudProfile()` — SSN duplicate, income anomaly, missing info checks
4. Upserts into `risk_assessments` and `fraud_checks` tables
5. Updates parent `applicants.status`
6. Writes `ASSESS_APPLICANT` audit log

**Success Response `200`:**
```json
{
  "status": "success",
  "data": {
    "assessment": {
      "risk_score": 35,
      "risk_level": "low",
      "debt_to_income_ratio": "24.00",
      "loan_to_income_ratio": "1.00",
      "eligibility_status": "eligible",
      "ai_summary": "Thomas Carter presents a solid credit profile...",
      "ai_eligibility_explanation": "Strong income relative to debt...",
      "ai_risk_analysis": "Primary risk factors include...",
      "ai_recommendation": "Recommend approval with standard terms..."
    },
    "fraudCheck": {
      "is_duplicate": 0,
      "is_suspicious_income": 0,
      "is_missing_info": 0,
      "fraud_score": 0,
      "status": "pass"
    },
    "applicantStatus": "approved"
  }
}
```

---

### GET `/api/assessments/:applicantId`
Retrieve the previously computed underwriting assessment for an applicant.

**Success Response `200`:**
```json
{
  "status": "success",
  "data": {
    "assessment": { ...full risk_assessments row... },
    "fraudCheck": { ...full fraud_checks row... }
  }
}
```

**Error Response `404`:** No assessment found — run POST first.

---

## 4. Dashboard Endpoint

### GET `/api/dashboard/stats`
Retrieve aggregated portfolio analytics. Results are scoped to the caller's portfolio (Loan Officers see only their own applicants; Admins see all).

**Success Response `200`:**
```json
{
  "status": "success",
  "data": {
    "portfolioScope": "global",
    "metrics": {
      "totalApplications": 10,
      "completedApplications": 7,
      "approvalRatePercent": 57.14,
      "statusDistribution": {
        "pending": 3,
        "approved": 4,
        "rejected": 3
      },
      "riskDistribution": {
        "low": 4,
        "medium": 2,
        "high": 1
      },
      "fraudDistribution": {
        "pass": 5,
        "review": 1,
        "flagged": 1
      }
    }
  }
}
```

---

## 5. Audit Logs Endpoint

> 🔴 **Admin only.**

### GET `/api/audit-logs`
Retrieve paginated compliance audit trail records with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `action` | string | Filter by action type (e.g. `LOGIN_SUCCESS`) |
| `userId` | number | Filter by operator user ID |
| `targetId` | string | Filter by target applicant/profile ID |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Records per page (default: `50`) |

**Example:** `GET /api/audit-logs?action=ASSESS_APPLICANT&limit=10&page=2`

**Success Response `200`:**
```json
{
  "status": "success",
  "results": 10,
  "pagination": {
    "totalRecords": 114,
    "currentPage": 2,
    "totalPages": 12,
    "limit": 10
  },
  "data": {
    "logs": [
      {
        "id": 45,
        "user_id": 2,
        "action": "ASSESS_APPLICANT",
        "target_id": "3",
        "details": "{\"message\":\"...\",\"riskScore\":35}",
        "ip_address": "::1",
        "created_at": "2026-06-02T05:55:00.000Z",
        "username": "officer",
        "email": "officer@bank.com"
      }
    ]
  }
}
```

**Tracked Action Types:**
| Action | Trigger |
|--------|---------|
| `LOGIN_SUCCESS` | Successful authentication |
| `LOGIN_FAILURE` | Failed login attempt |
| `USER_REGISTERED` | New account creation |
| `CREATE_APPLICANT` | New borrower profile registered |
| `READ_APPLICANT` | Borrower profile viewed |
| `READ_APPLICANT_BLOCKED` | Unauthorized profile access attempt |
| `UPDATE_APPLICANT` | Borrower profile modified |
| `DELETE_APPLICANT` | Borrower record deleted |
| `ASSESS_APPLICANT` | Risk/AI/Fraud engine executed |
| `READ_ASSESSMENT` | Assessment details viewed |
| `READ_ASSESSMENT_BLOCKED` | Unauthorized assessment access attempt |
| `DOWNLOAD_REPORT` | PDF report downloaded |
| `DOWNLOAD_REPORT_BLOCKED` | Unauthorized PDF download attempt |

---

## 6. Health Endpoint

### GET `/api/health`
System health ping. No authentication required.

**Success Response `200`:**
```json
{
  "status": "success",
  "message": "FinGenius API is operational",
  "database": "connected",
  "uptime": "1723 seconds",
  "timestamp": "2026-06-02T06:15:00.000Z"
}
```

---

## Error Response Format

All error responses follow a consistent schema:

```json
{
  "status": "fail",
  "message": "Human-readable error description"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Bad request / validation failure |
| `401` | Unauthenticated — JWT missing or expired |
| `403` | Forbidden — insufficient role/ownership |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Rate Limiting

| Route Group | Limit | Window |
|-------------|-------|--------|
| `/api/auth/*` | 100 requests | 15 minutes per IP |
| All other routes | 500 requests | 15 minutes per IP |

Exceeding limits returns `HTTP 429` with message:
```
"Brute force safeguard triggered: too many requests. Try again after 15 minutes."
```
