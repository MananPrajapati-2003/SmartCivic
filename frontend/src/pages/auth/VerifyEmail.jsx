import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, RotateCcw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmailOTP, resendOTP } = useAuth();

  // email passed from register page or query param
  const emailFromState = location.state?.email || "";
  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Cooldown timer for Resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setErrorMsg("Please enter all 6 digits.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await verifyEmailOTP(email, code);
      setStatus("success");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      const data = err?.response?.data;
      setErrorMsg(data?.otp || data?.detail || "Verification failed. Please try again.");
      setStatus("error");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg("");
    try {
      await resendOTP(email, "email");
      setResendCooldown(60);
    } catch {
      setErrorMsg("Could not resend OTP. Please try again.");
    }
  };

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
          <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
          <p className="text-slate-400">Redirecting to your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Mail className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              We sent a 6-digit OTP to<br />
              <span className="text-indigo-400 font-medium">{email || "your email"}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP boxes */}
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-black/30 text-white outline-none transition-all duration-200
                    ${digit ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-white/20"}
                    focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20`}
                />
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2.5 text-sm"
                >
                  <AlertCircle size={15} /> {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : <>
                <ShieldCheck size={18} /> Verify Email
              </>}
            </button>
          </form>

          {/* Resend */}
          <p className="mt-5 text-center text-sm text-slate-500">
            Didn't receive the OTP?{" "}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            >
              <RotateCcw size={13} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </p>

          <p className="mt-3 text-center text-xs text-slate-600">
            <Link to="/login" className="text-slate-500 hover:text-slate-400">
              ← Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
