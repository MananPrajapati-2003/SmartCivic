import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Phone, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import api from "../../api/axiosInstance";

const inputCls =
  "w-full px-4 py-3.5 rounded-xl bg-slate-900/70 border border-white/15 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-slate-500 disabled:opacity-50 text-base";

const ContactSection = () => {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Enter a valid email";
    if (form.message.trim().length < 10) e.message = "At least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr("");
    if (!validate()) return;
    setSending(true);
    try {
      await api.post("/auth/contact/", form);
      setSent(true);
      setForm({ first_name: "", last_name: "", email: "", message: "" });
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === "object") {
        // Field-level errors from backend
        setErrors(d);
      } else {
        setServerErr("Failed to send message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="w-full py-24 text-white relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row gap-20">
        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 space-y-8"
        >
          <div>
            <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm">
              Get in Touch
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mt-2 mb-6">Connect With Us</h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              Have questions or suggestions? We'd love to hear from you. Reach
              out to us and let's build a smarter city together.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">Email Us</h4>
                <a href="mailto:smart.civicissue@gmail.com" className="text-slate-300 hover:text-cyan-400 transition-colors">
                  smart.civicissue@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">Call Us</h4>
                <p className="text-slate-300">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">Visit Us</h4>
                <p className="text-slate-300">123 Smart City Avenue, Tech District</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="w-full md:w-1/2"
        >
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center p-10 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md shadow-2xl text-center gap-5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-slate-300">
                  Thanks for reaching out. We've also sent a confirmation to your email.
                  Our team will get back to you within 1–2 business days.
                </p>
              </div>
              <button
                onClick={() => setSent(false)}
                className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="p-8 md:p-10 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md shadow-2xl space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm text-slate-300 font-medium ml-1">First Name *</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={set("first_name")}
                    placeholder="John"
                    disabled={sending}
                    className={inputCls + (errors.first_name ? " border-red-500/60" : "")}
                  />
                  {errors.first_name && <p className="text-red-400 text-xs ml-1">{errors.first_name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-slate-300 font-medium ml-1">Last Name</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={set("last_name")}
                    placeholder="Doe"
                    disabled={sending}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-300 font-medium ml-1">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="john@example.com"
                  disabled={sending}
                  className={inputCls + (errors.email ? " border-red-500/60" : "")}
                />
                {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-300 font-medium ml-1">Message *</label>
                <textarea
                  rows="4"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="How can we help you?"
                  disabled={sending}
                  className={inputCls + " resize-none" + (errors.message ? " border-red-500/60" : "")}
                />
                {errors.message && <p className="text-red-400 text-xs ml-1">{errors.message}</p>}
              </div>

              {serverErr && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {serverErr}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-60 transition-all flex items-center justify-center gap-2 group"
              >
                {sending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
                ) : (
                  <>Send Message <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
