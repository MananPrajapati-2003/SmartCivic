import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings, Shield, Bell, Database, Globe, Save,
  CheckCircle, Loader2, AlertTriangle, Clock
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const Section = ({ icon: Icon, title, color, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/3 border border-white/8 rounded-2xl p-6"
  >
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <h3 className="text-white font-semibold">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

const Field = ({ label, sub, children }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-slate-200 text-sm font-medium">{label}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ value, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!value)}
    disabled={disabled}
    className={`w-11 h-6 rounded-full transition-colors relative ${
      value ? "bg-indigo-600" : "bg-slate-700"
    } disabled:opacity-40`}
  >
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`} />
  </button>
);

const NumberInput = ({ value, onChange, min, max, unit, disabled }) => (
  <div className="flex items-center gap-2">
    <input
      type="number" min={min} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      disabled={disabled}
      className="w-20 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 text-center disabled:opacity-40"
    />
    {unit && <span className="text-slate-500 text-sm">{unit}</span>}
  </div>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const { updateSettings: updateGlobalSettings } = useSiteSettings();
  const isSuperAdmin = user?.role === "super_admin";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load settings from backend on mount
  useEffect(() => {
    api.get("/auth/settings/")
      .then(r => setSettings(r.data))
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch("/auth/settings/", settings);
      // Update global context so site name etc. reflect immediately everywhere
      updateGlobalSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center gap-2 text-red-400 py-8">
        <AlertTriangle size={18} /> {error || "Could not load settings."}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isSuperAdmin
              ? "Changes save to the database and reflect globally across the platform."
              : "Read-only — only Super Admin can change settings."}
          </p>
          {settings.updated_by && (
            <p className="text-slate-600 text-xs mt-1">
              Last updated by <span className="text-slate-400">{settings.updated_by}</span>
              {settings.updated_at && ` · ${new Date(settings.updated_at).toLocaleString("en-IN")}`}
            </p>
          )}
        </div>
        {isSuperAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : saved
              ? <><CheckCircle size={15} /> Saved!</>
              : <><Save size={15} /> Save Settings</>}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Site Identity */}
      <Section icon={Globe} title="Site Identity" color="bg-emerald-700">
        <Field label="Platform Name" sub="Shown in the browser tab, navbar, and emails">
          <input
            value={settings.site_name}
            onChange={e => set("site_name", e.target.value)}
            disabled={!isSuperAdmin}
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 w-48 disabled:opacity-40"
          />
        </Field>
        <Field label="Support Email" sub="Shown in footer and contact pages">
          <input
            value={settings.support_email}
            onChange={e => set("support_email", e.target.value)}
            disabled={!isSuperAdmin}
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 w-56 disabled:opacity-40"
          />
        </Field>
        <Field label="Maintenance Mode" sub="Shows a maintenance notice to all non-admin users">
          <Toggle value={settings.maintenance_mode} onChange={v => set("maintenance_mode", v)} disabled={!isSuperAdmin} />
        </Field>
      </Section>

      {/* Auth & Registration */}
      <Section icon={Shield} title="Authentication & Registration" color="bg-indigo-600">
        <Field label="Require Email Verification" sub="New users must verify email before logging in">
          <Toggle value={settings.email_verification_required} onChange={v => set("email_verification_required", v)} disabled={!isSuperAdmin} />
        </Field>
        <Field label="Public Registration" sub="Allow anyone to self-register an account">
          <Toggle value={settings.public_registration_enabled} onChange={v => set("public_registration_enabled", v)} disabled={!isSuperAdmin} />
        </Field>
        <Field label="Mobile Verification Bonus" sub="Award +50 civic score on mobile verification">
          <Toggle value={settings.mobile_bonus_enabled} onChange={v => set("mobile_bonus_enabled", v)} disabled={!isSuperAdmin} />
        </Field>
        <Field label="Default Role for New Users">
          <select
            value={settings.default_role}
            onChange={e => set("default_role", e.target.value)}
            disabled={!isSuperAdmin}
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 disabled:opacity-40"
          >
            <option value="citizen">Citizen</option>
            <option value="authority">Authority</option>
            <option value="ngo_csr">NGO / CSR</option>
          </select>
        </Field>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications" color="bg-amber-700">
        <Field
          label="Email Notifications"
          sub="Global switch — disables ALL outbound emails (OTP, alerts, credentials) when turned off"
        >
          <Toggle value={settings.email_notifications_enabled} onChange={v => set("email_notifications_enabled", v)} disabled={!isSuperAdmin} />
        </Field>
        {!settings.email_notifications_enabled && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-400 text-xs">
            <AlertTriangle size={13} />
            All outbound emails are currently disabled. Users will not receive OTPs, alerts, or login notifications.
          </div>
        )}
      </Section>

      {/* OTP */}
      <Section icon={Database} title="OTP Configuration" color="bg-cyan-700">
        <Field label="OTP Expiry" sub="Minutes before an OTP becomes invalid">
          <NumberInput value={settings.otp_expiry_minutes} onChange={v => set("otp_expiry_minutes", v)} min={1} max={60} unit="minutes" disabled={!isSuperAdmin} />
        </Field>
        <Field label="Max OTP Attempts" sub="Lock user out after N failed attempts">
          <NumberInput value={settings.otp_max_attempts} onChange={v => set("otp_max_attempts", v)} min={1} max={10} disabled={!isSuperAdmin} />
        </Field>
        <Field label="Session Duration" sub="How long before JWT session expires">
          <NumberInput value={settings.otp_session_duration} onChange={v => set("otp_session_duration", v)} min={5} max={720} unit="minutes" disabled={!isSuperAdmin} />
        </Field>
      </Section>

      {/* SLA */}
      <Section icon={Clock} title="SLA Defaults" color="bg-rose-700">
        <p className="text-slate-500 text-xs -mt-2 mb-1">
          Default SLA hours per severity level. Used when no custom SLA is set on an assignment.
        </p>
        <Field label="Critical" sub="e.g. collapsed road, no water supply">
          <NumberInput value={settings.sla_critical_hours} onChange={v => set("sla_critical_hours", v)} min={1} max={48} unit="hours" disabled={!isSuperAdmin} />
        </Field>
        <Field label="High" sub="e.g. large pothole, major leak">
          <NumberInput value={settings.sla_high_hours} onChange={v => set("sla_high_hours", v)} min={1} max={96} unit="hours" disabled={!isSuperAdmin} />
        </Field>
        <Field label="Medium" sub="e.g. broken streetlight, minor garbage">
          <NumberInput value={settings.sla_medium_hours} onChange={v => set("sla_medium_hours", v)} min={1} max={168} unit="hours" disabled={!isSuperAdmin} />
        </Field>
        <Field label="Low" sub="e.g. graffiti, minor park damage">
          <NumberInput value={settings.sla_low_hours} onChange={v => set("sla_low_hours", v)} min={1} max={336} unit="hours" disabled={!isSuperAdmin} />
        </Field>
      </Section>
    </div>
  );
}
