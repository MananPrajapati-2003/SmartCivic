import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthInput } from "../../components/auth/AuthInput";

export const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Invalid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // BACKEND READY PAYLOAD
    // Best Practice: Send only credentials. Backend returns Role.
    const payload = {
      email: form.email,
      password: form.password,
    };

    console.log("LOGIN PAYLOAD", payload);
    // Simulate Backend Response
    console.log("Simulated Response: { token: '...', user: { role: 'citizen' } }");

    // Clear form
    setForm({
      email: "",
      password: "",
    });
    alert("Login Successful (Simulated)");
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Login to SmartCivic">
      <div className="space-y-4">

        <AuthInput
          icon={Mail}
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
          onClick={handleSubmit}
          className="w-full py-2 rounded-lg bg-linear-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90"
        >
          Login
        </button>
      </div>
    </AuthLayout>
  );
};
