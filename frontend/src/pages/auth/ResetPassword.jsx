import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [showPass, setShowPass] = useState({ new: false, confirm: false });
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});

  const hasValidLink = uid && token;

  const handleChange = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColor = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"];
  const strength = getStrength(form.new_password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.new_password) { setErrors({ new_password: "New password is required." }); return; }
    if (form.new_password.length < 6) { setErrors({ new_password: "Password must be at least 6 characters." }); return; }
    if (form.new_password !== form.confirm_password) { setErrors({ confirm_password: "Passwords do not match." }); return; }

    setStatus("loading");
    try {
      await resetPassword(uid, token, form.new_password, form.confirm_password);
      setStatus("success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const data = err?.response?.data;
      if (typeof data === "object") setErrors(data);
      else setErrors({ detail: data?.detail || "Reset failed. The link may have expired." });
      setStatus("idle");
    }
  };

  if (!hasValidLink) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
          <p className="text-slate-400 text-sm">This link is missing required parameters.</p>
          <Link to="/forgot-password" className="text-purple-400 hover:text-purple-300 text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
          <p className="text-slate-400">Redirecting to login in 3 seconds…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Set New Password</h1>
            <p className="mt-2 text-slate-400 text-sm">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass.new ? "text" : "password"}
                  value={form.new_password}
                  onChange={(e) => handleChange("new_password", e.target.value)}
                  placeholder="Min. 6 characters"
                  className={`w-full pl-10 pr-10 py-3 bg-black/30 border rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all
                    ${errors.new_password ? "border-red-500/60" : "border-white/15 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"}`}
                />
                <button type="button" onClick={() => setShowPass((s) => ({ ...s, new: !s.new }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.new_password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} className={`flex-1 rounded-full transition-all ${strength >= n ? strengthColor[strength] : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${strength >= 4 ? "text-emerald-400" : strength >= 3 ? "text-yellow-400" : "text-red-400"}`}>
                    {strengthLabel[strength]}
                  </p>
                </div>
              )}
              {errors.new_password && <p className="mt-1 text-red-400 text-xs">{errors.new_password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass.confirm ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={(e) => handleChange("confirm_password", e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-3 bg-black/30 border rounded-xl text-white placeholder-slate-600 focus:outline-none transition-all
                    ${errors.confirm_password ? "border-red-500/60" : "border-white/15 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"}`}
                />
                <button type="button" onClick={() => setShowPass((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1 text-red-400 text-xs">{errors.confirm_password}</p>}
            </div>

            <AnimatePresence>
              {errors.detail && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2.5 text-sm"
                >
                  <AlertCircle size={15} /> {errors.detail}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <><Loader2 size={18} className="animate-spin" /> Resetting…</>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
