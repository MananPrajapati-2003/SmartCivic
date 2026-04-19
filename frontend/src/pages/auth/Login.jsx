import { useState } from "react";
import {
  Mail, Lock, AlertCircle, Loader2, MailCheck,
  ShieldAlert, ArrowRight, Eye, EyeOff,
  CheckCircle, Clock, MapPin
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const inputCls = (err) =>
  `w-full bg-white/5 border rounded-xl px-4 py-3.5 text-white text-sm placeholder-slate-500 outline-none transition-colors ${
    err ? "border-red-500/50 focus:border-red-400" : "border-white/10 focus:border-cyan-500/60"
  }`;

const FEATURES = [
  { icon: CheckCircle, color: "text-cyan-400",    text: "AI-powered issue classification" },
  { icon: Clock,       color: "text-purple-400",  text: "Real-time SLA tracking & alerts" },
  { icon: MapPin,      color: "text-emerald-400", text: "Location-tagged civic reports" },
  { icon: ShieldAlert, color: "text-amber-400",   text: "Multi-role authority workflow" },
];

export const Login = () => {
  const [form, setForm]             = useState({ email: "", password: "" });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Invalid email address";
    if (form.password.length < 6)  e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setErrors({}); setUnverifiedEmail(null);
    try {
      await login(form.email, form.password);
      navigate("/me", { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 403 && data?.code === "email_not_verified") {
        setUnverifiedEmail(data.email || form.email);
      } else {
        setErrors({
          api: data?.detail ||
            (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
            "Invalid email or password.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060b18] flex items-center">
      <div className="w-full max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* ── LEFT: Branding ── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-col gap-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-5">
              <ShieldAlert size={12} /> India's civic intelligence platform
            </div>
            <h1 className="text-5xl font-black text-white leading-tight mb-4">
              Civic issues,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                resolved faster.
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Report, track and resolve community issues with full transparency and AI-driven priority scoring.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/4 border border-white/8"
              >
                <f.icon size={18} className={f.color} />
                <span className="text-slate-300 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-slate-600 text-sm">Trusted by citizens and authorities across India</p>
        </motion.div>

        {/* ── RIGHT: Login form ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-1.5">Welcome back</h2>
              <p className="text-slate-400">Sign in to your SmartCivic account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Unverified email */}
              <AnimatePresence>
                {unverifiedEmail && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                      <MailCheck size={14} /> Email not verified yet
                    </div>
                    <p className="text-amber-400/80 text-xs">
                      Check <span className="font-bold text-amber-300">{unverifiedEmail}</span> for your OTP.
                    </p>
                    <Link to="/verify-email" state={{ email: unverifiedEmail }}
                      className="block text-xs font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2">
                      Enter OTP → Verify now
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* API error */}
              {errors.api && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {errors.api}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" placeholder="you@example.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className={`${inputCls(errors.email)} pl-11`}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type={showPwd ? "text" : "password"} placeholder="Your password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className={`${inputCls(errors.password)} pl-11 pr-12`}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-60 mt-2">
                {submitting
                  ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                  : <><ArrowRight size={15} /> Sign In</>}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-white/8 text-center">
              <p className="text-slate-500 text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                  Create one free
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
