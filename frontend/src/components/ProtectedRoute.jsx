import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 *   // Role-restricted:
 *   <ProtectedRoute roles={["authority", "super_admin"]}>
 *     <AuthorityDashboard />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Save where the user was trying to go so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
