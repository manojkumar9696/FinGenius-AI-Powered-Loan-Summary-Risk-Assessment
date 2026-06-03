import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('loan_officer');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setLocalError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setLocalError('');

    try {
      await register(username, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.glowDecor} />
      
      <div className="glass-panel" style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoBadge}>AI</div>
          <h3 style={styles.logoText}>FinGenius</h3>
        </div>

        <div style={styles.header}>
          <h2 style={styles.title}>Auditor Credentials Signup</h2>
          <p style={styles.subtitle}>Register account session to obtain security key clearances.</p>
        </div>

        {localError && (
          <div className="badge badge-danger" style={styles.errorBanner}>
            ⚠️ {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">Full Name</label>
            <input
              className="form-input"
              id="username"
              type="text"
              placeholder="Officer Doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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

          <div className="input-group">
            <label className="input-label" htmlFor="role">Institutional Role</label>
            <select
              className="form-input"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              <option value="loan_officer">Loan Underwriter Officer</option>
              <option value="admin">System Auditor Administrator</option>
            </select>
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
                CREATING ACCOUNT...
              </>
            ) : (
              'REGISTER COMPLIANCE PROFILE'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Already registered? </span>
          <Link to="/login" style={styles.loginLink}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

/* --- Elegant Styling Specifications --- */
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#060913',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    position: 'relative',
    overflow: 'hidden',
  },
  glowDecor: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.03) 50%, rgba(0,0,0,0) 100%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    borderRadius: '50%',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px',
    textAlign: 'center',
    zIndex: 10,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  logoBadge: {
    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#030712',
    fontWeight: '700',
    fontSize: '12px',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '600',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'left',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  subtitle: {
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
  select: {
    cursor: 'pointer',
    backgroundColor: '#0E1322',
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
  footer: {
    marginTop: '28px',
    fontSize: '14px',
    color: '#9CA3AF',
  },
  footerText: {},
  loginLink: {
    color: '#06B6D4',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.25s ease',
  },
};

export default Signup;
