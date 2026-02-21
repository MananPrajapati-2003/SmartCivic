import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setErrorMsg("Please enter your email."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      await forgotPassword(email);
      setStatus("success");
    } catch (err) {
      const data = err?.response?.data;
      setErrorMsg(data?.email || data?.detail || "Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-3xl" />
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
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Check Your Email</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  If <span className="text-white font-medium">{email}</span> is registered,<br />
                  you'll receive a password reset link shortly.
                </p>
                <p className="text-slate-500 text-xs">
                  Don't see it? Check your spam folder.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                >
                  ← Back to Login
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                  <p className="mt-2 text-slate-400 text-sm">
                    Enter your email and we'll send a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/15 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                      />
                    </div>
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
                    className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <><Loader2 size={18} className="animate-spin" /> Sending…</>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm">
                  <Link to="/login" className="text-slate-500 hover:text-slate-400 transition-colors">
                    ← Back to Login
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
