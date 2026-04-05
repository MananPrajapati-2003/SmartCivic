import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axiosInstance";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Restore session from localStorage ──────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("access");
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const saveSession = (userData, tokens) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("access", tokens.access);
    localStorage.setItem("refresh", tokens.refresh);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (formData) => {
    setError(null);
    // formData is a FormData object (supports image upload)
    const res = await api.post("/auth/register/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Returns { email, requires_email_verification: true }
    return res.data;
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setError(null);
    const res = await api.post("/auth/login/", { email, password });
    saveSession(res.data.user, res.data.tokens);
    return res.data;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refresh = localStorage.getItem("refresh");
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch (_) {
      // Ignore errors — clear session regardless
    } finally {
      clearSession();
    }
  }, []);

  // ── Email OTP Verification ─────────────────────────────────────────────────
  const verifyEmailOTP = async (email, otp) => {
    const res = await api.post("/auth/verify-email/", { email, otp });
    // On success the backend returns tokens — log user in directly
    if (res.data.tokens) {
      saveSession(res.data.user, res.data.tokens);
    }
    return res.data;
  };

  const resendOTP = async (email, otp_type = "email") => {
    const res = await api.post("/auth/resend-otp/", { email, otp_type });
    return res.data;
  };

  // ── Mobile OTP (authenticated user) ───────────────────────────────────────
  const sendMobileOTP = async () => {
    const res = await api.post("/auth/send-mobile-otp/");
    return res.data;
  };

  const verifyMobileOTP = async (otp) => {
    const res = await api.post("/auth/verify-mobile/", { otp });
    if (res.data.user) {
      const storedUser = { ...user, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(storedUser));
      setUser(storedUser);
    }
    return res.data;
  };

  // ── Password Reset ─────────────────────────────────────────────────────────
  const forgotPassword = async (email) => {
    const res = await api.post("/auth/forgot-password/", { email });
    return res.data;
  };

  const resetPassword = async (uid, token, new_password, confirm_password) => {
    const res = await api.post("/auth/reset-password/", { uid, token, new_password, confirm_password });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        verifyEmailOTP,
        resendOTP,
        sendMobileOTP,
        verifyMobileOTP,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
