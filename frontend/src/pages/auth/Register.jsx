import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Upload } from "lucide-react";

/* 🔹 Reusable Input Component */
const Input = ({ icon, error, ...props }) => (
  <div>
    <div
      className="flex items-center gap-2 bg-black border border-indigo-500/30
      rounded-lg px-3 py-2"
    >
      <span className="text-indigo-400">{icon}</span>
      <input
        {...props}
        className="bg-transparent outline-none text-white w-full text-sm"
      />
    </div>
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

const Register = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    password: "",
    confirmPassword: "",
    role: "citizen",
    profile_image: "", // Store file path or dummy URL
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};

    if (!form.full_name.trim()) newErrors.full_name = "Full Name is required";

    if (!form.email.includes("@")) newErrors.email = "Valid email required";

    if (!/^\d{10}$/.test(form.mobile_number))
      newErrors.mobile_number = "Mobile number must be 10 digits";

    if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    // if (!form.profile_image) newErrors.profile_image = "Profile image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload this. For now, we mock the path.
      setForm({ ...form, profile_image: file.name });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Backend integration ready
    const payload = {
      full_name: form.full_name,
      email: form.email,
      mobile_number: form.mobile_number,
      password: form.password,
      role: "citizen",
      profile_image: form.profile_image || "default-avatar.png",
    };

    console.log("REGISTER PAYLOAD 👉", payload);

    // Clear form
    setForm({
      full_name: "",
      email: "",
      mobile_number: "",
      password: "",
      confirmPassword: "",
      role: "citizen",
      profile_image: "",
    });
    alert("Registration Successful!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-linear-to-br from-[#1b1b1b] to-[#0e0e0e]
        border border-violet-500/20 rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          Create Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <Input
            icon={<User />}
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            error={errors.full_name}
          />

          {/* Email */}
          <Input
            icon={<Mail />}
            placeholder="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />

          {/* Mobile Number */}
          <Input
            icon={<Phone />}
            placeholder="Mobile Number"
            value={form.mobile_number}
            onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
            error={errors.mobile_number}
            maxLength={10}
          />

          {/* Profile Image Mock */}
          <div>
            <div className="flex items-center gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2 cursor-pointer relative overflow-hidden">
               <span className="text-indigo-400"><Upload size={20}/></span>
               <span className="text-slate-400 text-sm">
                 {form.profile_image ? form.profile_image : "Upload Profile Image"}
               </span>
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={handleFileChange}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
             {errors.profile_image && <p className="text-red-400 text-xs mt-1">{errors.profile_image}</p>}
          </div>

          {/* Password */}
          <Input
            icon={<Lock />}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />

          {/* Confirm Password */}
          <Input
            icon={<Lock />}
            placeholder="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
          />

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full mt-4 py-3 rounded-xl font-semibold
            bg-linear-to-r from-pink-500 via-violet-500 to-indigo-500
            text-white shadow-lg"
          >
            Register
          </motion.button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-400 hover:underline cursor-pointer">
            Login
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
