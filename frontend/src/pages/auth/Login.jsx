import { useState } from "react";
import { Mail, Lock, AlertCircle, Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to role-appropriate dashboard after login
  const from = location.state?.from?.pathname || "/me";

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Invalid email address";
    if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    setUnverifiedEmail(null);

    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      // Handle email not verified (403)
      if (err?.response?.status === 403 && data?.code === "email_not_verified") {
        setUnverifiedEmail(data.email || form.email);
      } else {
        const msg = data?.detail ||
          (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
          "Invalid email or password.";
        setErrors({ api: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to SmartCivic">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email not verified banner */}
        <AnimatePresence>
          {unverifiedEmail && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
            >
              <div className="flex items-center gap-2 font-medium">
                <MailCheck size={16} className="shrink-0 text-amber-400" />
                Email not verified yet
              </div>
              <p className="text-amber-400/80 text-xs">
                Check <span className="font-semibold text-amber-300">{unverifiedEmail}</span> for your OTP.
              </p>
              <Link
                to="/verify-email"
                state={{ email: unverifiedEmail }}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline underline-offset-2"
              >
                Enter OTP → Verify now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API-level error */}
        {errors.api && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errors.api}</span>
          </div>
        )}

        <AuthInput
          icon={Mail}
          type="email"
          placeholder="Email address"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <AuthInput
          icon={Lock}
          type="password"
          placeholder="Password"
          value={form.password}
          error={errors.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {/* Forgot password link */}
        <div className="text-right -mt-1">
          <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 size={18} className="animate-spin" /> Logging in…</>
          ) : (
            "Login"
          )}
        </button>

        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
