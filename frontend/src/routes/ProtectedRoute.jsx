import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection gatekeeper
 * Redirects unauthenticated requests to /login and enforces role clearances.
 */
const ProtectedRoute = ({ allowedRoles = null }) => {
  const { user, loading } = useAuth();

  // Show a clean loading state if the auth state is still loading from localStorage
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#060913',
        color: '#9CA3AF',
        gap: '15px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(6, 182, 212, 0.1)',
          borderTop: '3px solid #06B6D4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '14px', letterSpacing: '0.05em' }}>VERIFYING CREDENTIALS...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // Redirect to Login if no user session exists
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforce role checks if specific clearances are declared (e.g. Admin audit inspector)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children layouts nested in this routing block
  return <Outlet />;
};

export default ProtectedRoute;
