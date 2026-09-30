import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/rbac';

/**
 * AdminProtectedRoute
 * Guards all /admin/* routes.
 * - Not logged in  → /admin/login
 * - Logged in but NOT super admin → /admin/login with an error message
 * - Super admin → render children
 */
export default function AdminProtectedRoute({ children }) {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location, message: 'Please sign in with admin credentials.' }}
        replace
      />
    );
  }

  if (role !== ROLES.SUPER_ADMIN) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location, message: 'You do not have admin access.' }}
        replace
      />
    );
  }

  return children;
}
