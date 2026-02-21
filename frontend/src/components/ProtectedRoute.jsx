import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * Props:
 *   children  — for wrapping a single component
 *   adminOnly — restrict to super_admin or staff
 *   roles     — restrict to specific role list
 */
const ProtectedRoute = ({ children, adminOnly = false, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Wait for auth to resolve

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== "super_admin" && !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If children provided (wrapping a single component) return it.
  // If used as a layout route wrapper (no children), render Outlet.
  return children ?? <Outlet />;
};

export default ProtectedRoute;
