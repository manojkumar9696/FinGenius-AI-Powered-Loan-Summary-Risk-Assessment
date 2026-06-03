import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { api } from '../services/api';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setAnalyticsData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch advanced portfolio metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner} />
        <span style={styles.loaderText}>COMPILING DATA VISUALIZATIONS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <Header />
        <main style={styles.main}>
          <div className="badge badge-danger" style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        </main>
      </div>
    );
  }

  const { purposes = [], creditBands = {}, monthlyTrend = [] } = analyticsData || {};

  // Compute maximum values to scale the CSS charts
  const maxTrendCount = Math.max(...monthlyTrend.map(t => t.count), 1);
  const maxPurposeCount = Math.max(...purposes.map(p => p.count), 1);
  const totalPurposesCount = purposes.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div style={styles.page}>
      <Header />
      <main style={styles.main} className="animate-fade-in">
        
        {/* Title ribbon */}
        <div style={styles.titleRibbon}>
          <div>
            <h1 style={styles.pageTitle}>Institutional Portfolio Analytics</h1>
            <span style={styles.pageSubtitle}>REAL-TIME AUDITING INSIGHTS & CREDIT RISK RATIOS</span>
          </div>
          <button className="btn btn-secondary" onClick={loadAnalytics}>🔄 REFRESH DATA</button>
        </div>

        {/* Top summary row */}
        <section style={styles.topStatsRow}>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statLabel}>Unique Purposes</span>
            <span style={styles.statVal}>{purposes.length}</span>
            <span style={styles.statSub}>Active loan types in portfolio</span>
          </div>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statLabel}>Total Capital Underwritten</span>
            <span style={{ ...styles.statVal, color: '#06B6D4' }}>
              {formatRupee(purposes.reduce((acc, curr) => acc + curr.totalAmount, 0))}
            </span>
            <span style={styles.statSub}>Total sanctioned liability footprint</span>
          </div>
          <div className="glass-panel" style={styles.statCard}>
            <span style={styles.statLabel}>Avg Application Ticket</span>
            <span style={{ ...styles.statVal, color: '#10B981' }}>
              {formatRupee(
                totalPurposesCount > 0
                  ? purposes.reduce((acc, curr) => acc + curr.totalAmount, 0) / totalPurposesCount
                  : 0
              )}
            </span>
            <span style={styles.statSub}>Average capital request size</span>
          </div>
        </section>

        {/* Charts Grid */}
        <section style={styles.chartsGrid}>
          
          {/* Trend Bar Chart */}
          <div className="glass-panel" style={styles.chartPanel}>
            <h3 style={styles.panelTitle}>Monthly Application Intake</h3>
            <span style={styles.panelSubtitle}>TREND REPORT OF TOTAL SUBMITTED BORROWER PROFILES</span>
            
            <div style={styles.trendChartContainer}>
              {monthlyTrend.length === 0 ? (
                <div style={styles.emptyChart}>No historical trend data found in current scope.</div>
              ) : (
                <div style={styles.trendBarsRow}>
                  {monthlyTrend.map((t, idx) => {
                    const pct = (t.count / maxTrendCount) * 80; // max 80% height
                    return (
                      <div key={idx} style={styles.trendColumn}>
                        <div style={styles.trendTooltip}>
                          <span style={styles.tooltipTitle}>{t.month}</span>
                          <span>Apps: <b>{t.count}</b></span>
                          <span>Vol: <b>{formatRupee(t.totalAmount)}</b></span>
                        </div>
                        <div style={styles.barWrapper}>
                          <div style={{ ...styles.trendBar, height: `${Math.max(pct, 5)}%` }} />
                        </div>
                        <span style={styles.barLabel}>{t.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Credit Scores Bands */}
          <div className="glass-panel" style={styles.chartPanel}>
            <h3 style={styles.panelTitle}>CIBIL Score Distributions</h3>
            <span style={styles.panelSubtitle}>BORROWER POOL GROUPED BY CREDIT QUALITY CLASSIFICATIONS</span>
            
            <div style={styles.creditBandsContainer}>
              {Object.keys(creditBands).every(k => creditBands[k] === 0) ? (
                <div style={styles.emptyChart}>No CIBIL rating data found in current scope.</div>
              ) : (
                <div style={styles.bandItemsList}>
                  {Object.entries(creditBands).map(([band, count], idx) => {
                    const total = Object.values(creditBands).reduce((a, b) => a + b, 0);
                    const percent = total > 0 ? (count / total) * 100 : 0;
                    
                    let barColor = '#06B6D4';
                    if (band.includes('Excellent')) barColor = '#10B981'; // Green
                    if (band.includes('Good')) barColor = '#3B82F6';      // Blue
                    if (band.includes('Fair')) barColor = '#F59E0B';      // Yellow
                    if (band.includes('Poor')) barColor = '#EF4444';      // Red

                    return (
                      <div key={idx} style={styles.bandRow}>
                        <div style={styles.bandInfoRow}>
                          <span style={styles.bandName}>{band}</span>
                          <span style={styles.bandMeta}>{count} files ({Math.round(percent)}%)</span>
                        </div>
                        <div style={styles.bandBarOuter}>
                          <div style={{ ...styles.bandBarInner, width: `${percent}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Purposes Distribution */}
          <div className="glass-panel" style={{ ...styles.chartPanel, gridColumn: 'span 2' }}>
            <h3 style={styles.panelTitle}>Portfolio Concentration by Loan Purpose</h3>
            <span style={styles.panelSubtitle}>CAPITAL EXPOSURE ALLOCATION PER INTENDED BORROWER PURPOSE</span>
            
            <div style={styles.purposesGrid}>
              {purposes.length === 0 ? (
                <div style={styles.emptyChart}>No purpose concentration details found.</div>
              ) : (
                <div style={styles.purposesList}>
                  {purposes.map((p, idx) => {
                    const widthPct = (p.count / maxPurposeCount) * 100;
                    return (
                      <div key={idx} style={styles.purposeItem}>
                        <div style={styles.purposeLabelCol}>
                          <span style={styles.purposeName}>{p.purpose}</span>
                          <span style={styles.purposeStats}>{p.count} Applications</span>
                        </div>
                        <div style={styles.purposeBarCol}>
                          <div style={styles.purposeBarOuter}>
                            <div style={{ ...styles.purposeBarInner, width: `${widthPct}%` }} />
                          </div>
                        </div>
                        <div style={styles.purposeValCol}>
                          <span style={styles.purposeAmount}>{formatRupee(p.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
};

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
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  errorBanner: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '14px',
  },
  titleRibbon: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '20px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'left',
  },
  pageSubtitle: {
    fontSize: '10px',
    color: '#6B7280',
    letterSpacing: '0.1em',
    fontWeight: '700',
    textAlign: 'left',
    display: 'block',
    marginTop: '4px',
  },
  topStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    gap: '6px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statVal: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#F3F4F6',
    lineHeight: '1.2',
  },
  statSub: {
    fontSize: '10px',
    color: '#6B7280',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartPanel: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  panelSubtitle: {
    fontSize: '9px',
    color: '#6B7280',
    letterSpacing: '0.05em',
    fontWeight: '700',
    marginBottom: '24px',
  },
  trendChartContainer: {
    height: '240px',
    display: 'flex',
    alignItems: 'flex-end',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '10px',
    position: 'relative',
  },
  trendBarsRow: {
    display: 'flex',
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  trendColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '45px',
    position: 'relative',
    cursor: 'pointer',
  },
  barWrapper: {
    height: '180px',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  trendBar: {
    width: '28px',
    backgroundColor: '#06B6D4',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    backgroundImage: 'linear-gradient(to top, rgba(59, 130, 246, 0.3) 0%, #06B6D4 100%)',
    boxShadow: '0 0 15px rgba(6, 182, 212, 0.25)',
    transition: 'all 0.3s ease',
    ':hover': {
      filter: 'brightness(1.2)',
      transform: 'scaleX(1.05)',
    }
  },
  barLabel: {
    fontSize: '11px',
    color: '#6B7280',
    marginTop: '10px',
    whiteSpace: 'nowrap',
  },
  trendTooltip: {
    display: 'none',
    position: 'absolute',
    bottom: '200px',
    backgroundColor: 'rgba(14, 19, 34, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '11px',
    color: '#9CA3AF',
    width: '130px',
    zIndex: 10,
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
    pointerEvents: 'none',
    textAlign: 'left',
  },
  tooltipTitle: {
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: '2px',
  },
  creditBandsContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '240px',
    justifyContent: 'center',
  },
  bandItemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  bandRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  bandInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  bandName: {
    fontWeight: '600',
    color: '#F3F4F6',
  },
  bandMeta: {
    color: '#6B7280',
  },
  bandBarOuter: {
    height: '8px',
    backgroundColor: '#161E32',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bandBarInner: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 1s ease',
  },
  purposesGrid: {
    width: '100%',
  },
  purposesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  purposeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  purposeLabelCol: {
    width: '150px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  purposeName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  purposeStats: {
    fontSize: '10px',
    color: '#6B7280',
    marginTop: '2px',
  },
  purposeBarCol: {
    flexGrow: 1,
  },
  purposeBarOuter: {
    height: '6px',
    backgroundColor: '#161E32',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  purposeBarInner: {
    height: '100%',
    backgroundColor: '#3B82F6',
    backgroundImage: 'linear-gradient(to right, #3B82F6 0%, #06B6D4 100%)',
    borderRadius: '3px',
    transition: 'width 1s ease',
  },
  purposeValCol: {
    width: '150px',
    textAlign: 'right',
    flexShrink: 0,
  },
  purposeAmount: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#10B981',
  },
  emptyChart: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B7280',
    fontSize: '14px',
  }
};

export default Analytics;
