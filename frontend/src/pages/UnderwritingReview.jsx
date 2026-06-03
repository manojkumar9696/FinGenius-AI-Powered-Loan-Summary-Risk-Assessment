import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

/**
 * AI Underwriting Review & Credit Cockpit Detail Page
 * Renders the primary decision metrics, compliance audits, and generative AI narrations.
 */
const UnderwritingReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Core Data States
  const [applicant, setApplicant] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [fraudCheck, setFraudCheck] = useState(null);

  // Notes States
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // UI Flow States
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  
  // Interactive Sign-off States
  const [verifyFraudChecked, setVerifyFraudChecked] = useState(false);
  const [verifyAiReviewed, setVerifyAiReviewed] = useState(false);
  const [isSignedOff, setIsSignedOff] = useState(false);
  const [signatureTimestamp, setSignatureTimestamp] = useState('');

  // 1. Fetch Borrower profile and computed Underwriting files concurrently
  const loadReviewData = async () => {
    setLoading(true);
    setError('');
    try {
      const applicantPayload = await api.getApplicantById(id);
      setApplicant(applicantPayload.data.applicant);

      try {
        const assessmentPayload = await api.getAssessment(id);
        setAssessment(assessmentPayload.data.assessment);
        setFraudCheck(assessmentPayload.data.fraudCheck);
      } catch (assessErr) {
        // Safe Catch: If the applicant has not been assessed yet, set fields to null.
        setAssessment(null);
        setFraudCheck(null);
      }
      
      // Load comments timeline
      await loadNotes();
    } catch (err) {
      setError(err.message || 'Failed to retrieve loan application files.');
      addToast(err.message || 'Error loading file.', 'danger');
      if (err.message && err.message.toLowerCase().includes('permission')) {
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const res = await api.getNotes(id);
      setNotes(res.data.notes);
    } catch (err) {
      console.error('Failed to load compliance notes:', err);
    }
  };

  useEffect(() => {
    loadReviewData();
  }, [id]);

  // 2. Trigger programmatic & generative AI risk assessments
  const handleRunAssessment = async () => {
    setError('');
    setAssessing(true);
    try {
      await api.assessApplicant(id);
      addToast('Assessment completed. Underwriting risk scores & AI narratives updated.', 'success');
      await loadReviewData(); // Refreshes and populates the details
    } catch (err) {
      setError(err.message || 'Risk engine execution error.');
      addToast(err.message || 'Assessment execution error.', 'danger');
    } finally {
      setAssessing(false);
    }
  };

  // 3. Download official PDF report binary stream
  const handleDownloadPDF = async () => {
    if (!applicant) return;
    setError('');
    setDownloading(true);
    try {
      await api.downloadReport(applicant.id, applicant.first_name, applicant.last_name);
      addToast('PDF Underwriting Report downloaded.', 'success');
    } catch (err) {
      setError(err.message || 'PDF report download failed.');
      addToast(err.message || 'Failed to download report.', 'danger');
    } finally {
      setDownloading(false);
    }
  };

  // 4. Perform Lead Auditor interactive sign-off
  const handleSignOff = () => {
    if (!verifyFraudChecked || !verifyAiReviewed) {
      setError('Compliance Safeguard: All pre-signature checklists must be verified first.');
      addToast('Checklist verification is required.', 'warning');
      return;
    }
    setError('');
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Lead Auditor' };
    const dateStr = new Date().toLocaleString();
    setIsSignedOff(true);
    setSignatureTimestamp(`${user.username.toUpperCase()} | SHA256-SECURED | ${dateStr}`);
    addToast('Audit Sign-off committed to immutable system log.', 'success');
  };

  // 5. Submit new comment note to timeline
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setNotesLoading(true);
    try {
      await api.addNote(id, newNoteText.trim());
      setNewNoteText('');
      addToast('Compliance comment successfully logged.', 'success');
      await loadNotes();
    } catch (err) {
      addToast(err.message || 'Failed to submit comment.', 'danger');
    } finally {
      setNotesLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
        <span style={styles.loaderText}>RETRIEVING COMPLIANCE FILE #{id}...</span>
      </div>
    );
  }

  // If borrower was not found or has unauthorized boundaries
  if (!applicant) {
    return (
      <div style={styles.page}>
        <Header />
        <main style={styles.main}>
          <div className="glass-panel" style={styles.errorContainer}>
            <h2 style={{ color: '#EF4444', marginBottom: '15px' }}>⚠️ ACCESS RESTRICTED OR PROFILE MISSING</h2>
            <p style={{ color: '#9CA3AF', marginBottom: '20px' }}>
              {error || 'This loan application file either does not exist or you do not have permission to view it under GLBA portfolio isolation boundaries.'}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              📊 BACK TO COMPLIANCE COCKPIT
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Format monetary parameters
  const monthlyIncome = parseFloat(applicant.monthly_income);
  const monthlyDebt = parseFloat(applicant.monthly_debt);
  const requestedLoan = parseFloat(applicant.loan_amount);
  const calculatedDti = Math.round((monthlyDebt / monthlyIncome) * 100);

  // SVG Gauge calculations
  // CIBIL Score gauge (scale 300 to 900)
  const scorePercent = Math.min(Math.max((applicant.credit_score - 300) / 600 * 100, 0), 100);
  const scoreRadius = 38;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreStrokeDashoffset = scoreCircumference - (scorePercent / 100) * scoreCircumference;
  const ficoColor = applicant.credit_score >= 750 ? '#10B981' : applicant.credit_score >= 600 ? '#F59E0B' : '#EF4444';

  // Fraud Score gauge (scale 0 to 100)
  const fraudScoreVal = fraudCheck ? fraudCheck.fraud_score : 0;
  const fraudPercent = Math.min(Math.max(fraudScoreVal, 0), 100);
  const fraudRadius = 38;
  const fraudCircumference = 2 * Math.PI * fraudRadius;
  const fraudStrokeDashoffset = fraudCircumference - (fraudPercent / 100) * fraudCircumference;
  const fraudColor = fraudScoreVal >= 50 ? '#EF4444' : fraudScoreVal >= 25 ? '#F59E0B' : '#10B981';

  return (
    <div style={styles.page}>
      <Header />

      <main style={styles.main} className="animate-fade-in">
        
        {/* --- Top Breadcrumb & Quick Action Controls --- */}
        <section style={styles.breadcrumbRow}>
          <div style={styles.breadcrumbInfo}>
            <Link to="/dashboard" style={styles.backLink}>📊 Dashboard</Link>
            <span style={{ color: '#6B7280' }}>/</span>
            <span style={{ color: '#F3F4F6', fontWeight: '500' }}>
              Underwriting Review ({applicant.first_name} {applicant.last_name})
            </span>
          </div>

          <div style={styles.topActions}>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              👈 RETURN TO COCKPIT
            </button>
            
            {assessment && (
              <button 
                className="btn btn-primary" 
                onClick={handleDownloadPDF} 
                disabled={downloading}
                style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' }}
              >
                {downloading ? 'STREAMING PDF...' : '📄 DOWNLOAD COMPLIANCE REPORT'}
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="badge badge-danger" style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* --- Borrower Profile Metrics Dashboard --- */}
        <section className="glass-panel" style={styles.metricsRibbon}>
          <div style={styles.ribbonItem}>
            <span style={styles.ribbonLabel}>Borrower Name</span>
            <span style={styles.ribbonValue}>{applicant.first_name} {applicant.last_name}</span>
            <span style={styles.ribbonMeta}>{applicant.email} | Phone: {applicant.phone || 'N/A'}</span>
          </div>
          
          <div style={styles.ribbonItem}>
            <span style={styles.ribbonLabel}>PAN Card / Aadhaar</span>
            <span style={styles.ribbonValue}>
              {applicant.ssn.length === 10 ? `PAN: ${applicant.ssn.slice(0, 3)}****${applicant.ssn.slice(-3)}` : `AADHAAR: **** **** ${applicant.ssn.slice(-4)}`}
            </span>
            <span style={styles.ribbonMeta}>DOB: {new Date(applicant.date_of_birth).toLocaleDateString()}</span>
          </div>

          <div style={styles.ribbonItem}>
            <span style={styles.ribbonLabel}>Requested Amount</span>
            <span style={{ ...styles.ribbonValue, color: '#3B82F6' }}>
              ₹{requestedLoan.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span style={styles.ribbonMeta}>{applicant.loan_purpose.toUpperCase()} | {applicant.loan_term_months} Months</span>
          </div>

          <div style={styles.ribbonItem}>
            <span style={styles.ribbonLabel}>Debt Footprint (DTI)</span>
            <span style={{ ...styles.ribbonValue, color: calculatedDti >= 50 ? '#EF4444' : '#10B981' }}>
              {calculatedDti}% DTI
            </span>
            <span style={styles.ribbonMeta}>Gross Income: ₹{monthlyIncome.toLocaleString('en-IN')}/mo</span>
          </div>

          <div style={styles.ribbonItem}>
            <span style={styles.ribbonLabel}>Employment Status</span>
            <span style={styles.ribbonValue}>{applicant.employment_status.toUpperCase()}</span>
            <span style={styles.ribbonMeta}>Status: {applicant.status.toUpperCase()}</span>
          </div>
        </section>

        {/* --- Core Conditional Layout: Not Assessed vs Fully Assessed --- */}
        {!assessment ? (
          <div className="glass-panel" style={styles.notAssessedCard}>
            <div style={styles.assessPromptLeft}>
              <div style={styles.promptIcon}>🔬</div>
              <div style={styles.promptTextContainer}>
                <h3 style={styles.promptTitle}>Underwriting Assessment Needed</h3>
                <p style={styles.promptSubtitle}>
                  This borrower file has not been evaluated by the FinGenius risk engine. Running the assessment will programmatically calculate debit parameters, verify regulatory fraud checklists, and fetch the Generative AI summary narrations.
                </p>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleRunAssessment} 
              disabled={assessing}
              style={styles.runAssessBtn}
            >
              {assessing ? 'COMPUTING UNDERWRITING RISKS...' : '⚙️ RUN RISKS ASSESSMENT'}
            </button>
          </div>
        ) : (
          <div style={styles.contentGrid}>
            
            {/* --- Left Column: Programmatic Risk & Fraud Diagnostics --- */}
            <div style={styles.columnLeft}>
              
              {/* Gauges panel */}
              <div className="glass-panel" style={styles.card}>
                <h3 style={styles.cardTitle}>Deterministic Credit Meters</h3>
                
                <div style={styles.gaugesRow}>
                  {/* FICO Score Circle */}
                  <div style={styles.gaugeWrapper}>
                    <div style={styles.svgContainer}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={scoreRadius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r={scoreRadius} 
                          fill="transparent" 
                          stroke={ficoColor} 
                          strokeWidth="7" 
                          strokeDasharray={scoreCircumference}
                          strokeDashoffset={scoreStrokeDashoffset}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.8s ease-in-out',
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                          }}
                        />
                      </svg>
                      <div style={styles.gaugeText}>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: ficoColor }}>{applicant.credit_score}</span>
                        <span style={{ fontSize: '8px', color: '#6B7280', fontWeight: '700' }}>CIBIL</span>
                      </div>
                    </div>
                    <span style={styles.gaugeLabel}>Credit Strength</span>
                  </div>

                  {/* Fraud Score Circle */}
                  <div style={styles.gaugeWrapper}>
                    <div style={styles.svgContainer}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={fraudRadius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r={fraudRadius} 
                          fill="transparent" 
                          stroke={fraudColor} 
                          strokeWidth="7" 
                          strokeDasharray={fraudCircumference}
                          strokeDashoffset={fraudStrokeDashoffset}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.8s ease-in-out',
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                          }}
                        />
                      </svg>
                      <div style={styles.gaugeText}>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: fraudColor }}>{fraudScoreVal}</span>
                        <span style={{ fontSize: '8px', color: '#6B7280', fontWeight: '700' }}>FRAUD</span>
                      </div>
                    </div>
                    <span style={styles.gaugeLabel}>Threat Level</span>
                  </div>
                </div>
              </div>

              {/* Programmatic Analysis details */}
              <div className="glass-panel" style={styles.card}>
                <h3 style={styles.cardTitle}>Deterministic Risk Assessment</h3>
                
                <div style={styles.detailsList}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Calculated Risk Score:</span>
                    <span style={{ ...styles.detailValue, fontWeight: '700' }}>{assessment.risk_score} / 100</span>
                  </div>
                  
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Risk Severity Tier:</span>
                    <span className={`badge ${
                      assessment.risk_level === 'low' ? 'badge-success' :
                      assessment.risk_level === 'medium' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {assessment.risk_level.toUpperCase()}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Calculated LTI Ratio:</span>
                    <span style={styles.detailValue}>{parseFloat(assessment.loan_to_income_ratio).toFixed(2)}x leverage</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Institutional Eligibility:</span>
                    <span className={`badge ${assessment.eligibility_status === 'eligible' ? 'badge-success' : 'badge-danger'}`}>
                      {assessment.eligibility_status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ ...styles.detailRow, flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none', paddingBottom: '0' }}>
                    <span style={{ ...styles.detailLabel, marginBottom: '6px' }}>Rule Engine Resolution Statement:</span>
                    <div style={styles.statementText}>
                      {assessment.eligibility_explanation || 'No rule statements processed.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Fraud Checkups */}
              {fraudCheck && (
                <div className="glass-panel" style={styles.card}>
                  <h3 style={styles.cardTitle}>KYC & Anti-Fraud Diagnostics</h3>
                  
                  <div style={styles.fraudDetails}>
                    <div style={styles.fraudStatusBox}>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Security Status:</span>
                      <span className={`badge ${
                        fraudCheck.status === 'pass' ? 'badge-success' :
                        fraudCheck.status === 'review' ? 'badge-warning' : 'badge-danger'
                      }`} style={{ fontSize: '13px' }}>
                        {fraudCheck.status.toUpperCase()}
                      </span>
                    </div>

                    <ul style={styles.fraudChecklist}>
                      <li style={styles.fraudItem}>
                        <span style={styles.fraudCheckDot(fraudCheck.is_duplicate)}></span>
                        <div style={styles.fraudItemTexts}>
                          <span style={styles.fraudItemTitle}>PAN Velocity Check</span>
                          <span style={styles.fraudItemMeta}>
                            {fraudCheck.is_duplicate ? '⚠️ CRITICAL: Identity duplicate detected in database' : '✓ Standard: PAN holds unique footprint in system'}
                          </span>
                        </div>
                      </li>

                      <li style={styles.fraudItem}>
                        <span style={styles.fraudCheckDot(fraudCheck.is_suspicious_income)}></span>
                        <div style={styles.fraudItemTexts}>
                          <span style={styles.fraudItemTitle}>Suspicious Earnings Check</span>
                          <span style={styles.fraudItemMeta}>
                            {fraudCheck.is_suspicious_income ? '⚠️ Flagged: Income-to-CIBIL ratio exceeds compliance averages' : '✓ Standard: Earnings correlate correctly with credit tiers'}
                          </span>
                        </div>
                      </li>

                      <li style={styles.fraudItem}>
                        <span style={styles.fraudCheckDot(fraudCheck.is_missing_info)}></span>
                        <div style={styles.fraudItemTexts}>
                          <span style={styles.fraudItemTitle}>Identity Integrity Check</span>
                          <span style={styles.fraudItemMeta}>
                            {fraudCheck.is_missing_info ? '⚠️ Warning: Profile holds missing or unverified fields' : '✓ Standard: Complete borrower data package provided'}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* --- Right Column: AI Underwriting Synthesis --- */}
            <div style={styles.columnRight}>
              
              <div className="glass-panel" style={{ ...styles.card, background: 'rgba(14, 19, 34, 0.9)', borderColor: 'rgba(6, 182, 212, 0.15)' }}>
                <div style={styles.aiHeader}>
                  <div style={styles.aiIcon}>🪄</div>
                  <div>
                    <h3 style={styles.aiTitle}>Gemini AI Underwriting Synthesis</h3>
                    <span style={styles.aiMeta}>COGNITIVE NARRATIVE SUMMARY • SECURE LARGE LANGUAGE DEPLOYMENT</span>
                  </div>
                </div>

                <div style={styles.aiSections}>
                  {/* Synthesis Summary */}
                  <div style={styles.aiSubCard}>
                    <h4 style={styles.aiSectionTitle}>1. Borrower Profile & Capacity Synthesis</h4>
                    <p style={styles.aiSectionContent}>
                      {assessment.ai_summary || 'No AI profile summary generated.'}
                    </p>
                  </div>

                  {/* Capacity Explanations */}
                  <div style={styles.aiSubCard}>
                    <h4 style={styles.aiSectionTitle}>2. Mitigating Credit Factors & Capacity Strengths</h4>
                    <p style={styles.aiSectionContent}>
                      {assessment.ai_eligibility_explanation || 'No AI eligibility explanations generated.'}
                    </p>
                  </div>

                  {/* Credit Risk Vectors */}
                  <div style={styles.aiSubCard}>
                    <h4 style={styles.aiSectionTitle}>3. Leveraging Limits & Credit Risk Vectors</h4>
                    <p style={styles.aiSectionContent}>
                      {assessment.ai_risk_analysis || 'No AI risk factor breakdowns generated.'}
                    </p>
                  </div>

                  {/* Underwriter Guidance */}
                  <div style={styles.aiSubCard}>
                    <h4 style={styles.aiSectionTitle}>4. Manual Underwriter Audit Directives</h4>
                    <div style={{ ...styles.aiSectionContent, color: '#06B6D4', borderLeft: '2px solid #06B6D4', paddingLeft: '12px' }}>
                      {assessment.ai_recommendation || 'No manual underwriting recommendation directives generated.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Auditor Sign-Off & Signature Stamping Panel */}
              <div className="glass-panel" style={styles.signatureCard}>
                <h3 style={styles.cardTitle}>Auditing Committee Sign-Off</h3>
                
                {isSignedOff && (
                  <div style={styles.stampOverlay} className="animate-fade-in">
                    <div style={styles.metallicSeal}>
                      <div style={styles.sealCircle}>
                        <div style={styles.sealStars}>★★★★★</div>
                        <span style={styles.sealTextLarge}>AURA SECURED</span>
                        <span style={styles.sealTextSmall}>COMPLIANCE CERTIFIED</span>
                        <div style={styles.sealCode}>{signatureTimestamp.split(' | ')[0] || 'AUDITOR APPROVED'}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ ...styles.detailsList, opacity: isSignedOff ? 0.3 : 1 }}>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '15px' }}>
                    Signing off confirms that all institutional guidelines have been reviewed, and fraud checks have been verified. Signing triggers an immutable cryptographic session stamp logged to the MySQL audit table.
                  </p>

                  <label style={styles.checkRow}>
                    <input 
                      type="checkbox" 
                      style={styles.checkbox} 
                      checked={verifyFraudChecked} 
                      disabled={isSignedOff}
                      onChange={e => setVerifyFraudChecked(e.target.checked)} 
                    />
                    <span style={styles.checkText}>I verify that all compliance & duplicate identity checks have been resolved.</span>
                  </label>

                  <label style={styles.checkRow}>
                    <input 
                      type="checkbox" 
                      style={styles.checkbox} 
                      checked={verifyAiReviewed} 
                      disabled={isSignedOff}
                      onChange={e => setVerifyAiReviewed(e.target.checked)} 
                    />
                    <span style={styles.checkText}>I verify that the Gemini AI synthesis has been audited for risk vectors.</span>
                  </label>

                  {!isSignedOff ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSignOff} 
                      disabled={!verifyFraudChecked || !verifyAiReviewed}
                      style={{ width: '100%', marginTop: '15px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#030712' }}
                    >
                      🖋️ SIGN-OFF COMPLIANCE REGISTRY
                    </button>
                  ) : (
                    <div style={styles.signatureLockedBox}>
                      <div style={styles.signatureBadge}>✓ AUDITED & RECORDED</div>
                      <div style={styles.signatureLogText}>{signatureTimestamp}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes & Comments Timeline Card (Feature 3) */}
            <div className="glass-panel" style={{ ...styles.card, gridColumn: 'span 2', marginTop: '24px' }}>
              <h3 style={styles.cardTitle}>📝 Underwriting Notes & Compliance Comments</h3>
              <span style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.05em', fontWeight: '700', marginTop: '-15px', marginBottom: '10px', display: 'block' }}>
                IMMUTABLE AUDIT TRAIL OF COMPLIANCE REMARKS - ACCESSIBLE TO ALL AUDITING LOAN OFFICERS
              </span>

              {/* Note input box */}
              <form onSubmit={handleAddNote} style={styles.noteForm}>
                <textarea
                  className="form-input"
                  style={styles.noteTextarea}
                  placeholder="Type a compliance note or audit comment (e.g. verified income from ITR, checked Aadhaar details, etc.)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  required
                  disabled={notesLoading}
                />
                <button type="submit" className="btn btn-primary" style={styles.addNoteBtn} disabled={notesLoading || !newNoteText.trim()}>
                  {notesLoading ? 'ADDING...' : '💾 ADD COMPLIANCE NOTE'}
                </button>
              </form>

              {/* Notes timeline list */}
              <div style={styles.notesTimeline}>
                {notes.length === 0 ? (
                  <p style={styles.emptyNotesText}>No compliance notes or timeline records compiled for this applicant yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} style={styles.noteCard} className="glass-panel">
                      <div style={styles.noteHeader}>
                        <span style={styles.noteAuthor}>👤 {note.username} ({note.role.toUpperCase().replace('_', ' ')})</span>
                        <span style={styles.noteTime}>{new Date(note.created_at).toLocaleString('en-IN')}</span>
                      </div>
                      <p style={styles.noteText}>{note.note_text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

/* --- Underwriting Page Visual Styles --- */
const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#060913',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#060913',
    color: '#9CA3AF',
    gap: '15px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(6, 182, 212, 0.1)',
    borderTop: '3px solid #06B6D4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loaderText: {
    fontSize: '14px',
    letterSpacing: '0.05em',
    fontWeight: '600',
  },
  main: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
  breadcrumbRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  breadcrumbInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  backLink: {
    color: '#06B6D4',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  topActions: {
    display: 'flex',
    gap: '12px',
  },
  errorBanner: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '14px',
  },
  errorContainer: {
    padding: '40px',
    textAlign: 'center',
    margin: '40px auto',
    maxWidth: '600px',
  },
  metricsRibbon: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    padding: '24px',
    textAlign: 'left',
  },
  ribbonItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  ribbonLabel: {
    fontSize: '11px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '700',
  },
  ribbonValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F3F4F6',
  },
  ribbonMeta: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  notAssessedCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '40px',
    textAlign: 'left',
    flexWrap: 'wrap',
    gap: '20px',
    background: 'rgba(14, 19, 34, 0.85)',
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  assessPromptLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flex: '1',
    minWidth: '300px',
  },
  promptIcon: {
    fontSize: '48px',
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '12px',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  promptTitle: {
    fontSize: '22px',
    fontWeight: '700',
  },
  promptSubtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
    lineHeight: '1.6',
    maxWidth: '700px',
  },
  runAssessBtn: {
    fontSize: '14px',
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#030712',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '24px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  columnLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  columnRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    padding: '24px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '10px',
    color: '#F3F4F6',
  },
  gaugesRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '10px 0',
  },
  gaugeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  svgContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeText: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1.2',
  },
  gaugeLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '10px',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: '14px',
    color: '#F3F4F6',
  },
  statementText: {
    fontSize: '13px',
    color: '#D1D5DB',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    lineHeight: '1.5',
    width: '100%',
  },
  fraudDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fraudStatusBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
  },
  fraudChecklist: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fraudItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  fraudCheckDot: (isFlagged) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isFlagged ? '#EF4444' : '#10B981',
    boxShadow: isFlagged ? '0 0 8px #EF4444' : '0 0 8px #10B981',
    marginTop: '6px',
    flexShrink: 0,
  }),
  fraudItemTexts: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    gap: '2px',
  },
  fraudItemTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  fraudItemMeta: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '16px',
    marginBottom: '8px',
  },
  aiIcon: {
    fontSize: '32px',
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
    width: '56px',
    height: '56px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(6, 182, 212, 0.25)',
  },
  aiTitle: {
    fontSize: '18px',
    fontWeight: '700',
  },
  aiMeta: {
    fontSize: '8px',
    color: '#6B7280',
    letterSpacing: '0.08em',
    fontWeight: '700',
  },
  aiSections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  aiSubCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    padding: '16px',
  },
  aiSectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#06B6D4',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  aiSectionContent: {
    fontSize: '13px',
    color: '#D1D5DB',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  signatureCard: {
    padding: '24px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    overflow: 'hidden',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  checkRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  checkbox: {
    marginTop: '4px',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#10B981',
  },
  checkText: {
    fontSize: '13px',
    color: '#D1D5DB',
    lineHeight: '1.4',
  },
  signatureLockedBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '16px',
    border: '1px dashed rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    marginTop: '10px',
  },
  signatureBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#10B981',
  },
  signatureLogText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#9CA3AF',
  },
  stampOverlay: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    transform: 'rotate(-12deg)',
    zIndex: '10',
    pointerEvents: 'none',
  },
  metallicSeal: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '3px double #EF4444',
    background: 'rgba(239, 68, 68, 0.05)',
    boxShadow: '0 0 15px rgba(239, 68, 68, 0.2), inset 0 0 10px rgba(239, 68, 68, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealCircle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '2px',
    color: '#EF4444',
  },
  sealStars: {
    fontSize: '10px',
    letterSpacing: '2px',
    fontWeight: '700',
  },
  sealTextLarge: {
    fontSize: '11px',
    fontWeight: '900',
    letterSpacing: '0.05em',
  },
  sealTextSmall: {
    fontSize: '6px',
    fontWeight: '700',
    letterSpacing: '0.03em',
  },
  sealCode: {
    fontSize: '7px',
    fontWeight: '700',
    fontFamily: 'monospace',
    borderTop: '1px dashed #EF4444',
    paddingTop: '2px',
    marginTop: '2px',
    maxWidth: '90px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  noteForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  noteTextarea: {
    minHeight: '80px',
    backgroundColor: '#0E1322',
    resize: 'vertical',
  },
  addNoteBtn: {
    alignSelf: 'flex-end',
    fontSize: '12px',
    padding: '8px 16px',
  },
  notesTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  noteCard: {
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    textAlign: 'left',
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '11px',
  },
  noteAuthor: {
    fontWeight: '700',
    color: '#06B6D4',
  },
  noteTime: {
    color: '#6B7280',
  },
  noteText: {
    fontSize: '13px',
    color: '#D1D5DB',
    lineHeight: '1.5',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  emptyNotesText: {
    fontSize: '13px',
    color: '#6B7280',
    textAlign: 'center',
    padding: '20px',
    margin: 0,
  },
};

export default UnderwritingReview;
