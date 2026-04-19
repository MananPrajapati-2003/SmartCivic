import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mail,
  MapPin,
  Phone,
  ChevronDown,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axiosInstance";
import { useSiteSettings } from "../context/SiteSettingsContext";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

const faqs = [
  {
    q: "How long does it take for a report to be assigned?",
    a: "Once submitted and verified, reports are typically assigned to a local authority within 24 hours. High-priority issues (AI score 8+) are flagged immediately.",
  },
  {
    q: "What happens if my issue isn't resolved?",
    a: "If a report passes its SLA deadline without resolution, it's automatically escalated — first to a senior authority, then to NGO/CSR teams if needed. You'll be notified at each stage.",
  },
  {
    q: "Can I report anonymously?",
    a: "Not currently. We require an account so we can send you status updates and prevent spam. Your contact details are never shared with the public.",
  },
  {
    q: "I'm an NGO — how do we get listed on the platform?",
    a: "Register an account and select 'NGO / CSR' as your type. Your organisation goes through a quick approval process before you can accept cases.",
  },
  {
    q: "Is SmartCivic free to use?",
    a: "Yes, completely free for citizens and NGOs. Local authorities access it through their municipality's licence.",
  },
];

const ContactPage = () => {
  const { settings } = useSiteSettings();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr("");
    setSending(true);
    try {
      await api.post("/auth/contact/", {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        message: form.subject
          ? `[${form.subject}]\n\n${form.message}`
          : form.message,
      });
      setSent(true);
    } catch (err) {
      const d = err?.response?.data;
      setServerErr(
        d?.detail || d?.message ||
        (typeof d === "object" && d ? Object.values(d).flat()[0] : null) ||
        "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white">

      {/* ── Page header ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <motion.div {...fade(0)}>
            <span className="text-cyan-400 font-semibold uppercase tracking-widest text-xs">
              Get in touch
            </span>
          </motion.div>
          <motion.h1
            {...fade(0.1)}
            className="text-5xl md:text-6xl font-bold tracking-tight mt-4 mb-5"
          >
            We actually{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-purple-500">
              read these
            </span>
          </motion.h1>
          <motion.p {...fade(0.2)} className="text-slate-400 text-lg leading-relaxed">
            Questions, partnership enquiries, bug reports — send it over. We aim
            to reply within one business day.
          </motion.p>
        </div>
      </section>

      {/* ── Contact cards + Form ─────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16">

          {/* Left — contact info */}
          <motion.div
            {...fade(0)}
            className="w-full md:w-2/5 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Contact details</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Prefer not to use a form? Reach us directly through any of
                these channels.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Mail,
                  label: "Email",
                  value: settings.support_email,
                  sub: "For general queries and partnerships",
                },
                {
                  icon: Phone,
                  label: "Phone",
                  value: "+91 98765 43210",
                  sub: "Mon – Fri, 9 am – 6 pm IST",
                },
                {
                  icon: MapPin,
                  label: "Address",
                  value: "AIMDek Technologies, Ahmedabad, Gujarat",
                  sub: "India",
                },
              ].map(({ icon: Icon, label, value, sub }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="p-2.5 bg-cyan-500/15 rounded-xl text-cyan-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-white">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Response time note */}
            <div className="p-4 rounded-2xl bg-cyan-500/8 border border-cyan-500/20">
              <p className="text-sm text-cyan-300 leading-relaxed">
                <span className="font-semibold">Typical response time:</span>{" "}
                under 24 hours on weekdays. Longer on weekends but we do check.
              </p>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div {...fade(0.15)} className="w-full md:w-3/5">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-white/5 border border-white/10 gap-5"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Message sent</h3>
                  <p className="text-slate-400 leading-relaxed max-w-sm">
                    Thanks for reaching out. We'll get back to you at{" "}
                    <span className="text-white font-medium">{form.email}</span>{" "}
                    within one business day.
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setServerErr("");
                      setForm({ firstName: "", lastName: "", email: "", subject: "", message: "" });
                    }}
                    className="mt-2 text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="p-8 md:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium ml-1 uppercase tracking-wide">
                        First name
                      </label>
                      <input
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Riya"
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium ml-1 uppercase tracking-wide">
                        Last name
                      </label>
                      <input
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Sharma"
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium ml-1 uppercase tracking-wide">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="riya@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium ml-1 uppercase tracking-wide">
                      Subject
                    </label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      placeholder="Partnership / Bug report / General question"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium ml-1 uppercase tracking-wide">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us what's on your mind..."
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600 resize-none text-sm"
                    />
                  </div>

                  {serverErr && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {serverErr}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:shadow-[0_0_22px_rgba(6,182,212,0.35)] disabled:opacity-60 transition-shadow flex items-center justify-center gap-2 group"
                  >
                    {sending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <>Send message <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade(0)} className="text-center mb-12">
            <span className="text-purple-400 font-semibold uppercase tracking-widest text-xs">
              Common questions
            </span>
            <h2 className="text-3xl font-bold mt-3">
              Things people usually ask
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((item, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.07)}
                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-sm text-white">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                    >
                      <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default ContactPage;
