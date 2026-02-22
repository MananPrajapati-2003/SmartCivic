import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  User, Building2, ChevronDown, Eye, EyeOff,
  CheckCircle2, Clock, Mail, Phone, Lock,
  Globe, MapPin, Users, FileText, ArrowRight,
  AlertCircle,
} from "lucide-react";

// ─── Role Card Selector ───────────────────────────────────────────────────────
const ROLES = [
  {
    id: "citizen",
    label: "Citizen",
    subtitle: "Individual civic participation",
    icon: User,
    gradient: "from-indigo-500 to-purple-600",
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/10",
  },
  {
    id: "ngo_csr",
    label: "NGO / CSR Team",
    subtitle: "Organization — requires admin approval",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
];

// ─── Input Helper ─────────────────────────────────────────────────────────────
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

const Input = ({ icon: Icon, type = "text", placeholder, value, onChange, error, rightEl }) => (
  <div className={`flex items-center gap-2.5 bg-black/40 border rounded-xl px-3.5 py-3 transition-colors
    ${error ? "border-red-500/50 focus-within:border-red-500" : "border-white/12 focus-within:border-indigo-500/60"}`}>
    {Icon && <Icon size={15} className="text-slate-600 shrink-0" />}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
    />
    {rightEl}
  </div>
);

const Textarea = ({ placeholder, value, onChange, error, rows = 3 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full bg-black/40 border rounded-xl px-3.5 py-3 text-white text-sm placeholder-slate-600 outline-none resize-none transition-colors
      ${error ? "border-red-500/50 focus:border-red-500" : "border-white/12 focus:border-indigo-500/60"}`}
  />
);

// ─── Password Strength Bar ────────────────────────────────────────────────────
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-green-400"];

function getStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 5);
}

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const s = getStrength(password);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s ? strengthColor[s] : "bg-white/10"}`} />
        ))}
      </div>
      <p className={`text-xs ${s <= 2 ? "text-red-400" : s <= 3 ? "text-yellow-400" : "text-emerald-400"}`}>
        {strengthLabel[s]}
      </p>
    </div>
  );
};


// ─── Main Register Page ───────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState("citizen");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [ngoSuccess, setNgoSuccess] = useState(null);

  // ── Citizen fields
  const [citizen, setCitizen] = useState({
    full_name: "", email: "", mobile_number: "", password: "", confirm_password: "",
  });

  // ── NGO fields
  const [ngo, setNgo] = useState({
    full_name: "", email: "", mobile_number: "", password: "", confirm_password: "",
    org_name: "", description: "", website: "", address: "", team_size: "",
  });

  const setC = (k) => (e) => setCitizen(p => ({ ...p, [k]: e.target.value }));
  const setN = (k) => (e) => setNgo(p => ({ ...p, [k]: e.target.value }));

  // ── Client-side validation
  const validateCitizen = () => {
    const e = {};
    if (!citizen.full_name.trim() || citizen.full_name.trim().length < 2) e.full_name = "Full name is required (min 2 chars).";
    if (!citizen.email.trim() || !/\S+@\S+\.\S+/.test(citizen.email)) e.email = "Valid email is required.";
    if (citizen.mobile_number && !/^\d{10}$/.test(citizen.mobile_number)) e.mobile_number = "Must be exactly 10 digits.";
    if (!citizen.password || citizen.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!/\d/.test(citizen.password)) e.password = "Password must contain at least one number.";
    if (citizen.password !== citizen.confirm_password) e.confirm_password = "Passwords do not match.";
    return e;
  };

  const validateNGO = () => {
    const e = {};
    if (!ngo.full_name.trim() || ngo.full_name.trim().length < 2) e.full_name = "Contact name required (min 2 chars).";
    if (!ngo.email.trim() || !/\S+@\S+\.\S+/.test(ngo.email)) e.email = "Valid email is required.";
    if (ngo.mobile_number && !/^\d{10}$/.test(ngo.mobile_number)) e.mobile_number = "Must be exactly 10 digits.";
    if (!ngo.password || ngo.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!/\d/.test(ngo.password)) e.password = "Password must contain at least one number.";
    if (ngo.password !== ngo.confirm_password) e.confirm_password = "Passwords do not match.";
    if (!ngo.org_name.trim() || ngo.org_name.trim().length < 2) e.org_name = "Organisation name is required.";
    if (!ngo.description.trim() || ngo.description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (ngo.website && !/^https?:\/\/.+/.test(ngo.website)) e.website = "Must start with http:// or https://";
    if (!ngo.address.trim() || ngo.address.trim().length < 5) e.address = "Address is required.";
    if (!ngo.team_size || Number(ngo.team_size) < 1) e.team_size = "Team size must be at least 1.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = selectedRole === "citizen" ? validateCitizen() : validateNGO();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("role", selectedRole);

      const source = selectedRole === "citizen" ? citizen : ngo;
      Object.entries(source).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) payload.append(k, v);
      });

      const result = await register(payload);

      if (result.type === "ngo_pending") {
        setNgoSuccess({ org_name: result.org_name, email: result.email });
      } else {
        navigate("/verify-email", { state: { email: result.email } });
      }
    } catch (err) {
      const data = err?.response?.data || {};
      // Map API errors to field errors
      const mapped = {};
      Object.entries(data).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : v;
      });
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
      } else {
        setErrors({ non_field_errors: "Registration failed. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── NGO success screen
  if (ngoSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center bg-[#0d1526]/80 border border-emerald-500/30 rounded-3xl p-10 shadow-2xl backdrop-blur-xl"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <Clock size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            <strong className="text-emerald-400">{ngoSuccess.org_name}</strong> has been registered and is under review.
            We'll email <strong className="text-white">{ngoSuccess.email}</strong> once approved (usually 2–3 business days).
          </p>
          <div className="flex flex-col gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-300 text-sm font-medium">What happens next?</p>
              <ul className="text-slate-400 text-xs mt-2 space-y-1 text-left list-disc list-inside">
                <li>Admin reviews your application</li>
                <li>You'll receive an approval email</li>
                <li>Log in and access the SmartCivic platform</li>
              </ul>
            </div>
            <Link to="/login" className="block py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const pwd = selectedRole === "citizen" ? citizen.password : ngo.password;

  return (
    <div className="min-h-screen py-10 px-4 flex items-start justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-500 text-sm mt-2">Join SmartCivic — India's civic intelligence platform</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLES.map(({ id, label, subtitle, icon: Icon, gradient, border, bg }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setSelectedRole(id); setErrors({}); }}
              className={`relative flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-250 cursor-pointer
                ${selectedRole === id
                  ? `${border} ${bg} shadow-lg shadow-black/20`
                  : "border-white/8 bg-white/2 hover:border-white/15"
                }`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-white font-semibold text-sm">{label}</p>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{subtitle}</p>
              {selectedRole === id && (
                <motion.div
                  layoutId="role-check"
                  className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 size={12} className="text-white" />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          layout
          className="bg-[#0d1526]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl"
        >
          {/* NGO info banner */}
          <AnimatePresence>
            {selectedRole === "ngo_csr" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5"
              >
                <p className="text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <Clock size={13} /> Pending Approval Required
                </p>
                <p className="text-amber-200/70 text-xs mt-1">
                  NGO/CSR accounts are reviewed by admins before access is granted. Fill all required fields carefully.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── CITIZEN FIELDS ── */}
            <AnimatePresence mode="wait">
              {selectedRole === "citizen" && (
                <motion.div
                  key="citizen"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Personal Details</p>

                  <Field label="Full Name" required error={errors.full_name}>
                    <Input icon={User} placeholder="Your full name" value={citizen.full_name} onChange={setC("full_name")} error={errors.full_name} />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <Input icon={Mail} type="email" placeholder="you@example.com" value={citizen.email} onChange={setC("email")} error={errors.email} />
                  </Field>
                  <Field label="Mobile Number" error={errors.mobile_number}>
                    <Input icon={Phone} placeholder="10-digit number (optional)" value={citizen.mobile_number} onChange={setC("mobile_number")} error={errors.mobile_number} />
                  </Field>
                  <Field label="Password" required error={errors.password}>
                    <Input
                      icon={Lock} type={showPwd ? "text" : "password"} placeholder="Min 8 chars, at least one number"
                      value={citizen.password} onChange={setC("password")} error={errors.password}
                      rightEl={<button type="button" onClick={() => setShowPwd(v => !v)} className="text-slate-600 hover:text-slate-400">{showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}
                    />
                    <PasswordStrength password={citizen.password} />
                  </Field>
                  <Field label="Confirm Password" required error={errors.confirm_password}>
                    <Input
                      icon={Lock} type={showConfirm ? "text" : "password"} placeholder="Re-enter password"
                      value={citizen.confirm_password} onChange={setC("confirm_password")} error={errors.confirm_password}
                      rightEl={<button type="button" onClick={() => setShowConfirm(v => !v)} className="text-slate-600 hover:text-slate-400">{showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}
                    />
                  </Field>
                </motion.div>
              )}

              {/* ── NGO FIELDS ── */}
              {selectedRole === "ngo_csr" && (
                <motion.div
                  key="ngo"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Contact Person</p>
                  <Field label="Contact Person Name" required error={errors.full_name}>
                    <Input icon={User} placeholder="Your full name" value={ngo.full_name} onChange={setN("full_name")} error={errors.full_name} />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <Input icon={Mail} type="email" placeholder="contact@yourorg.com" value={ngo.email} onChange={setN("email")} error={errors.email} />
                  </Field>
                  <Field label="Mobile Number" error={errors.mobile_number}>
                    <Input icon={Phone} placeholder="10-digit number (optional)" value={ngo.mobile_number} onChange={setN("mobile_number")} error={errors.mobile_number} />
                  </Field>
                  <Field label="Password" required error={errors.password}>
                    <Input
                      icon={Lock} type={showPwd ? "text" : "password"} placeholder="Min 8 chars, at least one number"
                      value={ngo.password} onChange={setN("password")} error={errors.password}
                      rightEl={<button type="button" onClick={() => setShowPwd(v => !v)} className="text-slate-600 hover:text-slate-400">{showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}
                    />
                    <PasswordStrength password={ngo.password} />
                  </Field>
                  <Field label="Confirm Password" required error={errors.confirm_password}>
                    <Input
                      icon={Lock} type={showConfirm ? "text" : "password"} placeholder="Re-enter password"
                      value={ngo.confirm_password} onChange={setN("confirm_password")} error={errors.confirm_password}
                      rightEl={<button type="button" onClick={() => setShowConfirm(v => !v)} className="text-slate-600 hover:text-slate-400">{showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}
                    />
                  </Field>

                  <div className="border-t border-white/8 pt-4">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">Organisation Details</p>
                    <div className="space-y-4">
                      <Field label="Organisation Name" required error={errors.org_name}>
                        <Input icon={Building2} placeholder="e.g. Green Earth Foundation" value={ngo.org_name} onChange={setN("org_name")} error={errors.org_name} />
                      </Field>
                      <Field label="Description" required error={errors.description}>
                        <Textarea placeholder="Describe your organisation's mission, goals, and activities (min 20 chars)..." value={ngo.description} onChange={setN("description")} error={errors.description} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Website" error={errors.website}>
                          <Input icon={Globe} placeholder="https://... (optional)" value={ngo.website} onChange={setN("website")} error={errors.website} />
                        </Field>
                        <Field label="Team Size" required error={errors.team_size}>
                          <Input icon={Users} type="number" placeholder="e.g. 25" value={ngo.team_size} onChange={setN("team_size")} error={errors.team_size} />
                        </Field>
                      </div>
                      <Field label="Address" required error={errors.address}>
                        <Input icon={MapPin} placeholder="Organization address" value={ngo.address} onChange={setN("address")} error={errors.address} />
                      </Field>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Non-field error */}
            {errors.non_field_errors && (
              <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1.5">
                <AlertCircle size={14} /> {errors.non_field_errors}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all
                ${selectedRole === "citizen"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                } disabled:opacity-50 shadow-lg mt-2`}
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
              ) : selectedRole === "citizen" ? (
                <><ArrowRight size={16} /> Create Citizen Account</>
              ) : (
                <><ArrowRight size={16} /> Submit NGO Registration</>
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-sm mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
