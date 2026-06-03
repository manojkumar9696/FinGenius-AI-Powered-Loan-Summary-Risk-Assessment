import React, { useEffect, useState } from 'react';

const PortfolioHealthGauge = ({ stats }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Compute composite score:
  // 1. Approval rate: stats.approvalRatePercent (scaled 0-100) -> 40% weight
  // 2. Average risk score: (100 - average_risk_score) -> 35% weight (lower risk is better)
  // 3. Fraud-free rate: (100 - flagged_fraud_percent) -> 25% weight
  const approvalRate = stats?.approvalRatePercent || 0;
  
  // Calculate average risk score from risk distribution
  const lowRisk = stats?.riskDistribution?.low || 0;
  const medRisk = stats?.riskDistribution?.medium || 0;
  const highRisk = stats?.riskDistribution?.high || 0;
  const totalWithRisk = lowRisk + medRisk + highRisk;
  const avgRiskScore = totalWithRisk > 0 
    ? ((lowRisk * 15) + (medRisk * 50) + (highRisk * 85)) / totalWithRisk
    : 30; // default middle risk

  // Calculate fraud-clean rate from fraud distribution
  const passFraud = stats?.fraudDistribution?.pass || 0;
  const reviewFraud = stats?.fraudDistribution?.review || 0;
  const flaggedFraud = stats?.fraudDistribution?.flagged || 0;
  const totalFraud = passFraud + reviewFraud + flaggedFraud;
  const fraudCleanRate = totalFraud > 0
    ? (passFraud / totalFraud) * 100
    : 100; // default clean

  const score = totalWithRisk > 0 || totalFraud > 0
    ? Math.round(
        (approvalRate * 0.40) + 
        ((100 - avgRiskScore) * 0.35) + 
        (fraudCleanRate * 0.25)
      )
    : 100; // Default when no applications exist

  useEffect(() => {
    // Animate from 0 to target score on mount/update
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG Circle math: circumference = 2 * PI * r
  const radius = 35;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (animatedScore / 100) * circ;

  let scoreColor = '#10B981'; // Green
  let scoreClass = 'Good';
  if (animatedScore < 50) {
    scoreColor = '#EF4444'; // Red
    scoreClass = 'Critical';
  } else if (animatedScore < 80) {
    scoreColor = '#F59E0B'; // Orange/Yellow
    scoreClass = 'Moderate';
  }

  return (
    <div className="glass-panel" style={styles.card}>
      <div style={styles.gaugeWrapper}>
        <svg width="90" height="90" viewBox="0 0 90 90" style={styles.svg}>
          {/* Background circle */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Animated health arc */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="transparent"
            stroke={scoreColor}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={styles.circle}
          />
        </svg>
        <div style={styles.scoreTextWrapper}>
          <span style={{ ...styles.scoreText, color: scoreColor }}>{animatedScore}</span>
          <span style={styles.scoreLabel}>Health</span>
        </div>
      </div>
      <div style={styles.meta}>
        <span style={styles.title}>System Portfolio Health</span>
        <span style={{ ...styles.statusTag, color: scoreColor, backgroundColor: `${scoreColor}15` }}>
          ● {scoreClass.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    textAlign: 'left',
    width: '100%',
    height: '100%',
  },
  gaugeWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: 'rotate(-90deg)',
  },
  circle: {
    transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  scoreTextWrapper: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '1',
  },
  scoreLabel: {
    fontSize: '8px',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statusTag: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '12px',
    width: 'max-content',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }
};

export default PortfolioHealthGauge;
