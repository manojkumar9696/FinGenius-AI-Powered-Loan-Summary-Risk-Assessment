import React from 'react';

/**
 * Premium Vanilla CSS Analytical Charts
 * Renders high-fidelity status tracks, circular rings, and horizontal progress grids utilizing CSS vector shadows.
 */

// Widget 1: Horizontal Progress Bar
export const CSSProgressBar = ({ label, value, total, color = '#06B6D4' }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={styles.barContainer}>
      <div style={styles.barHeader}>
        <span style={styles.barLabel}>{label}</span>
        <span style={styles.barValue}>{value} / {total} ({percentage}%)</span>
      </div>
      <div style={styles.track}>
        <div 
          style={{ 
            ...styles.fill, 
            width: `${percentage}%`, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}33`
          }} 
        />
      </div>
    </div>
  );
};

// Widget 2: Status Breakdowns Grid
export const CSSStatusBreakdown = ({ pending = 0, approved = 0, rejected = 0 }) => {
  const total = pending + approved + rejected;
  return (
    <div style={styles.statusGrid}>
      <CSSProgressBar label="Approved Applications" value={approved} total={total} color="#10B981" />
      <CSSProgressBar label="Under Manual Review" value={pending} total={total} color="#F59E0B" />
      <CSSProgressBar label="Declined Applications" value={rejected} total={total} color="#EF4444" />
    </div>
  );
};

// Widget 3: Circular Radial Ring Meter
export const CSSRadialRing = ({ label, percentage, color = '#06B6D4' }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={styles.radialCard}>
      <div style={styles.svgWrapper}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          {/* Background circle */}
          <circle 
            cx="45" 
            cy="45" 
            r={radius} 
            fill="transparent" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="6" 
          />
          {/* Active progress circle */}
          <circle 
            cx="45" 
            cy="45" 
            r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="6" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        <div style={styles.radialCenterText}>{percentage}%</div>
      </div>
      <div style={styles.radialLabel}>{label}</div>
    </div>
  );
};

/* --- Visual Styling Specifications --- */
const styles = {
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    fontWeight: '500',
  },
  barLabel: {
    color: '#9CA3AF',
  },
  barValue: {
    color: '#F3F4F6',
  },
  track: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  statusGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  radialCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '10px',
  },
  svgWrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialCenterText: {
    position: 'absolute',
    fontSize: '16px',
    fontWeight: '700',
    color: '#F3F4F6',
    letterSpacing: '-0.02em',
  },
  radialLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
