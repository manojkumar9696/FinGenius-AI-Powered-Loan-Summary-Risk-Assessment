import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

/**
 * Frosted-glass Overlay Modal Dialog for creations & updates
 * Hardened validations verify age bounds and credit scores locally.
 */
const ApplicantModal = ({ isOpen, onClose, onSuccess, applicant = null }) => {
  const { addToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ssn, setSsn] = useState('');
  const [dob, setDob] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyDebt, setMonthlyDebt] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('employed');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanTerm, setLoanTerm] = useState('36');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Hook existing records on edit mount
  useEffect(() => {
    if (applicant) {
      setFirstName(applicant.first_name || '');
      setLastName(applicant.last_name || '');
      setEmail(applicant.email || '');
      setPhone(applicant.phone || '');
      setSsn(applicant.ssn || '');
      
      // Parse date to standard input format: YYYY-MM-DD
      const parsedDob = applicant.date_of_birth 
        ? new Date(applicant.date_of_birth).toISOString().split('T')[0]
        : '';
      setDob(parsedDob);
      
      setMonthlyIncome(String(applicant.monthly_income || ''));
      setMonthlyDebt(String(applicant.monthly_debt || ''));
      setCreditScore(String(applicant.credit_score || ''));
      setEmploymentStatus(applicant.employment_status || 'employed');
      setLoanAmount(String(applicant.loan_amount || ''));
      setLoanPurpose(applicant.loan_purpose || '');
      setLoanTerm(String(applicant.loan_term_months || '36'));
    } else {
      // Wipes values on create mounts
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSsn('');
      setDob('');
      setMonthlyIncome('');
      setMonthlyDebt('');
      setCreditScore('');
      setEmploymentStatus('employed');
      setLoanAmount('');
      setLoanPurpose('');
      setLoanTerm('36');
    }
    setError('');
  }, [applicant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-submit hard validation checkups
    const parsedCredit = parseInt(creditScore, 10);
    if (parsedCredit < 300 || parsedCredit > 900) {
      setError('CIBIL credit score must reside strictly between 300 and 900.');
      addToast('Invalid credit score entered.', 'warning');
      return;
    }

    // Validate PAN Card or Aadhaar format
    const isPan = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(ssn);
    const isAadhaar = /^[0-9]{12}$/.test(ssn);
    if (!isPan && !isAadhaar) {
      setError('Invalid PAN Card (Format: ABCDE1234F) or Aadhaar Card (12 digits) format.');
      addToast('Invalid National ID format.', 'warning');
      return;
    }

    // Calculate age (compliance boundary: borrower must be 18+)
    const ageDiff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
      setError('Regulatory compliance restricts borrowing: applicant must be at least 18 years old.');
      addToast('Applicant must be 18+ years old.', 'warning');
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      ssn,
      date_of_birth: dob,
      monthly_income: parseFloat(monthlyIncome),
      monthly_debt: parseFloat(monthlyDebt),
      credit_score: parsedCredit,
      employment_status: employmentStatus,
      loan_amount: parseFloat(loanAmount),
      loan_purpose: loanPurpose,
      loan_term_months: parseInt(loanTerm, 10)
    };

    setLoading(true);

    try {
      if (applicant) {
        // Edit Action
        await api.updateApplicant(applicant.id, payload);
        addToast(`Modified borrower: ${firstName} ${lastName}`, 'success');
      } else {
        // Create Action
        await api.createApplicant(payload);
        addToast(`Registered borrower: ${firstName} ${lastName}`, 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Validation failed. Check form parameters.');
      addToast(err.message || 'Saving profile failed.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel" style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <h3>{applicant ? 'Modify Borrower File' : 'Register New Borrower File'}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="badge badge-danger" style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">First Name</label>
              <input className="form-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={loading} />
            </div>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Last Name</label>
              <input className="form-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={loading} />
            </div>
          </div>

          <div style={styles.formRow}>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Email Address</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Phone Contact</label>
              <input className="form-input" type="text" placeholder="555-123-4567" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} />
            </div>
          </div>

          <div style={styles.formRow}>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">PAN Card (or 12-digit Aadhaar)</label>
              <input className="form-input" type="text" placeholder="ABCDE1234F" value={ssn} onChange={e => setSsn(e.target.value.toUpperCase())} required disabled={loading} />
            </div>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Date of Birth</label>
              <input className="form-input" type="date" value={dob} onChange={e => setDob(e.target.value)} required disabled={loading} />
            </div>
          </div>

          <div style={styles.formRow}>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Monthly Gross Income (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} required disabled={loading} />
            </div>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Monthly Existing Debts (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={monthlyDebt} onChange={e => setMonthlyDebt(e.target.value)} required disabled={loading} />
            </div>
          </div>

          <div style={styles.formRow}>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">CIBIL Credit Score (300-900)</label>
              <input className="form-input" type="number" min="300" max="900" value={creditScore} onChange={e => setCreditScore(e.target.value)} required disabled={loading} />
            </div>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Employment Status</label>
              <select className="form-input" value={employmentStatus} onChange={e => setEmploymentStatus(e.target.value)} style={styles.select} disabled={loading}>
                <option value="employed">Salaried Employed</option>
                <option value="self_employed">Self Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          <div style={styles.formRow}>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Requested Loan Amount (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} required disabled={loading} />
            </div>
            <div className="input-group" style={styles.flexItem}>
              <label className="input-label">Loan Purpose</label>
              <input className="form-input" type="text" placeholder="Debt Consolidation / Business" value={loanPurpose} onChange={e => setLoanPurpose(e.target.value)} required disabled={loading} />
            </div>
            <div className="input-group" style={{ ...styles.flexItem, flex: '0.5' }}>
              <label className="input-label">Term (Months)</label>
              <select className="form-input" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} style={styles.select} disabled={loading}>
                <option value="12">12m</option>
                <option value="24">24m</option>
                <option value="36">36m</option>
                <option value="48">48m</option>
                <option value="60">60m</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div style={styles.actionsRow}>
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={loading}>CANCEL</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'COMMITTING FILE...' : (applicant ? 'MODIFY BORROWER' : 'REGISTER BORROWER')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- Overlay Dialog Layout Styles --- */
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '720px',
    padding: '32px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '16px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  errorBanner: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
  },
  flexItem: {
    flex: 1,
  },
  select: {
    cursor: 'pointer',
    backgroundColor: '#0E1322',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '28px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '20px',
  },
};

export default ApplicantModal;
