import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../services/api';
import { CSSStatusBreakdown, CSSRadialRing } from '../components/CSSChart';
import ApplicantModal from '../components/ApplicantModal';
import { useToast } from '../context/ToastContext';
import EMICalculator from '../components/EMICalculator';
import PortfolioHealthGauge from '../components/PortfolioHealthGauge';

/**
 * Core Underwriting Cockpit Dashboard
 * Displays aggregates concurrently and manages the borrower profiles database.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // 1. Fetch dashboard metrics and applicant profiles in a concurrent loading pipeline
  const loadDashboardData = async () => {
    setError('');
    try {
      const [statsPayload, applicantsPayload] = await Promise.all([
        api.getStats(),
        api.getApplicants()
      ]);

      setStats(statsPayload.data.metrics);
      setApplicants(applicantsPayload.data.applicants);
    } catch (err) {
      setError(err.message || 'Failed to load cockpit metrics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 2. Perform search and dropdown filtering reactively
  useEffect(() => {
    let result = applicants;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.first_name.toLowerCase().includes(term) ||
          a.last_name.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    setFilteredApplicants(result);
  }, [applicants, searchTerm, statusFilter]);

  // 3. Trigger Programmatic & AI Underwriting calculate run
  const handleAssess = async (id) => {
    setError('');
    setActionLoading((prev) => ({ ...prev, [id]: 'assess' }));
    try {
      await api.assessApplicant(id);
      addToast('Risk and AI Assessment completed successfully.', 'success');
      await loadDashboardData(); // Refreshes stats and table badges
    } catch (err) {
      setError(err.message || 'Underwriting calculation error.');
      addToast(err.message || 'Assessment execution error.', 'danger');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 4. Download Underwriting report binary stream
  const handleDownloadReport = async (id, firstName, lastName) => {
    setError('');
    setActionLoading((prev) => ({ ...prev, [id]: 'download' }));
    try {
      await api.downloadReport(id, firstName, lastName);
      addToast('PDF Underwriting Report downloaded successfully.', 'success');
    } catch (err) {
      setError(err.message || 'PDF streaming download error.');
      addToast(err.message || 'Failed to download PDF report.', 'danger');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 5. Delete applicant profile (Admin Restricted clearance)
  const handleDeleteApplicant = async (id) => {
    if (!window.confirm('Compliance Warning: This will permanently drop the borrower profile and all risk/fraud files. Proceed?')) {
      return;
    }

    setError('');
    setActionLoading((prev) => ({ ...prev, [id]: 'delete' }));
    try {
      await api.deleteApplicant(id);
      addToast('Applicant record successfully purged.', 'success');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to delete record file.');
      addToast(err.message || 'Failed to delete record.', 'danger');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 6. CSV Portfolio Export Trigger
  const handleExportCSV = async () => {
    try {
      addToast('Generating portfolio CSV export...', 'info');
      await api.exportCSV();
      addToast('CSV Portfolio Export downloaded successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to export CSV.', 'danger');
    }
  };

  const openCreateModal = () => {
    setSelectedApplicant(null);
    setIsModalOpen(true);
  };

  const openEditModal = (applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const activeUser = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = activeUser.role === 'admin';

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
        <span style={styles.loaderText}>LOADING COCKPIT METRICS...</span>
      </div>
    );
  }

  // Calculate dynamic ratios for circular progress ring
  const totalApps = stats?.totalApplications || 0;
  const completedApps = stats?.completedApplications || 0;
  const completionRate = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0;
  const approvalRate = stats?.approvalRatePercent ? Math.round(stats.approvalRatePercent) : 0;

  return (
    <div style={styles.page}>
      <Header />

      <main style={styles.main} className="animate-fade-in">
        {error && (
          <div className="badge badge-danger" style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* --- Analytical KPIs Ribbon --- */}
        <section style={styles.kpiContainer}>
          {/* Custom Animated Health Gauge */}
          <div style={{ gridColumn: 'span 1' }}>
            <PortfolioHealthGauge stats={stats} />
          </div>

          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Total Applications</span>
            <span style={styles.kpiValue}>{stats?.totalApplications || 0}</span>
            <span style={styles.kpiMeta}>Active underwriter files</span>
          </div>

          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Completed Audits</span>
            <span style={styles.kpiValue}>{stats?.completedApplications || 0}</span>
            <span style={styles.kpiMeta}>Risk assessments compiled</span>
          </div>

          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Institutional Approval</span>
            <span style={{ ...styles.kpiValue, color: '#10B981' }}>{approvalRate}%</span>
            <span style={styles.kpiMeta}>Underwriting pass ratio</span>
          </div>

          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Fraud Alert Flags</span>
            <span style={{ 
              ...styles.kpiValue, 
              color: (stats?.fraudDistribution?.flagged || 0) > 0 ? '#EF4444' : '#10B981' 
            }}>
              {stats?.fraudDistribution?.flagged || 0}
            </span>
            <span style={styles.kpiMeta}>Critical KYC alerts triggers</span>
          </div>
        </section>

        {/* --- CSS Charts & Calculator Section --- */}
        <section style={{ ...styles.chartsContainer, gridTemplateColumns: '1.2fr 1.1fr 1fr' }}>
          <div className="glass-panel" style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Credit Status Breakdown</h3>
            <CSSStatusBreakdown 
              pending={stats?.statusDistribution?.pending || 0}
              approved={stats?.statusDistribution?.approved || 0}
              rejected={stats?.statusDistribution?.rejected || 0}
            />
          </div>

          {/* Interactive EMI Calculator Widget */}
          <EMICalculator />

          <div className="glass-panel" style={styles.chartRingCard}>
            <h3 style={styles.chartTitle}>Portfolio Ratios</h3>
            <div style={styles.ringsRow}>
              <CSSRadialRing label="Audits Done" percentage={completionRate} color="#06B6D4" />
              <CSSRadialRing label="Approval Yield" percentage={approvalRate} color="#10B981" />
            </div>
          </div>
        </section>

        {/* --- Cockpit Applicants Data Grid Section --- */}
        <section className="glass-panel" style={styles.cockpitPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Active Credit Underwriting Records</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={handleExportCSV}>
                📤 EXPORT CSV PORTFOLIO
              </button>
              <button className="btn btn-primary animate-pulse" onClick={openCreateModal}>
                ➕ REGISTER BORROWER FILE
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={styles.filtersBar}>
            <input
              className="form-input"
              style={styles.searchInput}
              placeholder="🔍 Search by borrower name or email address..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              className="form-input"
              style={styles.filterSelect}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">Display All Statuses</option>
              <option value="pending">Underwriter Pending</option>
              <option value="approved">Approved Profile</option>
              <option value="rejected">Rejected Profile</option>
            </select>
          </div>

          {/* Grid Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Borrower Profile</th>
                  <th style={styles.th}>Requested Amount</th>
                  <th style={styles.th}>Leverage Ratios</th>
                  <th style={styles.th}>CIBIL Score</th>
                  <th style={styles.th}>Decision Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Cockpit Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyCell}>
                      No active underwriting files found matching current searches.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((app) => {
                    const isAssessing = actionLoading[app.id] === 'assess';
                    const isDownloading = actionLoading[app.id] === 'download';
                    const isDeleting = actionLoading[app.id] === 'delete';
                    
                    const statusBadgeClass = 
                      app.status === 'approved' ? 'badge-success' :
                      app.status === 'rejected' ? 'badge-danger' :
                      'badge-warning';

                    // Compute generic debt leverage metrics on frontend
                    const dti = Math.round((app.monthly_debt / app.monthly_income) * 100);

                    return (
                      <tr key={app.id} style={styles.tr}>
                        {/* Name & Contact */}
                        <td style={styles.td}>
                          <div style={styles.borrowerName}>
                            <Link to={`/applicants/${app.id}`} className="borrower-link">
                              {app.first_name} {app.last_name}
                            </Link>
                          </div>
                          <div style={styles.borrowerMeta}>
                            {app.email} | ID: {app.ssn.length === 10 ? `PAN: ${app.ssn.slice(0, 3)}****${app.ssn.slice(-3)}` : `AADHAAR: **** **** ${app.ssn.slice(-4)}`}
                          </div>
                        </td>
                        {/* Requested Loan */}
                        <td style={styles.td}>
                          <div style={styles.loanAmount}>
                            ₹{parseFloat(app.loan_amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                          </div>
                          <div style={styles.borrowerMeta}>{app.loan_purpose} | {app.loan_term_months}m</div>
                        </td>
                        {/* Leverage */}
                        <td style={styles.td}>
                          <div style={styles.leverageText}>DTI Footprint: {dti}%</div>
                          <div style={styles.borrowerMeta}>Gross: ₹{parseFloat(app.monthly_income).toLocaleString('en-IN')}/mo</div>
                        </td>
                        {/* CIBIL Credit Score */}
                        <td style={styles.td}>
                          <span style={{ 
                            ...styles.creditScore,
                            color: app.credit_score >= 750 ? '#10B981' : app.credit_score >= 600 ? '#F59E0B' : '#EF4444'
                          }}>
                            {app.credit_score} CIBIL
                          </span>
                        </td>
                        {/* Badge status */}
                        <td style={styles.td}>
                          <span className={`badge ${statusBadgeClass}`}>
                            {app.status}
                          </span>
                        </td>
                        {/* Action buttons */}
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={styles.actionsRow}>
                            {/* Go to Underwriting Review Details Page */}
                            <button
                              className="btn btn-secondary"
                              style={{ ...styles.actionBtn, borderColor: 'rgba(6, 182, 212, 0.3)', color: '#06B6D4' }}
                              onClick={() => navigate(`/applicants/${app.id}`)}
                              disabled={isAssessing || isDownloading || isDeleting}
                            >
                              🔬 REVIEW
                            </button>

                            {/* Run risk calculations assessments */}
                            <button
                              className="btn btn-primary"
                              style={styles.actionBtn}
                              onClick={() => handleAssess(app.id)}
                              disabled={isAssessing || isDownloading || isDeleting}
                            >
                              {isAssessing ? 'ASSESSING...' : '⚙️ RUN RISKS'}
                            </button>

                            {/* Download report PDF */}
                            <button
                              className="btn btn-secondary"
                              style={styles.actionBtn}
                              onClick={() => handleDownloadReport(app.id, app.first_name, app.last_name)}
                              disabled={isAssessing || isDownloading || isDeleting || app.status === 'pending'}
                            >
                              {isDownloading ? 'STREAMING...' : '📄 PDF'}
                            </button>

                            {/* Edit File details */}
                            <button
                              className="btn btn-secondary"
                              style={styles.actionBtn}
                              onClick={() => openEditModal(app)}
                              disabled={isAssessing || isDownloading || isDeleting || app.status !== 'pending'}
                            >
                              ✏️ EDIT
                            </button>

                            {/* Admin-only delete borrower record */}
                            {isAdmin && (
                              <button
                                className="btn btn-secondary"
                                style={{ ...styles.actionBtn, borderColor: 'rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
                                onClick={() => handleDeleteApplicant(app.id)}
                                disabled={isAssessing || isDownloading || isDeleting}
                              >
                                {isDeleting ? 'PURGING...' : '🗑️ PURGE'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Frosted Applicant create/edit overlay modal dialog */}
      <ApplicantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
        applicant={selectedApplicant}
      />
    </div>
  );
};

/* --- Underwriting Cockpit Layout Styles --- */
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
  },
  main: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  errorBanner: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '14px',
  },
  kpiContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  kpiCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    gap: '8px',
  },
  kpiLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#F3F4F6',
    lineHeight: '1',
  },
  kpiMeta: {
    fontSize: '11px',
    color: '#6B7280',
  },
  chartsContainer: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '20px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartCard: {
    padding: '24px',
    textAlign: 'left',
  },
  chartRingCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '10px',
    width: '100%',
    textAlign: 'left',
  },
  ringsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: '10px',
  },
  cockpitPanel: {
    padding: '32px',
    textAlign: 'left',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: '600',
  },
  filtersBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  searchInput: {
    flex: '2',
    backgroundColor: '#0E1322',
  },
  filterSelect: {
    flex: '0.8',
    backgroundColor: '#0E1322',
    cursor: 'pointer',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '2px solid rgba(255,255,255,0.06)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle',
  },
  borrowerName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  borrowerMeta: {
    fontSize: '11px',
    color: '#6B7280',
    marginTop: '2px',
  },
  loanAmount: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F3F4F6',
  },
  leverageText: {
    fontSize: '14px',
    color: '#F3F4F6',
    fontWeight: '500',
  },
  creditScore: {
    fontSize: '14px',
    fontWeight: '700',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  actionBtn: {
    fontSize: '11px',
    padding: '6px 12px',
    fontWeight: '600',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '40px',
    color: '#6B7280',
    fontSize: '14px',
  },
};

export default Dashboard;
