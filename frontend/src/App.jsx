import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Layout
import { Layout } from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import HomePage from "./pages/HomePage";
import Register from "./pages/auth/Register";
import { Login } from "./pages/auth/Login";
import VerifyEmail from "./pages/auth/VerifyEmail";
import VerifyMobile from "./pages/auth/VerifyMobile";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Citizen
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import SubmitIssue from "./pages/citizen/SubmitIssue";
import IssueDetail from "./pages/citizen/IssueDetail";

// Authority
import AuthorityLayout from "./pages/authority/AuthorityLayout";
import AuthorityDashboard from "./pages/authority/AuthorityDashboard";
import VerificationQueue from "./pages/authority/VerificationQueue";
import MyIssues from "./pages/authority/MyIssues";

// NGO
import NGOLayout from "./pages/ngo/NGOLayout";
import NGODashboard from "./pages/ngo/NGODashboard";
import EscalatedIssues from "./pages/ngo/EscalatedIssues";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import NGOApprovalsPage from "./pages/admin/NGOApprovalsPage";
import CreateAccountPage from "./pages/admin/CreateAccountPage";
import IssuesManagementPage from "./pages/admin/IssuesManagementPage";

/**
 * Smart role-based redirect: sends users to their dashboard after login.
 */
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "citizen":        return <Navigate to="/dashboard" replace />;
    case "authority":      return <Navigate to="/authority" replace />;
    case "ngo_csr":        return <Navigate to="/ngo" replace />;
    case "org_admin":
    case "super_admin":    return <Navigate to="/admin" replace />;
    default:               return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ── Public site ──────────────────────────────────────── */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-mobile" element={<ProtectedRoute><VerifyMobile /></ProtectedRoute>} />
          </Route>

          {/* ── Role redirect after login ─────────────────────────── */}
          <Route path="/me" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

          {/* ── Citizen (with shared Navbar + Footer) ─────────────── */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<ProtectedRoute roles={["citizen"]}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute roles={["citizen"]}><SubmitIssue /></ProtectedRoute>} />
            <Route path="/issue/:id" element={<ProtectedRoute roles={["citizen"]}><IssueDetail /></ProtectedRoute>} />
          </Route>

          {/* ── Authority panel ───────────────────────────────────── */}
          <Route path="/authority" element={<ProtectedRoute><AuthorityLayout /></ProtectedRoute>}>
            <Route index element={<AuthorityDashboard />} />
            <Route path="queue" element={<VerificationQueue />} />
            <Route path="my-issues" element={<MyIssues />} />
          </Route>

          {/* ── NGO panel ─────────────────────────────────────────── */}
          <Route path="/ngo" element={<ProtectedRoute><NGOLayout /></ProtectedRoute>}>
            <Route index element={<NGODashboard />} />
            <Route path="escalated" element={<EscalatedIssues />} />
          </Route>

          {/* ── Admin panel ───────────────────────────────────────── */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="issues" element={<IssuesManagementPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="ngo-approvals" element={<NGOApprovalsPage />} />
            <Route path="create-account" element={<CreateAccountPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* ── Fallback ──────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
