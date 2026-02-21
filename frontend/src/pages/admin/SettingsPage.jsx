import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Database, Palette, Globe, Save, CheckCircle } from "lucide-react";

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
      {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)}
    className={`w-11 h-6 rounded-full transition-colors relative ${value ? "bg-indigo-600" : "bg-slate-700"}`}
  >
    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`} />
  </button>
);

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    require_email_verification: true,
    allow_public_registration: true,
    mobile_verification_bonus: true,
    maintenance_mode: false,
    email_notifications: true,
    otp_expiry_minutes: 10,
    max_otp_attempts: 5,
    session_duration_hours: 24,
    default_role: "citizen",
    site_name: "SmartCivic",
    support_email: "support@smartcivic.in",
  });

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = () => {
    // In production, this would call a settings API
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure SmartCivic platform settings</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Settings</>}
        </button>
      </div>

      {/* Auth & Registration */}
      <Section icon={Shield} title="Authentication & Registration" color="bg-indigo-600">
        <Field label="Require Email Verification" sub="New users must verify email before logging in">
          <Toggle value={settings.require_email_verification} onChange={v => set("require_email_verification", v)} />
        </Field>
        <Field label="Public Registration" sub="Allow anyone to create an account">
          <Toggle value={settings.allow_public_registration} onChange={v => set("allow_public_registration", v)} />
        </Field>
        <Field label="Mobile Verification Bonus" sub="Award +50 civic score on mobile verification">
          <Toggle value={settings.mobile_verification_bonus} onChange={v => set("mobile_verification_bonus", v)} />
        </Field>
        <Field label="Default Role for New Users">
          <select value={settings.default_role} onChange={e => set("default_role", e.target.value)}
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60">
            <option value="citizen">Citizen</option>
            <option value="authority">Authority</option>
            <option value="ngo_csr">NGO / CSR</option>
          </select>
        </Field>
      </Section>

      {/* OTP Settings */}
      <Section icon={Database} title="OTP Configuration" color="bg-cyan-700">
        <Field label="OTP Expiry" sub="Minutes before OTP becomes invalid">
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={60} value={settings.otp_expiry_minutes}
              onChange={e => set("otp_expiry_minutes", Number(e.target.value))}
              className="w-20 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 text-center" />
            <span className="text-slate-500 text-sm">minutes</span>
          </div>
        </Field>
        <Field label="Max OTP Attempts" sub="Lock out after N failed attempts">
          <input type="number" min={1} max={10} value={settings.max_otp_attempts}
            onChange={e => set("max_otp_attempts", Number(e.target.value))}
            className="w-20 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 text-center" />
        </Field>
        <Field label="Session Duration" sub="JWT access token lifespan">
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={720} value={settings.session_duration_hours}
              onChange={e => set("session_duration_hours", Number(e.target.value))}
              className="w-20 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 text-center" />
            <span className="text-slate-500 text-sm">hours</span>
          </div>
        </Field>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications" color="bg-amber-700">
        <Field label="Email Notifications" sub="Send transactional emails (OTP, reset)">
          <Toggle value={settings.email_notifications} onChange={v => set("email_notifications", v)} />
        </Field>
      </Section>

      {/* Site */}
      <Section icon={Globe} title="Site Identity" color="bg-emerald-700">
        <Field label="Platform Name">
          <input value={settings.site_name} onChange={e => set("site_name", e.target.value)}
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 w-48" />
        </Field>
        <Field label="Support Email">
          <input value={settings.support_email} onChange={e => set("support_email", e.target.value)}
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 w-52" />
        </Field>
        <Field label="Maintenance Mode" sub="Show maintenance page to all non-admin users">
          <Toggle value={settings.maintenance_mode} onChange={v => set("maintenance_mode", v)} />
        </Field>
      </Section>
    </div>
  );
}
