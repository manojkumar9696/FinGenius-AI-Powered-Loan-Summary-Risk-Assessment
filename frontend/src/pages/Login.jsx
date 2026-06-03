import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please provide email and password.');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Left Panel: Financial Summary Showcase */}
      <div style={styles.leftPanel}>
        <div style={styles.decorationGlow} />
        <div style={styles.brandingHeader}>
          <div style={styles.logoBadge}>AI</div>
          <h2 style={styles.brandTitle}>FinGenius</h2>
        </div>

        <div style={styles.heroTextContainer}>
          <h1 style={styles.heroTitle}>AI-Powered Loan <br />Summary & Risk Assessment</h1>
          <p style={styles.heroSubtitle}>
            Transform raw credit portfolios into narrative audit-ready files concurrently utilizing programmatic risk engines and cognitive AI networks.
          </p>
        </div>

        {/* Dynamic Showcase Fintech Cards */}
        <div style={styles.cardShowcase}>
          <div className="glass-panel" style={styles.showcaseCard}>
            <div style={styles.showcaseHeader}>
              <span style={styles.showcaseIcon}>📊</span>
              <span className="badge badge-success">Prime Borrower</span>
            </div>
            <div style={styles.showcaseMetric}>John Smith</div>
            <p style={styles.showcaseText}>FICO Score: 750 | DTI: 14.12% | Recommendation: APPROVED</p>
          </div>

          <div className="glass-panel" style={styles.showcaseCard}>
            <div style={styles.showcaseHeader}>
              <span style={styles.showcaseIcon}>🛡️</span>
              <span className="badge badge-danger">High Risk Audit</span>
            </div>
            <div style={styles.showcaseMetric}>Alice Johnson</div>
            <p style={styles.showcaseText}>SSN Duplication Velocity Flagged | Status: AUTO-DECLINED</p>
          </div>
        </div>
      </div>

      {/* Right Panel: Frosted Glass Form Card */}
      <div style={styles.rightPanel}>
        <div className="glass-panel" style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Compliance Portal Login</h2>
            <p style={styles.formSubtitle}>Authenticate session to access credit committee audit logs.</p>
          </div>

          {localError && (
            <div className="badge badge-danger" style={styles.errorBanner}>
              ⚠️ {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                className="form-input"
                id="email"
                type="email"
                placeholder="officer@bank.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Security Password</label>
              <input
                className="form-input"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div style={styles.btnSpinner} />
                  AUTHENTICATING...
                </>
              ) : (
                'ENTER COMPLIANCE SHIELD'
              )}
            </button>
          </form>

          <div style={styles.footerLinks}>
            <span style={styles.footerText}>New underwriter auditor? </span>
            <Link to="/signup" style={styles.signupLink}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Elegant CSS-in-JS Styling Specifications --- */
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#060913',
  },
  leftPanel: {
    flex: '1.2',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '60px',
    position: 'relative',
    overflow: 'hidden',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
  },
  decorationGlow: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '450px',
    height: '450px',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(0,0,0,0) 100%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  brandingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 10,
  },
  logoBadge: {
    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#030712',
    fontWeight: '700',
    fontSize: '14px',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '0.05em',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  heroTextContainer: {
    marginTop: '40px',
    textAlign: 'left',
    zIndex: 10,
  },
  heroTitle: {
    fontSize: '44px',
    lineHeight: '1.15',
    fontWeight: '700',
    background: 'linear-gradient(to right, #FFFFFF 40%, #9CA3AF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '20px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#9CA3AF',
    maxWidth: '480px',
    lineHeight: '1.6',
  },
  cardShowcase: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '40px',
    zIndex: 10,
  },
  showcaseCard: {
    padding: '20px',
    textAlign: 'left',
  },
  showcaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  showcaseIcon: {
    fontSize: '20px',
  },
  showcaseMetric: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  showcaseText: {
    fontSize: '13px',
    color: '#9CA3AF',
  },
  rightPanel: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background: 'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, rgba(0,0,0,0) 100%)',
  },
  formCard: {
    width: '100%',
    maxWidth: '460px',
    padding: '40px',
    textAlign: 'center',
  },
  formHeader: {
    marginBottom: '32px',
    textAlign: 'left',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
    lineHeight: '1.4',
  },
  errorBanner: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submitBtn: {
    width: '100%',
    marginTop: '12px',
    letterSpacing: '0.05em',
  },
  btnSpinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(3, 7, 18, 0.1)',
    borderTop: '2px solid #030712',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footerLinks: {
    marginTop: '28px',
    fontSize: '14px',
    color: '#9CA3AF',
  },
  footerText: {},
  signupLink: {
    color: '#06B6D4',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.25s ease',
  },
};

export default Login;
