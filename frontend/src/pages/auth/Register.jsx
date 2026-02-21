import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Upload, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

/* ─── Reusable Input ─────────────────────────────────────────────────────── */
const Input = ({ icon, error, ...props }) => (
  <div>
    <div className="flex items-center gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-colors">
      <span className="text-indigo-400 shrink-0">{icon}</span>
      <input
        {...props}
        className="bg-transparent outline-none text-white w-full text-sm placeholder:text-slate-500"
      />
    </div>
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

/* ─── Register Page ──────────────────────────────────────────────────────── */
const Register = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    password: "",
    confirmPassword: "",
    profile_image: null,
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  /* Client-side validation */
  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (form.mobile_number && !/^\d{10}$/.test(form.mobile_number))
      e.mobile_number = "Mobile number must be 10 digits";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setForm((f) => ({ ...f, profile_image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Build FormData for multipart upload (supports profile_image)
    const formData = new FormData();
    formData.append("full_name", form.full_name.trim());
    formData.append("email", form.email.trim().toLowerCase());
    formData.append("password", form.password);
    formData.append("confirm_password", form.confirmPassword);
    if (form.mobile_number) formData.append("mobile_number", form.mobile_number);
    if (form.profile_image) formData.append("profile_image", form.profile_image);

    const result = await register(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2200);
    } else {
      // Map backend field errors → local errors object
      const apiErrors = {};
      Object.entries(result.errors || {}).forEach(([key, val]) => {
        apiErrors[key] = Array.isArray(val) ? val[0] : String(val);
      });
      setErrors(apiErrors);
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center px-8"
        >
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-slate-400">Redirecting you to login…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-linear-to-br from-[#1b1b1b] to-[#0e0e0e] border border-violet-500/20 rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold text-center text-white mb-6">Create Your Account</h2>

        {/* Non-field / general API error */}
        {errors.detail && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errors.detail}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            icon={<User size={18} />}
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            error={errors.full_name}
          />

          <Input
            icon={<Mail size={18} />}
            placeholder="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />

          <Input
            icon={<Phone size={18} />}
            placeholder="Mobile Number (optional, 10 digits)"
            value={form.mobile_number}
            onChange={(e) => setForm((f) => ({ ...f, mobile_number: e.target.value }))}
            error={errors.mobile_number}
            maxLength={10}
            inputMode="numeric"
          />

          {/* Profile image upload */}
          <div>
            <div className="flex items-center gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2 cursor-pointer relative overflow-hidden hover:border-indigo-500 transition-colors">
              <span className="text-indigo-400 shrink-0">
                <Upload size={18} />
              </span>
              <span className="text-slate-400 text-sm truncate">
                {form.profile_image ? form.profile_image.name : "Upload Profile Image (optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <Input
            icon={<Lock size={18} />}
            placeholder="Password (min. 6 characters)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
          />

          <Input
            icon={<Lock size={18} />}
            placeholder="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            error={errors.confirmPassword}
          />

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl font-semibold bg-linear-to-r from-pink-500 via-violet-500 to-indigo-500 text-white shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account…
              </>
            ) : (
              "Register"
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline cursor-pointer">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
