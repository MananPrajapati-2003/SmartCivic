/**
 * SiteSettingsContext — loads global site settings from the backend.
 * Available to all components. Super admin changes persist to DB and
 * reflect immediately across the app (site name in Navbar, email
 * notifications toggle, maintenance mode, etc.)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axiosInstance";
import { useAuth } from "./AuthContext";

const SiteSettingsContext = createContext(null);

export const useSiteSettings = () => {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be inside SiteSettingsProvider");
  return ctx;
};

const DEFAULTS = {
  site_name: "SmartCivic",
  support_email: "support@smartcivic.in",
  email_notifications_enabled: true,
  email_verification_required: true,
  public_registration_enabled: true,
  mobile_bonus_enabled: true,
  default_role: "citizen",
  otp_expiry_minutes: 10,
  otp_max_attempts: 5,
  otp_session_duration: 30,
  sla_critical_hours: 6,
  sla_high_hours: 24,
  sla_medium_hours: 48,
  sla_low_hours: 72,
  maintenance_mode: false,
  updated_at: null,
  updated_by: null,
};

export const SiteSettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "super_admin" || user?.role === "org_admin" || user?.is_staff;

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // Admins get full settings object
        const { data } = await api.get("/auth/settings/");
        setSettings(data);
      } else {
        // Everyone else fetches only public fields (site_name, support_email)
        const { data } = await api.get("/auth/public-settings/");
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch {
      // Network error — keep defaults
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = (patch) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, fetchSettings, updateSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
