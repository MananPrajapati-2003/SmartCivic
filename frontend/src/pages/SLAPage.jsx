import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, AlertTriangle, Zap, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/axiosInstance";

// ── Static SLA data (shown when no CMS blocks exist for this page) ────────────
const STATIC_SLA = [
  {
    category: "Roads & Potholes",
    icon: "🛣️",
    critical: "6h",
    high: "24h",
    medium: "72h",
    low: "7d",
    routed: "Government / PWD",
  },
  {
    category: "Sanitation & Garbage",
    icon: "🗑️",
    critical: "6h",
    high: "12h",
    medium: "48h",
    low: "5d",
    routed: "Government / Municipal",
  },
  {
    category: "Water Supply",
    icon: "💧",
    critical: "4h",
    high: "12h",
    medium: "48h",
    low: "5d",
    routed: "Government / Water Dept",
  },
  {
    category: "Environment & Trees",
    icon: "🌳",
    critical: "12h",
    high: "48h",
    medium: "7d",
    low: "14d",
    routed: "NGO / Environment Cell",
  },
  {
    category: "Road & Infrastructure",
    icon: "🏗️",
    critical: "6h",
    high: "24h",
    medium: "72h",
    low: "7d",
    routed: "Government / PWD",
  },
  {
    category: "Public Safety",
    icon: "🚨",
    critical: "2h",
    high: "6h",
    medium: "24h",
    low: "3d",
    routed: "Government / Police / Safety",
  },
];

const SEVERITY_COLORS = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium:   "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

function SLAPill({ time, severity }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[severity]}`}>
      <Clock size={10} /> {time}
    </span>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/15 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-white font-medium text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-slate-300 text-sm leading-relaxed border-t border-white/10">
          {a}
        </div>
      )}
    </div>
  );
}

// ── CMS block renderer ────────────────────────────────────────────────────────
function CmsBlock({ block }) {
  const { block_type, content } = block;

  if (block_type === "heading") {
    const Tag = content.level === 2 ? "h2" : content.level === 3 ? "h3" : "h4";
    return <Tag className="text-white font-bold text-xl mb-2">{content.text}</Tag>;
  }
  if (block_type === "text") {
    return <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{content.text}</p>;
  }
  if (block_type === "card") {
    return (
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
        {content.title && <p className="text-white font-semibold mb-1">{content.title}</p>}
        {content.body  && <p className="text-slate-400 text-sm leading-relaxed">{content.body}</p>}
      </div>
    );
  }
  if (block_type === "image") {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <img src={content.url} alt={content.alt || ""} className="w-full object-cover" />
        {content.caption && <p className="text-slate-500 text-xs text-center py-2">{content.caption}</p>}
      </div>
    );
  }
  if (block_type === "dropdown") {
    return (
      <div className="space-y-2">
        {(content.items || []).map((item, i) => (
          <FAQItem key={i} q={item.question} a={item.answer} />
        ))}
      </div>
    );
  }
  if (block_type === "checkbox") {
    return (
      <ul className="space-y-2">
        {(content.items || []).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
            <ShieldCheck size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    );
  }
  if (block_type === "divider") {
    return <hr className="border-white/10 my-2" />;
  }
  if (block_type === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              {(content.headers || []).map((h, i) => (
                <th key={i} className="text-slate-300 font-semibold px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(content.rows || []).map((row, i) => (
              <tr key={i} className="border-t border-white/6 hover:bg-white/3">
                {row.map((cell, j) => (
                  <td key={j} className="text-slate-400 px-4 py-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

const STATIC_FAQS = [
  {
    q: "What happens if my issue is not resolved within the SLA?",
    a: "The issue is automatically escalated to the next authority level. You will be notified via email and in-app notification. Escalated issues receive a 🚨 badge on your dashboard.",
  },
  {
    q: "Who decides the urgency level?",
    a: "Our AI engine (ResNet50 visual model + NLP) analyses your photo and description to assign urgency. You can override it with your own severity assessment on the submission form.",
  },
  {
    q: "What is the difference between Government and NGO routing?",
    a: "Government routing goes to the relevant municipal department (PWD, water, sanitation). NGO routing is used for environmental or community issues where civil society partners can respond faster.",
  },
  {
    q: "Can I track the SLA timer for my issue?",
    a: "Yes — open your issue detail page and the AI Analysis card shows the SLA deadline and current status.",
  },
];

// ── Main SLA Page ─────────────────────────────────────────────────────────────
export default function SLAPage() {
  const [cmsBlocks, setCmsBlocks] = useState([]);
  const [cmsLoaded, setCmsLoaded] = useState(false);

  useEffect(() => {
    // Try to load CMS content for the "sla" page
    fetch("/api/cms/pages/sla/")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.blocks?.length) setCmsBlocks(data.blocks.filter(b => b.is_visible));
      })
      .catch(() => {})
      .finally(() => setCmsLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-transparent to-violet-500/8 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Service Level Agreements</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Response Time Commitments
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Every civic issue submitted through this platform is assigned an AI-determined urgency level with a guaranteed response window.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-14 space-y-16">

        {/* CMS blocks (if any) */}
        {cmsLoaded && cmsBlocks.length > 0 && (
          <section className="space-y-6">
            {cmsBlocks.map(block => (
              <CmsBlock key={block.id} block={block} />
            ))}
          </section>
        )}

        {/* How it works */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap size={20} className="text-cyan-400" /> How SLA Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "01", title: "AI Assigns Urgency", desc: "Visual + NLP analysis classifies your issue and sets the urgency level automatically.", color: "cyan" },
              { step: "02", title: "SLA Clock Starts",   desc: "From the moment your issue is verified, the resolution timer begins.", color: "violet" },
              { step: "03", title: "Auto-Escalation",    desc: "If unresolved within the SLA window, the issue escalates to the next authority tier.", color: "rose" },
            ].map(item => (
              <div key={item.step} className="bg-slate-900/70 border border-white/15 rounded-2xl p-5">
                <div className={`text-3xl font-black mb-3 bg-gradient-to-r ${
                  item.color === "cyan" ? "from-cyan-400 to-blue-400" :
                  item.color === "violet" ? "from-violet-400 to-purple-400" :
                  "from-rose-400 to-pink-400"
                } bg-clip-text text-transparent`}>{item.step}</div>
                <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* SLA table */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Clock size={20} className="text-amber-400" /> Response Windows by Category
          </h2>
          <p className="text-slate-300 text-sm mb-6">Times shown are maximum response deadlines from issue verification.</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-5">
            {Object.entries({ critical: "Critical", high: "High", medium: "Medium", low: "Low" }).map(([k, v]) => (
              <span key={k} className={`text-xs px-3 py-1 rounded-full border font-medium ${SEVERITY_COLORS[k]}`}>{v}</span>
            ))}
          </div>

          <div className="space-y-3">
            {STATIC_SLA.map((row, i) => (
              <motion.div key={row.category}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-slate-900/70 border border-white/15 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-2xl">{row.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{row.category}</p>
                    <p className="text-slate-300 text-xs">Routed to: {row.routed}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-slate-400 text-[10px] mb-1 uppercase tracking-wide">Critical</p>
                    <SLAPill time={row.critical} severity="critical" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-[10px] mb-1 uppercase tracking-wide">High</p>
                    <SLAPill time={row.high} severity="high" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-[10px] mb-1 uppercase tracking-wide">Medium</p>
                    <SLAPill time={row.medium} severity="medium" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-[10px] mb-1 uppercase tracking-wide">Low</p>
                    <SLAPill time={row.low} severity="low" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Escalation notice */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex gap-4">
          <AlertTriangle size={22} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold mb-1">Escalation Policy</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Issues not resolved within the SLA window are automatically escalated. Critical issues go directly to the department head. Repeated SLA breaches for the same category trigger a platform-level review and are flagged to city administrators.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {STATIC_FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </motion.section>

      </div>
    </div>
  );
}
