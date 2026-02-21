import React, { createContext, useContext, useState } from "react";
import api from "../api/axiosInstance";

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides:
 *   user      : authenticated user object (null if logged out)
 *   loading   : true while an auth request is in-flight
 *   error     : last auth error (string or object)
 *   login()   : POST /api/auth/login/
 *   register(): POST /api/auth/register/ (multipart)
 *   logout()  : POST /api/auth/logout/ + clear localStorage
 */
export const AuthProvider = ({ children }) => {
  // Restore user from localStorage on first load (persists across refreshes)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const persistSession = (tokens, userData) => {
    localStorage.setItem("access", tokens.access);
    localStorage.setItem("refresh", tokens.refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ── Auth Actions ──────────────────────────────────────────────────────────

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/login/", { email, password });
      persistSession(data.tokens, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Login failed. Please check your credentials.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Do NOT auto-login after register — redirect to login page
      return { success: true, user: data.user };
    } catch (err) {
      const errors = err.response?.data || { detail: "Registration failed. Please try again." };
      setError(errors);
      return { success: false, errors };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem("refresh");
    try {
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      }
    } catch {
      // Silently ignore blacklist errors — always clear locally
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — hook to access the auth context.
 * Throws if used outside of <AuthProvider>.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
