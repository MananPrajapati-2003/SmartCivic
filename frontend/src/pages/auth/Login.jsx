import { useState } from "react";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";

export const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to the page the user was trying to visit before being redirected to /login
  const from = location.state?.from?.pathname || "/";

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

    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrors({ api: result.error });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to SmartCivic">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Logging in…
            </>
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
