import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, Users, Eye, Handshake, ArrowRight } from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

const values = [
  {
    icon: Eye,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "hover:border-cyan-500/40",
    title: "Transparency first",
    body: "Every status update, every escalation, every decision is visible to the person who filed the report. No black boxes.",
  },
  {
    icon: Handshake,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    border: "hover:border-purple-500/40",
    title: "Accountability that sticks",
    body: "Issues are assigned, tracked, and time-bound. When a deadline slips, the system flags it — automatically.",
  },
  {
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "hover:border-blue-500/40",
    title: "Community over politics",
    body: "We're not partisan. A broken streetlight is a broken streetlight. We're here to help fix it, not to score points.",
  },
];

const AboutPage = () => {
  const { settings } = useSiteSettings();
  return (
    <div className="w-full min-h-screen bg-black text-white">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div {...fade(0)}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 mb-6">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              About {settings.site_name}
            </div>
          </motion.div>

          <motion.h1
            {...fade(0.1)}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Built because{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-400 via-blue-400 to-purple-500">
              complaints shouldn't disappear
            </span>
          </motion.h1>

          <motion.p
            {...fade(0.2)}
            className="text-lg text-slate-300 leading-relaxed"
          >
            Most civic reporting ends the same way — you file something, get an
            automated reply, and never hear back. {settings.site_name} exists to change
            that. Real assignments, real deadlines, real follow-through.
          </motion.p>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div {...fade(0)} className="space-y-5">
            <span className="text-cyan-400 font-semibold uppercase tracking-widest text-xs">
              Why we built this
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-snug">
              Civic infrastructure runs on people noticing things
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Potholes, broken streetlights, overflowing drains — these problems
              are visible to thousands of people every day. The hard part has
              never been identifying them. It's making sure the right person
              actually gets told, has a deadline, and is held to it.
            </p>
            <p className="text-slate-300 leading-relaxed">
              We built {settings.site_name} as a layer between citizens and local
              authorities — not to replace existing governance, but to give it
              memory. Issues get assigned, prioritised by AI, and automatically
              escalated if nothing moves. NGOs can step in on cases that fall
              through the cracks.
            </p>
          </motion.div>

          <motion.div {...fade(0.15)} className="space-y-4">
            {[
              { num: "5", label: "Roles in the workflow", sub: "Citizen → Authority → NGO → Admin → Super Admin" },
              { num: "AI", label: "Priority scoring on every report", sub: "NLP + image analysis, 0–10 weighted formula" },
              { num: "SLA", label: "Auto-escalation when deadlines slip", sub: "Celery beat tasks check every hour" },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-5"
              >
                <div className="text-2xl font-bold text-cyan-400 w-10 shrink-0">
                  {item.num}
                </div>
                <div>
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-slate-300 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05),transparent_70%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div {...fade(0)} className="text-center mb-14">
            <span className="text-cyan-400 font-semibold uppercase tracking-widest text-xs">
              What we stand for
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Three things we don't compromise on
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.1)}
                className={`p-7 rounded-3xl bg-slate-900/70 border border-white/15 ${v.border} transition-colors`}
              >
                <div className={`w-11 h-11 rounded-2xl ${v.bg} flex items-center justify-center mb-5`}>
                  <v.icon className={`w-5 h-5 ${v.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-3">{v.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who is it for ────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade(0)} className="text-center mb-12">
            <span className="text-purple-400 font-semibold uppercase tracking-widest text-xs">
              Who uses {settings.site_name}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Everyone in the loop, all at once
            </h2>
          </motion.div>

          <div className="space-y-3">
            {[
              {
                role: "Citizens",
                desc: "Report issues from their phone, attach a photo, watch the status update in real time. No phone trees, no guessing.",
                accent: "bg-cyan-500",
              },
              {
                role: "Authorities",
                desc: "Get a queue of verified reports with AI priority scores. Accept assignments, update status, and close resolved tickets.",
                accent: "bg-amber-500",
              },
              {
                role: "NGO / CSR teams",
                desc: "Pick up escalated cases that authorities can't resolve alone. Log assistance, coordinate on the ground.",
                accent: "bg-emerald-500",
              },
              {
                role: "Admins",
                desc: "See the full picture — assignment health, resolution rates, category trends — and configure escalation rules.",
                accent: "bg-purple-500",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.08)}
                className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className={`w-1.5 self-stretch rounded-full ${item.accent} shrink-0`} />
                <div>
                  <p className="font-semibold text-white">{item.role}</p>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <motion.div
          {...fade(0)}
          className="max-w-2xl mx-auto text-center p-12 rounded-3xl bg-white/5 border border-white/10"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to report something?</h2>
          <p className="text-slate-300 mb-8">
            Create an account in under a minute. No app download needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold bg-linear-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_24px_rgba(6,182,212,0.35)] transition-shadow"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold border border-white/15 text-slate-300 hover:border-white/30 hover:text-white transition-colors"
            >
              Talk to us
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
};

export default AboutPage;
