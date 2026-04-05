import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, ShieldCheck, Mail, Phone, User,
  Loader2, CheckCircle2, AlertCircle, Copy, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosInstance";

// ── Field wrapper ─────────────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs text-slate-400 font-medium mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
        <AlertCircle size={11} />{error}
      </p>
    )}
  </div>
);

const Input = ({ icon: Icon, type = "text", placeholder, value, onChange, error }) => (
  <div className={`flex items-center gap-2.5 bg-black/40 border rounded-xl px-3.5 py-3
    ${error ? "border-red-500/50" : "border-white/12 focus-within:border-indigo-500/60"} transition-colors`}>
    {Icon && <Icon size={15} className="text-slate-600 shrink-0" />}
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
    />
  </div>
);

// ── Success card after creation ───────────────────────────────────────────
function SuccessCard({ result, onReset }) {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center"
    >
      <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
      <h3 className="text-white font-bold text-lg mb-1">Account Created!</h3>
      <p className="text-slate-400 text-sm mb-5">
        Credentials have been sent to <strong className="text-white">{result.email}</strong>
      </p>
      <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-left space-y-3 mb-5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-xs">Email</span>
          <span className="text-white text-sm font-mono">{result.email}</span>
        </div>
        <div className="h-px bg-white/6" />
        <p className="text-slate-500 text-xs">A temporary password has been emailed to the user.</p>
      </div>
      <button onClick={onReset} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
        Create Another
      </button>
    </motion.div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────
function CreateForm({ type, endpoint, color, icon: Icon, title, subtitle, onSuccess }) {
  const [form, setForm] = useState({ full_name: "", email: "", mobile_number: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) e.full_name = "Full name required (min 2 chars).";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required.";
    if (form.mobile_number && !/^\d{10}$/.test(form.mobile_number)) e.mobile_number = "Must be exactly 10 digits.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post(endpoint, form);
      onSuccess(res.data);
    } catch (err) {
      const data = err?.response?.data || {};
      const mapped = {};
      Object.entries(data).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
      if (Object.keys(mapped).length) setErrors(mapped);
      else setErrors({ non_field: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Icon header */}
      <div className="flex items-center gap-3 p-4 bg-white/3 border border-white/8 rounded-xl mb-2">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{title}</p>
          <p className="text-slate-500 text-xs">{subtitle}</p>
        </div>
      </div>

      <Field label="Full Name" required error={errors.full_name}>
        <Input icon={User} placeholder="Full name" value={form.full_name} onChange={set("full_name")} error={errors.full_name} />
      </Field>
      <Field label="Email Address" required error={errors.email}>
        <Input icon={Mail} type="email" placeholder="user@domain.com" value={form.email} onChange={set("email")} error={errors.email} />
      </Field>
      <Field label="Mobile Number" error={errors.mobile_number}>
        <Input icon={Phone} placeholder="10-digit (optional)" value={form.mobile_number} onChange={set("mobile_number")} error={errors.mobile_number} />
      </Field>

      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
        <p className="text-amber-300 text-xs font-semibold mb-0.5">Auto-generated password</p>
        <p className="text-amber-200/60 text-xs">A secure temporary password will be generated and sent to the user's email. They should change it immediately after logging in.</p>
      </div>

      {errors.non_field && (
        <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1.5">
          <AlertCircle size={14} /> {errors.non_field}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all ${color.replace("bg-", "bg-gradient-to-r from-")} disabled:opacity-50`}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><UserPlus size={16} /> Create {type} Account</>}
      </button>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function CreateAccountPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.is_staff;
  const [activeTab, setActiveTab] = useState("authority");
  const [success, setSuccess] = useState(null);

  const TABS = [
    {
      key: "authority",
      label: "Create Authority",
      description: "Create an account for a government authority officer",
      icon: ShieldCheck,
      endpoint: "/auth/admin/create-authority/",
      color: "bg-indigo-600",
      border: "border-indigo-500/40",
      bg: "bg-indigo-500/10",
      textColor: "text-indigo-400",
    },
    ...(isSuperAdmin ? [{
      key: "admin",
      label: "Create Admin",
      description: "Create a platform admin account (super admin only)",
      icon: UserPlus,
      endpoint: "/auth/admin/create-admin/",
      color: "bg-purple-600",
      border: "border-purple-500/40",
      bg: "bg-purple-500/10",
      textColor: "text-purple-400",
    }] : []),
  ];

  const current = TABS.find(t => t.key === activeTab) || TABS[0];

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Create Account</h1>
        <p className="text-slate-500 text-sm mt-0.5">Create managed accounts for authority officers and admins</p>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-3">
        {TABS.map(({ key, label, textColor, border, bg }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSuccess(null); }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all
              ${activeTab === key ? `${border} ${bg} ${textColor}` : "border-white/8 text-slate-500 hover:border-white/15"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-[#0d1526]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
        <AnimatePresence mode="wait">
          {success ? (
            <SuccessCard key="success" result={success} onReset={() => setSuccess(null)} />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <CreateForm
                type={activeTab === "authority" ? "Authority" : "Admin"}
                endpoint={current.endpoint}
                color={current.color}
                icon={current.icon}
                title={current.label}
                subtitle={current.description}
                onSuccess={setSuccess}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info box */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4">
        <p className="text-white text-xs font-semibold mb-2">Account access levels</p>
        <div className="space-y-1.5 text-xs text-slate-400">
          <p><span className="text-indigo-400 font-medium">Authority</span> — Can manage civic issues in their jurisdiction</p>
          {isSuperAdmin && <p><span className="text-purple-400 font-medium">Admin</span> — Can manage users and NGO approvals in the admin panel</p>}
          <p><span className="text-red-400 font-medium">Super Admin</span> — Full platform control (you)</p>
        </div>
      </div>
    </div>
  );
}
