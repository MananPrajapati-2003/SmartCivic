import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  User, Building2, Eye, EyeOff, CheckCircle2, Clock,
  Mail, Phone, Lock, Globe, MapPin, Users, ArrowRight,
  AlertCircle, ShieldAlert, ChevronLeft, ShieldCheck, Star, Zap,
} from "lucide-react";

// ── Role config ────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: "citizen",
    label: "Citizen",
    subtitle: "Individual civic participation",
    icon: User,
    gradient: "from-cyan-500 to-blue-600",
    active: "border-cyan-500/60 bg-cyan-500/10",
    check: "bg-cyan-500",
    btn: "from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/30",
    perks: [
      { icon: Zap,        text: "Report issues instantly" },
      { icon: ShieldCheck,text: "Track resolution in real-time" },
      { icon: Star,       text: "Earn civic score points" },
    ],
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    id: "ngo_csr",
    label: "NGO / CSR Team",
    subtitle: "Organisation — requires admin approval",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-600",
    active: "border-emerald-500/60 bg-emerald-500/10",
    check: "bg-emerald-500",
    btn: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30",
    perks: [
      { icon: ShieldCheck, text: "Access escalated civic issues" },
      { icon: Users,       text: "Coordinate ground-level response" },
      { icon: Zap,         text: "Partner with government authorities" },
    ],
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

// ── Password strength ──────────────────────────────────────────────────────────
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-emerald-500", "bg-green-400"];

function getStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 5);
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const s = getStrength(password);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s ? strengthColor[s] : "bg-white/10"}`} />
        ))}
      </div>
      <p className={`text-xs ${s <= 2 ? "text-red-400" : s <= 3 ? "text-yellow-400" : "text-emerald-400"}`}>
        {strengthLabel[s]}
      </p>
    </div>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function IconInput({ icon: Icon, type = "text", placeholder, value, onChange, error, rightEl }) {
  return (
    <div className={`flex items-center bg-white/5 border rounded-xl px-4 py-3 transition-colors ${
      error ? "border-red-500/50 focus-within:border-red-400" : "border-white/10 focus-within:border-cyan-500/50"
    }`}>
      {Icon && <Icon size={14} className="text-slate-500 shrink-0 mr-3" />}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none placeholder-slate-500" />
      {rightEl && <span className="shrink-0 ml-2">{rightEl}</span>}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState("citizen");
  const [step, setStep]                 = useState(1);
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [errors, setErrors]             = useState({});
  const [ngoSuccess, setNgoSuccess]     = useState(null);

  const [citizen, setCitizen] = useState({ full_name: "", email: "", mobile_number: "", password: "", confirm_password: "" });
  const [ngo, setNgo]         = useState({ full_name: "", email: "", mobile_number: "", password: "", confirm_password: "", org_name: "", description: "", website: "", address: "", team_size: "" });

  const setC = (k) => (e) => setCitizen(p => ({ ...p, [k]: e.target.value }));
  const setN = (k) => (e) => setNgo(p => ({ ...p, [k]: e.target.value }));
  const src  = selectedRole === "citizen" ? citizen : ngo;
  const role = ROLES.find(r => r.id === selectedRole);

  const validatePersonal = () => {
    const e = {};
    if (!src.full_name.trim() || src.full_name.trim().length < 2) e.full_name = "Full name required (min 2 chars).";
    if (!src.email.trim() || !/\S+@\S+\.\S+/.test(src.email))    e.email = "Valid email required.";
    if (src.mobile_number && !/^\d{10}$/.test(src.mobile_number)) e.mobile_number = "Must be exactly 10 digits.";
    if (!src.password || src.password.length < 8)                 e.password = "Minimum 8 characters.";
    if (!/\d/.test(src.password))                                 e.password = "Must include at least one number.";
    if (src.password !== src.confirm_password)                    e.confirm_password = "Passwords do not match.";
    return e;
  };

  const validateOrg = () => {
    const e = {};
    if (!ngo.org_name.trim() || ngo.org_name.trim().length < 2)       e.org_name = "Organisation name required.";
    if (!ngo.description.trim() || ngo.description.trim().length < 20) e.description = "Min 20 characters.";
    if (ngo.website && !/^https?:\/\/.+/.test(ngo.website))           e.website = "Must start with http:// or https://";
    if (!ngo.address.trim() || ngo.address.trim().length < 5)         e.address = "Address required.";
    if (!ngo.team_size || Number(ngo.team_size) < 1)                  e.team_size = "At least 1.";
    return e;
  };

  const handleNext = () => {
    const errs = validatePersonal();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    if (selectedRole === "citizen") submitForm();
    else setStep(2);
  };

  const submitForm = async () => {
    if (selectedRole === "ngo_csr") {
      const errs = validateOrg();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
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
      if (result.type === "ngo_pending") setNgoSuccess({ org_name: result.org_name, email: result.email });
      else navigate("/verify-email", { state: { email: result.email } });
    } catch (err) {
      const data = err?.response?.data || {};
      const mapped = {};
      Object.entries(data).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
      setErrors(Object.keys(mapped).length > 0 ? mapped : { non_field_errors: "Registration failed. Please try again." });
      if (selectedRole === "ngo_csr" && Object.keys(mapped).some(k => ["org_name","description","website","address","team_size"].includes(k)))
        setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  // ── NGO success ───────────────────────────────────────────────────────────────
  if (ngoSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#060b18] flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center bg-white/4 border border-emerald-500/25 rounded-3xl p-10 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Clock size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Application Submitted!</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            <strong className="text-emerald-400">{ngoSuccess.org_name}</strong> is under review.
            We'll email <strong className="text-white">{ngoSuccess.email}</strong> once approved — usually 2–3 business days.
          </p>
          <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4 mb-6 text-left">
            <p className="text-emerald-300 text-sm font-semibold mb-2">What happens next?</p>
            <ul className="text-slate-400 text-sm space-y-1.5 list-disc list-inside">
              <li>Admin reviews your application</li>
              <li>You receive an approval email</li>
              <li>Log in and access SmartCivic</li>
            </ul>
          </div>
          <Link to="/login"
            className="block py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg">
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060b18] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* ── LEFT: Role info panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:flex flex-col gap-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-5">
              <ShieldAlert size={12} /> Join SmartCivic
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Create your<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                civic account.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Choose your role and start making your community better — one report at a time.
            </p>
          </div>

          {/* Role selection cards — stacked deck */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select your role</p>
            <div className="space-y-3">
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <motion.button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedRole(r.id); setStep(1); setErrors({}); }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected ? r.active : "border-white/8 bg-white/3 hover:border-white/15"
                    }`}
                  >
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${r.gradient} shrink-0 shadow-lg`}>
                      <r.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-base leading-tight">{r.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{r.subtitle}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? `${r.check} border-transparent` : "border-white/20"
                    }`}>
                      {isSelected && <CheckCircle2 size={13} className="text-white" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Selected role perks */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl border p-5 ${role.accentBg}`}
            >
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${role.accentColor}`}>
                What you get as {role.label}
              </p>
              <div className="space-y-2.5">
                {role.perks.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <p.icon size={15} className={role.accentColor} />
                    <span className="text-slate-300 text-sm">{p.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── RIGHT: Stepped form ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          {/* Mobile role tabs */}
          <div className="flex gap-2 mb-6 lg:hidden">
            {ROLES.map(r => (
              <button key={r.id} type="button"
                onClick={() => { setSelectedRole(r.id); setStep(1); setErrors({}); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  selectedRole === r.id ? r.active + " text-white" : "border-white/8 text-slate-400 hover:border-white/15"
                }`}>
                <r.icon size={14} />
                {r.id === "citizen" ? "Citizen" : "NGO / CSR"}
              </button>
            ))}
          </div>

          {/* Step indicator (NGO only) */}
          <AnimatePresence>
            {selectedRole === "ngo_csr" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mb-5 overflow-hidden"
              >
                {["Personal Details", "Organisation"].map((label, i) => {
                  const active = step === i + 1;
                  const done   = step > i + 1;
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex-1 ${
                        active ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        : done  ? "bg-emerald-500/10 text-emerald-400"
                        : "text-slate-600"
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          active ? "bg-emerald-500 text-white" : done ? "bg-emerald-500/60 text-white" : "bg-white/10 text-slate-500"
                        }`}>{i + 1}</div>
                        {label}
                      </div>
                      {i === 0 && <div className="w-8 h-px bg-white/15 shrink-0" />}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card deck */}
          <div className="relative">
            {/* Peek card behind (NGO step 1) */}
            {selectedRole === "ngo_csr" && step === 1 && (
              <div className="absolute inset-x-3 bottom-0 top-4 bg-emerald-950/30 border border-emerald-500/10 rounded-3xl -z-10" />
            )}

            {/* Main card */}
            <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl shadow-black/40 relative z-10">

              {/* Back button for NGO step 2 */}
              {selectedRole === "ngo_csr" && step === 2 && (
                <button type="button" onClick={() => { setStep(1); setErrors({}); }}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-5">
                  <ChevronLeft size={15} /> Personal Details
                </button>
              )}

              <AnimatePresence mode="wait">

                {/* ── STEP 1: Personal ── */}
                {step === 1 && (
                  <motion.div key="s1"
                    initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="mb-5">
                      <h2 className="text-xl font-black text-white">
                        {selectedRole === "citizen" ? "Your Details" : "Contact Person"}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        {selectedRole === "ngo_csr" ? "Step 1 of 2 — personal information" : "Fill in your information to get started."}
                      </p>
                    </div>

                    {selectedRole === "ngo_csr" && (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                        <Clock size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-amber-300/90 text-xs leading-relaxed">
                          <span className="font-bold">Requires admin approval.</span> Fill all fields carefully — admins review before granting access.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Full Name" required error={errors.full_name}>
                          <IconInput icon={User} placeholder="Your full name"
                            value={src.full_name}
                            onChange={selectedRole === "citizen" ? setC("full_name") : setN("full_name")}
                            error={errors.full_name} />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label="Email Address" required error={errors.email}>
                          <IconInput icon={Mail} type="email" placeholder="you@example.com"
                            value={src.email}
                            onChange={selectedRole === "citizen" ? setC("email") : setN("email")}
                            error={errors.email} />
                        </Field>
                      </div>
                      <Field label="Mobile" error={errors.mobile_number}>
                        <IconInput icon={Phone} placeholder="10-digit (optional)"
                          value={src.mobile_number}
                          onChange={selectedRole === "citizen" ? setC("mobile_number") : setN("mobile_number")}
                          error={errors.mobile_number} />
                      </Field>
                      <div />
                      <Field label="Password" required error={errors.password}>
                        <IconInput icon={Lock} type={showPwd ? "text" : "password"} placeholder="Min 8 chars"
                          value={src.password}
                          onChange={selectedRole === "citizen" ? setC("password") : setN("password")}
                          error={errors.password}
                          rightEl={
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                              className="text-slate-500 hover:text-slate-300 transition-colors">
                              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          } />
                        <PasswordStrength password={src.password} />
                      </Field>
                      <Field label="Confirm Password" required error={errors.confirm_password}>
                        <IconInput icon={Lock} type={showConfirm ? "text" : "password"} placeholder="Repeat password"
                          value={src.confirm_password}
                          onChange={selectedRole === "citizen" ? setC("confirm_password") : setN("confirm_password")}
                          error={errors.confirm_password}
                          rightEl={
                            <button type="button" onClick={() => setShowConfirm(v => !v)}
                              className="text-slate-500 hover:text-slate-300 transition-colors">
                              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          } />
                      </Field>
                    </div>

                    {errors.non_field_errors && (
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={13} /> {errors.non_field_errors}
                      </p>
                    )}

                    <button type="button" onClick={handleNext} disabled={submitting}
                      className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-60 bg-gradient-to-r mt-1 ${role.btn}`}>
                      {submitting
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                        : selectedRole === "citizen"
                          ? <><ArrowRight size={15} /> Create Account</>
                          : <><ArrowRight size={15} /> Next: Organisation Details</>}
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 2: Organisation (NGO) ── */}
                {step === 2 && selectedRole === "ngo_csr" && (
                  <motion.div key="s2"
                    initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="mb-5">
                      <h2 className="text-xl font-black text-white">Organisation Details</h2>
                      <p className="text-slate-400 text-sm mt-1">Step 2 of 2 — tell us about your organisation.</p>
                    </div>

                    <Field label="Organisation Name" required error={errors.org_name}>
                      <IconInput icon={Building2} placeholder="e.g. Green Earth Foundation"
                        value={ngo.org_name} onChange={setN("org_name")} error={errors.org_name} />
                    </Field>

                    <Field label="Description" required error={errors.description}>
                      <textarea
                        placeholder="Describe your organisation's mission and activities (min 20 chars)…"
                        value={ngo.description} onChange={setN("description")} rows={3}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none resize-none transition-colors ${
                          errors.description ? "border-red-500/50" : "border-white/10 focus:border-emerald-500/50"
                        }`}
                      />
                      {errors.description && (
                        <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                          <AlertCircle size={11}/>{errors.description}
                        </p>
                      )}
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Team Size" required error={errors.team_size}>
                        <IconInput icon={Users} type="number" placeholder="e.g. 25"
                          value={ngo.team_size} onChange={setN("team_size")} error={errors.team_size} />
                      </Field>
                      <Field label="Website" error={errors.website}>
                        <IconInput icon={Globe} placeholder="https://…"
                          value={ngo.website} onChange={setN("website")} error={errors.website} />
                      </Field>
                    </div>

                    <Field label="Address" required error={errors.address}>
                      <IconInput icon={MapPin} placeholder="Organisation address"
                        value={ngo.address} onChange={setN("address")} error={errors.address} />
                    </Field>

                    {errors.non_field_errors && (
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={13} /> {errors.non_field_errors}
                      </p>
                    )}

                    <button type="button" onClick={submitForm} disabled={submitting}
                      className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-60 bg-gradient-to-r mt-1 ${role.btn}`}>
                      {submitting
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                        : <><CheckCircle2 size={15} /> Submit NGO Registration</>}
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </motion.div>

      </div>
    </div>
  );
}
