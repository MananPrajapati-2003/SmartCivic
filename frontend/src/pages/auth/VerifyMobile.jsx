import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, CheckCircle, AlertCircle, Loader2, RotateCcw, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function VerifyMobile() {
  const navigate = useNavigate();
  const { user, sendMobileOTP, verifyMobileOTP } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [smsSent]);

  const handleSendOTP = async () => {
    setErrorMsg("");
    try {
      const res = await sendMobileOTP();
      setSmsSent(true);
      setResendCooldown(60);
      // Show the email the OTP was sent to
      const dest = res.email ? `your email (${res.email})` : "your email";
      setSuccessMsg(`OTP sent to ${dest}. Check your inbox.`);
      if (res.dev_otp) setSuccessMsg(`Dev OTP: ${res.dev_otp}`);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to send OTP.");
    }
  };

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

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setErrorMsg("Please enter all 6 digits."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      await verifyMobileOTP(code);
      setStatus("success");
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      const data = err?.response?.data;
      setErrorMsg(data?.otp || data?.detail || "Verification failed.");
      setStatus("idle");
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
          <h2 className="text-2xl font-bold text-white">Mobile Verified! 🎉</h2>
          <p className="text-slate-400">+50 Civic Score awarded. Redirecting…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Verify Mobile Number</h1>
            <p className="mt-2 text-slate-400 text-sm">
              {user?.mobile_number
                ? `We'll send an OTP to ••••••${user.mobile_number.slice(-4)}`
                : "Verify your mobile to earn +50 civic score"}
            </p>
          </div>

          {/* Civic score badge */}
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-2.5 mb-6">
            <Shield size={16} className="text-cyan-400 shrink-0" />
            <p className="text-sm text-cyan-300">Verified citizens earn <strong>+50 Civic Score</strong> and can submit complaints.</p>
          </div>

          {!smsSent ? (
            <button
              onClick={handleSendOTP}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone size={18} /> Send OTP to My Mobile
            </button>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg px-4 py-2.5">
                  {successMsg}
                </div>
              )}
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
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-black/30 text-white outline-none transition-all
                      ${digit ? "border-cyan-500 shadow-lg shadow-cyan-500/20" : "border-white/20"}
                      focus:border-cyan-400`}
                  />
                ))}
              </div>

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

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : "Verify OTP"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Didn't receive OTP?{" "}
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={resendCooldown > 0}
                  className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </button>
              </p>
            </form>
          )}

          <p className="mt-5 text-center text-xs">
            <Link to="/" className="text-slate-500 hover:text-slate-400">
              ← Skip for now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
