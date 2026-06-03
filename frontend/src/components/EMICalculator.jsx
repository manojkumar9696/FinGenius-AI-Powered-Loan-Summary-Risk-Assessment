import React, { useState, useEffect } from 'react';

const EMICalculator = () => {
  const [principal, setPrincipal] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [term, setTerm] = useState(36);

  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);

  useEffect(() => {
    const r = interestRate / 12 / 100;
    const n = term;

    if (r === 0) {
      setEmi(principal / n);
      setTotalPayable(principal);
      setTotalInterest(0);
      return;
    }

    const emiCalc = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayCalc = emiCalc * n;
    const totalInterestCalc = totalPayCalc - principal;

    setEmi(Math.round(emiCalc));
    setTotalPayable(Math.round(totalPayCalc));
    setTotalInterest(Math.round(totalInterestCalc));
  }, [principal, interestRate, term]);

  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const interestPercentage = totalPayable > 0 ? (totalInterest / totalPayable) * 100 : 0;
  const principalPercentage = totalPayable > 0 ? (principal / totalPayable) * 100 : 0;

  return (
    <div className="glass-panel" style={styles.card}>
      <h3 style={styles.title}>⚡ Live EMI Calculator</h3>
      <span style={styles.subtitle}>INDIAN RUPEE RETAIL LOAN MATH</span>

      <div style={styles.slidersContainer}>
        {/* Loan Amount */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderLabelRow}>
            <span style={styles.label}>Amount:</span>
            <span style={styles.value}>{formatRupee(principal)}</span>
          </div>
          <input
            type="range"
            min="10000"
            max="10000000"
            step="10000"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        {/* Interest Rate */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderLabelRow}>
            <span style={styles.label}>Interest Rate:</span>
            <span style={styles.value}>{interestRate}% p.a.</span>
          </div>
          <input
            type="range"
            min="5"
            max="24"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        {/* Loan Term */}
        <div style={styles.sliderGroup}>
          <div style={styles.sliderLabelRow}>
            <span style={styles.label}>Term:</span>
            <span style={styles.value}>{term} Months ({Math.round(term / 12 * 10) / 10} yrs)</span>
          </div>
          <input
            type="range"
            min="6"
            max="120"
            step="6"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>

      <div style={styles.resultContainer}>
        <div style={styles.resultItem}>
          <span style={styles.resultLabel}>Monthly EMI</span>
          <span style={styles.resultValue}>{formatRupee(emi)}</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.resultDetailsRow}>
          <div style={styles.detailCol}>
            <span style={styles.detailLabel}>Principal Amount</span>
            <span style={styles.detailValue}>{formatRupee(principal)}</span>
          </div>
          <div style={styles.detailCol}>
            <span style={styles.detailLabel}>Total Interest</span>
            <span style={{ ...styles.detailValue, color: '#F59E0B' }}>{formatRupee(totalInterest)}</span>
          </div>
        </div>
      </div>

      {/* Progress Breakdown Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressLabelRow}>
          <span>Principal Breakdown</span>
          <span>{Math.round(principalPercentage)}% vs {Math.round(interestPercentage)}%</span>
        </div>
        <div style={styles.progressBarWrapper}>
          <div style={{ ...styles.progressPart, width: `${principalPercentage}%`, backgroundColor: '#06B6D4' }} />
          <div style={{ ...styles.progressPart, width: `${interestPercentage}%`, backgroundColor: '#F59E0B' }} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: '9px',
    color: '#6B7280',
    letterSpacing: '0.1em',
    fontWeight: '700',
    marginBottom: '20px',
  },
  slidersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sliderLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  label: {
    color: '#9CA3AF',
  },
  value: {
    color: '#06B6D4',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: '6px',
    backgroundColor: '#161E32',
    borderRadius: '3px',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#06B6D4',
  },
  resultContainer: {
    backgroundColor: '#0E1322',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  resultValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#10B981',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  resultDetailsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  detailCol: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '10px',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  progressContainer: {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#6B7280',
  },
  progressBarWrapper: {
    height: '6px',
    backgroundColor: '#161E32',
    borderRadius: '3px',
    display: 'flex',
    overflow: 'hidden',
  },
  progressPart: {
    height: '100%',
    transition: 'width 0.3s ease',
  }
};

export default EMICalculator;
