# FinGenius — Database Design

**AI-Powered Loan Application Summary & Risk Assessment System**
**Database Engine**: MySQL 8.x+
**Character Set**: `utf8mb4` / `utf8mb4_unicode_ci`
**Database Name**: `loan_assessment_db`

---

## Entity Relationship Overview

```
users (1) ─────────────────────────────── (N) applicants
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                                   (1)            (1)            (N)
                             risk_assessments  fraud_checks   audit_logs
```

| Relationship | Type | Constraint |
|---|---|---|
| `users` → `applicants` | One-to-Many | `ON DELETE SET NULL` — keeps applicant history if officer is deleted |
| `applicants` → `risk_assessments` | One-to-One | `ON DELETE CASCADE` — drops assessment when applicant is deleted |
| `applicants` → `fraud_checks` | One-to-One | `ON DELETE CASCADE` — drops fraud check when applicant is deleted |
| `users` → `audit_logs` | One-to-Many | `ON DELETE SET NULL` — preserves compliance history if user is deleted |

---

## Table Definitions

### 1. `users`
Manages authentication identities and role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK, AUTO_INCREMENT | Unique user identifier |
| `username` | `VARCHAR(50)` | NOT NULL | Display name |
| `email` | `VARCHAR(100)` | NOT NULL, UNIQUE | Login email address |
| `password` | `VARCHAR(255)` | NOT NULL | bcrypt hashed password (12 rounds) |
| `role` | `ENUM('admin','loan_officer')` | NOT NULL, DEFAULT `loan_officer` | RBAC classification |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | `TIMESTAMP` | ON UPDATE NOW() | Last modification timestamp |

**Seeded Default Accounts:**
| Username | Email | Role |
|----------|-------|------|
| `admin` | `admin@bank.com` | `admin` |
| `officer` | `officer@bank.com` | `loan_officer` |

---

### 2. `applicants`
Stores all borrower credit profiles submitted for underwriting review.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK, AUTO_INCREMENT | Unique applicant identifier |
| `first_name` | `VARCHAR(50)` | NOT NULL | Borrower first name |
| `last_name` | `VARCHAR(50)` | NOT NULL | Borrower last name |
| `email` | `VARCHAR(100)` | NOT NULL | Contact email address |
| `phone` | `VARCHAR(20)` | NULL | Contact phone number |
| `ssn` | `VARCHAR(11)` | NOT NULL | National ID / SSN (format: `XXX-XX-XXXX`) |
| `date_of_birth` | `DATE` | NOT NULL | DOB — must result in age ≥ 18 |
| `monthly_income` | `DECIMAL(12,2)` | NOT NULL | Gross monthly income (USD) |
| `monthly_debt` | `DECIMAL(12,2)` | NOT NULL | Total monthly debt obligations (USD) |
| `credit_score` | `INT` | NOT NULL | FICO credit score (valid range: 300–850) |
| `employment_status` | `ENUM(...)` | NOT NULL | `employed`, `self_employed`, `unemployed`, `retired` |
| `loan_amount` | `DECIMAL(12,2)` | NOT NULL | Requested loan amount (USD) |
| `loan_purpose` | `VARCHAR(100)` | NOT NULL | Purpose description (e.g. home improvement) |
| `loan_term_months` | `INT` | NOT NULL | Loan repayment duration in months |
| `status` | `ENUM('pending','approved','rejected')` | DEFAULT `pending` | Current application lifecycle status |
| `created_by` | `INT` | FK → `users.id`, NULL | Originating Loan Officer user ID |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Profile creation timestamp |
| `updated_at` | `TIMESTAMP` | ON UPDATE NOW() | Last modification timestamp |

**Key Business Rules:**
- `status` is **only updated programmatically** by the risk engine — Loan Officers cannot manually override it
- `created_by` uses `ON DELETE SET NULL` to preserve compliance history if the managing officer is deleted
- `ssn` is checked against existing records by the fraud engine to detect identity duplication

---

### 3. `risk_assessments`
Stores the computed underwriting decisions and Google Gemini AI narratives for each applicant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK, AUTO_INCREMENT | Unique assessment identifier |
| `applicant_id` | `INT` | UNIQUE, FK → `applicants.id` | One-to-one link to applicant |
| `debt_to_income_ratio` | `DECIMAL(5,2)` | NOT NULL | DTI % = `(monthly_debt / monthly_income) × 100` |
| `loan_to_income_ratio` | `DECIMAL(5,2)` | NOT NULL | LTI = `loan_amount / (monthly_income × 12)` |
| `risk_score` | `INT` | NOT NULL | Composite risk score (0–100, higher = riskier) |
| `risk_level` | `ENUM('low','medium','high')` | NOT NULL | Derived from risk score thresholds |
| `eligibility_status` | `ENUM('eligible','ineligible')` | NOT NULL | Binary underwriting eligibility decision |
| `eligibility_explanation` | `TEXT` | NULL | Human-readable rule engine resolution statement |
| `approval_recommendation` | `ENUM('approve','review','decline')` | NOT NULL | Final underwriting recommendation |
| `ai_summary` | `TEXT` | NULL | Gemini AI borrower profile narrative |
| `ai_eligibility_explanation` | `TEXT` | NULL | Gemini AI mitigating factors explanation |
| `ai_risk_analysis` | `TEXT` | NULL | Gemini AI credit risk vector breakdown |
| `ai_recommendation` | `TEXT` | NULL | Gemini AI manual underwriter directives |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Assessment creation timestamp |
| `updated_at` | `TIMESTAMP` | ON UPDATE NOW() | Last recalculation timestamp |

**Risk Score Thresholds (programmatic rules):**

| Condition | Score Penalty |
|-----------|---------------|
| DTI > 43% | +30 points |
| DTI 36–43% | +15 points |
| Credit score < 580 | +30 points |
| Credit score 580–669 | +15 points |
| LTI > 5.0x | +20 points |
| LTI 3.5–5.0x | +10 points |
| Unemployed status | +20 points |

| Risk Score Range | Risk Level | Recommendation |
|-----------------|------------|----------------|
| 0–35 | `low` | `approve` |
| 36–65 | `medium` | `review` |
| 66–100 | `high` | `decline` |

---

### 4. `fraud_checks`
Stores the automated KYC and anti-fraud diagnostic results for each applicant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK, AUTO_INCREMENT | Unique fraud check identifier |
| `applicant_id` | `INT` | UNIQUE, FK → `applicants.id` | One-to-one link to applicant |
| `is_duplicate` | `TINYINT(1)` | DEFAULT `0` | `1` if SSN already exists in `applicants` table |
| `is_suspicious_income` | `TINYINT(1)` | DEFAULT `0` | `1` if income/FICO ratio exceeds compliance thresholds |
| `is_missing_info` | `TINYINT(1)` | DEFAULT `0` | `1` if required fields are null or empty |
| `fraud_score` | `INT` | DEFAULT `0` | Weighted composite threat score (0–100) |
| `status` | `ENUM('pass','review','flagged')` | DEFAULT `pass` | Final fraud classification |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Check execution timestamp |
| `updated_at` | `TIMESTAMP` | ON UPDATE NOW() | Last recalculation timestamp |

**Fraud Score Weighting Matrix:**

| Flag | Score Added |
|------|-------------|
| `is_duplicate = true` | +60 points |
| `is_suspicious_income = true` | +25 points |
| `is_missing_info = true` | +15 points |

| Fraud Score Range | Status | Effect |
|------------------|--------|--------|
| 0–24 | `pass` | Normal processing |
| 25–49 | `review` | Queued for manual review |
| 50–100 | `flagged` | **Auto-reject override** — parent `applicants.status` forced to `rejected` regardless of risk score |

---

### 5. `audit_logs`
Immutable, append-only compliance event ledger tracing all system-critical operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK, AUTO_INCREMENT | Unique log entry identifier |
| `user_id` | `INT` | FK → `users.id`, NULL | Operator who performed the action (NULL = system/anonymous) |
| `action` | `VARCHAR(50)` | NOT NULL | Action category code (e.g. `ASSESS_APPLICANT`) |
| `target_id` | `VARCHAR(50)` | NULL | Affected resource ID (e.g. applicant ID) |
| `details` | `TEXT` | NULL | JSON blob with full operation metadata |
| `ip_address` | `VARCHAR(45)` | NULL | Originating IPv4 or IPv6 client address |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Log creation timestamp (immutable) |

> ⚠️ **Compliance Note**: The `audit_logs` table has **no UPDATE or DELETE** application-level operations. All entries are append-only to ensure SOC2/GLBA audit trail integrity. The only deletion pathway is a direct database administrator action.

---

## Indexes & Performance Notes

The following indexes are recommended for production environments:

```sql
-- Speed up portfolio-scoped applicant queries
CREATE INDEX idx_applicants_created_by ON applicants(created_by);

-- Speed up applicant status filtering on dashboard
CREATE INDEX idx_applicants_status ON applicants(status);

-- Speed up audit log action-type filtering
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Speed up audit log user queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Speed up time-based audit log pagination
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Data Flow Summary

```
1. Loan Officer registers applicant
        ↓ INSERT applicants
2. Risk Engine triggered (POST /api/assessments/:id)
        ↓ riskService     → UPSERT risk_assessments
        ↓ aiService       → UPDATE risk_assessments (AI columns)
        ↓ fraudService    → UPSERT fraud_checks
        ↓ statusUpdate    → UPDATE applicants.status
        ↓ auditService    → INSERT audit_logs
3. Admin views compliance trail
        ↓ SELECT audit_logs LEFT JOIN users
```
