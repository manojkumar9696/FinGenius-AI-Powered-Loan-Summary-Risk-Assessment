import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Premium Layout Header Navigation Bar
 * Exhibits active auditor profile statistics and routes secure admin clearances paths.
 */
const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isAuditPage = location.pathname === '/audit';

  return (
    <header className="glass-panel" style={styles.header}>
      {/* Left Branding Group */}
      <div style={styles.branding}>
        <div style={styles.logoBadge}>AI</div>
        <div>
          <h2 style={styles.logoText}>FinGenius</h2>
          <span style={styles.complianceTag}>GLBA / SOC2 SECURED COMPLIANCE COCKPIT</span>
        </div>
      </div>

      {/* Right User & Router Navigation Group */}
      <div style={styles.navGroup}>
        {/* Analytics Navigation Link */}
        {location.pathname !== '/analytics' ? (
          <Link to="/analytics" className="btn btn-secondary" style={styles.navBtn}>
            📈 PORTFOLIO ANALYTICS
          </Link>
        ) : (
          <Link to="/dashboard" className="btn btn-secondary" style={styles.navBtn}>
            📊 COCKPIT DASHBOARD
          </Link>
        )}

        {/* Admin Audit Logs Routing Button */}
        {isAdmin && (
          isAuditPage ? (
            <Link to="/dashboard" className="btn btn-primary" style={styles.navBtn}>
              📊 COCKPIT Cockpit
            </Link>
          ) : (
            <Link to="/audit" className="btn btn-secondary" style={styles.navBtn}>
              🔒 INSPECT AUDIT TRAILS
            </Link>
          )
        )}

        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>{user.username}</span>
            <span style={{ 
              ...styles.userRole, 
              color: isAdmin ? '#EF4444' : '#06B6D4'
            }}>
              {user.role.toUpperCase().replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button className="btn btn-secondary" onClick={handleLogout} style={styles.logoutBtn}>
          🚪 LOGOUT
        </button>
      </div>
    </header>
  );
};

/* --- Visual Header Styles --- */
const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    margin: '24px 24px 0 24px',
    borderRadius: '12px',
    backgroundColor: 'rgba(14, 19, 34, 0.85)',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'left',
  },
  logoBadge: {
    background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#030712',
    fontWeight: '800',
    fontSize: '14px',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  complianceTag: {
    fontSize: '9px',
    color: '#6B7280',
    letterSpacing: '0.1em',
    fontWeight: '700',
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navBtn: {
    fontSize: '13px',
    padding: '8px 16px',
    letterSpacing: '0.03em',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingRight: '16px',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    color: '#06B6D4',
    fontWeight: '700',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#F3F4F6',
  },
  userRole: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  logoutBtn: {
    fontSize: '12px',
    padding: '8px 14px',
    letterSpacing: '0.03em',
  },
};

export default Header;
