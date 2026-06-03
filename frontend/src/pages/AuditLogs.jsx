import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { api } from '../services/api';

/**
 * SOC2 Compliance Audit Log Inspector Page
 * Restricted strictly to Admins. Displays paginated audit ledgers with detailed JSON inspectors.
 */
const AuditLogs = () => {
  const navigate = useNavigate();

  // Core Data States
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 20
  });

  // Query Filter States
  const [actionFilter, setActionFilter] = useState('');
  const [targetIdSearch, setTargetIdSearch] = useState('');
  const [limitFilter, setLimitFilter] = useState('20');
  const [currentPage, setCurrentPage] = useState(1);

  // UI Flow States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  // 1. Fetch compliance audit files from backend with dynamic parameters
  const loadAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.getAuditLogs({
        action: actionFilter || undefined,
        targetId: targetIdSearch.trim() || undefined,
        limit: limitFilter,
        page: currentPage
      });

      setLogs(payload.data.logs);
      setPagination(payload.pagination);
    } catch (err) {
      setError(err.message || 'Failed to retrieve compliance audit logs.');
      // Block and redirect non-admins instantly under RBAC safety regulations
      if (err.message && err.message.toLowerCase().includes('denied')) {
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on parameter modifications
  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, limitFilter, currentPage]);

  // Handle Search button submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAuditLogs();
  };

  // Helper to toggle expanded metadata drawer
  const toggleRow = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Helper to color action badges by threat/severity
  const getActionBadgeClass = (action) => {
    if (action.includes('FAILURE') || action.includes('BLOCKED') || action.includes('DELETE')) {
      return 'badge-danger';
    }
    if (action.includes('ASSESS') || action.includes('UPDATE')) {
      return 'badge-warning';
    }
    return 'badge-success';
  };

  // Helper to parse stringified details JSON safely
  const renderParsedDetails = (detailsStr) => {
    try {
      const parsed = typeof detailsStr === 'string' ? JSON.parse(detailsStr) : detailsStr;
      return <pre style={styles.jsonBlock}>{JSON.stringify(parsed, null, 2)}</pre>;
    } catch (e) {
      return <pre style={styles.jsonBlock}>{detailsStr}</pre>;
    }
  };

  return (
    <div style={styles.page}>
      <Header />

      <main style={styles.main} className="animate-fade-in">
        
        {/* --- Breadcrumb Navigation Banner --- */}
        <section style={styles.breadcrumbRow}>
          <div style={styles.breadcrumbInfo}>
            <Link to="/dashboard" style={styles.backLink}>📊 Dashboard</Link>
            <span style={{ color: '#6B7280' }}>/</span>
            <span style={{ color: '#F3F4F6', fontWeight: '500' }}>🔒 Compliance Audit Inspector</span>
          </div>

          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            📊 RETURN TO COCKPIT
          </button>
        </section>

        {error && (
          <div className="badge badge-danger" style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* --- Visual Analytical Highlights --- */}
        <section style={styles.kpiContainer}>
          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Audit Trail Footprint</span>
            <span style={styles.kpiValue}>{pagination.totalRecords}</span>
            <span style={styles.kpiMeta}>Total recorded operations logs</span>
          </div>

          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Inspect Clearances</span>
            <span style={{ ...styles.kpiValue, color: '#10B981' }}>SOC2 / GLBA</span>
            <span style={styles.kpiMeta}>Active cryptography connection</span>
          </div>

          <div className="glass-panel" style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Database Authority</span>
            <span style={{ ...styles.kpiValue, color: '#3B82F6' }}>READ ONLY</span>
            <span style={styles.kpiMeta}>Compliance auditor isolation active</span>
          </div>
        </section>

        {/* --- Compliance Inspector Database Filter Panel --- */}
        <section className="glass-panel" style={styles.cockpitPanel}>
          <h3 style={styles.panelTitle}>Administrative Inspection Panel</h3>

          <form onSubmit={handleSearchSubmit} style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.inputLabel}>Filter By Action Category</label>
              <select
                className="form-input"
                style={styles.selectInput}
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Display All Action Categories</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                <option value="USER_REGISTERED">USER_REGISTERED</option>
                <option value="CREATE_APPLICANT">CREATE_APPLICANT</option>
                <option value="READ_APPLICANT">READ_APPLICANT</option>
                <option value="READ_APPLICANT_BLOCKED">READ_APPLICANT_BLOCKED</option>
                <option value="UPDATE_APPLICANT">UPDATE_APPLICANT</option>
                <option value="DELETE_APPLICANT">DELETE_APPLICANT</option>
                <option value="ASSESS_APPLICANT">ASSESS_APPLICANT</option>
                <option value="DOWNLOAD_REPORT">DOWNLOAD_REPORT</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.inputLabel}>Target Borrower Profile ID</label>
              <input
                type="number"
                className="form-input"
                placeholder="Search Target ID (e.g. 1)..."
                value={targetIdSearch}
                onChange={(e) => setTargetIdSearch(e.target.value)}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.inputLabel}>Limit Per Page</label>
              <select
                className="form-input"
                style={styles.selectInput}
                value={limitFilter}
                onChange={(e) => {
                  setLimitFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="10">10 entries</option>
                <option value="20">20 entries</option>
                <option value="50">50 entries</option>
                <option value="100">100 entries</option>
              </select>
            </div>

            <div style={{ ...styles.filterGroup, justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px' }}>
                🔍 FILTER
              </button>
            </div>
          </form>

          {/* --- Compliance Logs Database Table Grid --- */}
          {loading ? (
            <div style={styles.tableLoader}>
              <div style={styles.spinner} />
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>QUERYING COMPLIANCE RECORDS...</span>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Inspect Log ID</th>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Operator Account</th>
                    <th style={styles.th}>Action Category</th>
                    <th style={styles.th}>Target Profile ID</th>
                    <th style={styles.th}>Client IP Address</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Security Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.emptyCell}>
                        No compliance audit entries found matching the filter constraints.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const isAuthIssue = log.action === 'LOGIN_FAILURE' || log.action === 'READ_APPLICANT_BLOCKED';
                      
                      return (
                        <React.Fragment key={log.id}>
                          <tr 
                            style={{ 
                              ...styles.tr, 
                              backgroundColor: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                              borderLeft: isAuthIssue ? '3px solid #EF4444' : 'none'
                            }} 
                            onClick={() => toggleRow(log.id)}
                          >
                            {/* Log ID */}
                            <td style={styles.td}>
                              <span style={styles.logId}># {log.id}</span>
                            </td>
                            {/* Date Timestamp */}
                            <td style={styles.td}>
                              <div style={styles.logDate}>
                                {new Date(log.created_at).toLocaleString()}
                              </div>
                            </td>
                            {/* Operator User */}
                            <td style={styles.td}>
                              {log.username ? (
                                <div style={styles.operatorBox}>
                                  <span style={styles.operatorName}>{log.username}</span>
                                  <span style={styles.operatorEmail}>{log.email}</span>
                                </div>
                              ) : (
                                <span style={{ ...styles.operatorName, color: '#6B7280', fontStyle: 'italic' }}>SYSTEM / ANONYMOUS</span>
                              )}
                            </td>
                            {/* Action category badge */}
                            <td style={styles.td}>
                              <span className={`badge ${getActionBadgeClass(log.action)}`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            {/* Target reference ID */}
                            <td style={styles.td}>
                              {log.target_id ? (
                                <span style={styles.targetBadge}>Profile #{log.target_id}</span>
                              ) : (
                                <span style={{ color: '#6B7280' }}>N/A</span>
                              )}
                            </td>
                            {/* Client IP Address */}
                            <td style={styles.td}>
                              <span style={styles.ipText}>{log.ip_address || '127.0.0.1'}</span>
                            </td>
                            {/* Disclosure button */}
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={styles.detailsBtn(isExpanded)}
                              >
                                {isExpanded ? '▲ CLOSE' : '▼ INSPECT'}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable JSON Row Drawer */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="7" style={styles.expandedCell}>
                                <div style={styles.expandedContent} className="animate-fade-in">
                                  <h4 style={styles.drawerTitle}>SECURE COMPLIANCE LEDGER BLOB</h4>
                                  {renderParsedDetails(log.details)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* --- Standard Dynamic Pagination Controls --- */}
          {!loading && pagination.totalPages > 1 && (
            <div style={styles.paginationRow}>
              <span style={styles.paginationText}>
                Showing Page <strong style={{ color: '#F3F4F6' }}>{pagination.currentPage}</strong> of <strong style={{ color: '#F3F4F6' }}>{pagination.totalPages}</strong> ({pagination.totalRecords} logs)
              </span>

              <div style={styles.pageButtons}>
                <button
                  className="btn btn-secondary"
                  style={styles.pageBtn}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ◀ PREVIOUS
                </button>
                
                <button
                  className="btn btn-secondary"
                  style={styles.pageBtn}
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  NEXT ▶
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

/* --- Audit Log Styles Object --- */
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
    marginBottom: '10px',
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
  cockpitPanel: {
    padding: '32px',
    textAlign: 'left',
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 0.8fr auto',
    gap: '16px',
    alignItems: 'flex-end',
    marginBottom: '32px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  selectInput: {
    backgroundColor: '#0E1322',
    cursor: 'pointer',
  },
  tableLoader: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 0',
    gap: '10px',
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
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.01)',
    },
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle',
  },
  logId: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#06B6D4',
    fontSize: '14px',
  },
  logDate: {
    fontSize: '13px',
    color: '#F3F4F6',
  },
  operatorBox: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  operatorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  operatorEmail: {
    fontSize: '11px',
    color: '#6B7280',
    marginTop: '2px',
  },
  targetBadge: {
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    color: '#3B82F6',
    fontWeight: '600',
  },
  ipText: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#9CA3AF',
  },
  detailsBtn: (isExpanded) => ({
    fontSize: '11px',
    padding: '6px 12px',
    fontWeight: '600',
    borderColor: isExpanded ? '#9CA3AF' : 'var(--border-color)',
    color: isExpanded ? '#F3F4F6' : '#9CA3AF',
  }),
  emptyCell: {
    textAlign: 'center',
    padding: '50px',
    color: '#6B7280',
    fontSize: '14px',
  },
  expandedCell: {
    padding: '0 24px 24px 24px',
    backgroundColor: 'rgba(255,255,255,0.015)',
    verticalAlign: 'top',
  },
  expandedContent: {
    padding: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    backgroundColor: '#070C19',
    textAlign: 'left',
  },
  drawerTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: '12px',
    letterSpacing: '0.05em',
  },
  jsonBlock: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#38BDF8',
    whiteSpace: 'pre-wrap',
    overflowX: 'auto',
    lineHeight: '1.5',
    backgroundColor: '#040811',
    padding: '14px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  paginationText: {
    fontSize: '13px',
    color: '#9CA3AF',
  },
  pageButtons: {
    display: 'flex',
    gap: '10px',
  },
  pageBtn: {
    fontSize: '12px',
    padding: '8px 16px',
    fontWeight: '600',
  },
};

export default AuditLogs;
