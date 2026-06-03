import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import UnderwritingReview from '../pages/UnderwritingReview';
import AuditLogs from '../pages/AuditLogs';
import Analytics from '../pages/Analytics';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes Gateways */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applicants/:id" element={<UnderwritingReview />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      {/* Admin-Only Secure Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/audit" element={<AuditLogs />} />
      </Route>


      {/* Dynamic Catch-All Redirect Rules */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;

