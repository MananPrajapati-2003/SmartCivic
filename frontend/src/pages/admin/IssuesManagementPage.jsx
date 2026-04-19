/**
 * Admin Issues Management Page
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bot, AlertTriangle, CheckCircle, Clock,
  Users, ChevronDown, X, RefreshCw, Zap, MapPin,
  User, Calendar, ShieldCheck, TrendingUp, BarChart3,
  Flame, Tag, Building2
} from "lucide-react";
import api from "../../api/axiosInstance";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending_verification: { label: "Pending Review", color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/40"   },
  verified:             { label: "Verified",        color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/40"     },
  assigned:             { label: "Assigned",        color: "text-indigo-400",  bg: "bg-indigo-500/15 border-indigo-500/40" },
  in_progress:          { label: "In Progress",     color: "text-cyan-400",    bg: "bg-cyan-500/15 border-cyan-500/40"     },
  escalated:            { label: "Escalated",       color: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/40" },
  resolved:             { label: "Resolved",        color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40"},
  closed:               { label: "Closed",          color: "text-slate-400",   bg: "bg-slate-500/15 border-slate-500/40"  },
  rejected:             { label: "Rejected",        color: "text-red-400",     bg: "bg-red-500/15 border-red-500/40"      },
  fake:                 { label: "Fake",            color: "text-rose-400",    bg: "bg-rose-500/15 border-rose-500/40"    },
};

const SEV_COLOR = {
  critical: "text-red-400 bg-red-500/15 border-red-500/40",
  high:     "text-orange-400 bg-orange-500/15 border-orange-500/40",
  medium:   "text-amber-400 bg-amber-500/15 border-amber-500/40",
  low:      "text-emerald-400 bg-emerald-500/15 border-emerald-500/40",
};

const PRIORITY_COLOR = (score) => {
  if (score >= 8) return { text: "text-red-400",     bg: "bg-red-500/15 border-red-500/40",       ring: "ring-red-500/30",    label: "Critical" };
  if (score >= 6) return { text: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/40", ring: "ring-orange-500/30", label: "High"     };
  if (score >= 4) return { text: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/40",   ring: "ring-amber-500/30",  label: "Medium"   };
  return           { text: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40", ring: "ring-emerald-500/30",label: "Low"      };
};

const SLA_DEFAULTS = { critical: 6, high: 24, medium: 48, low: 72 };

// ── Assign Modal ───────────────────────────────────────────────────────────────

function AssignModal({ issue, authorityUsers, onClose, onAssigned }) {
  const [assignedTo, setAssignedTo] = useState("");
  const [slaHours, setSlaHours]     = useState(issue.ai_sla_hours || SLA_DEFAULTS[issue.severity] || 72);
  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  const pc = issue.ai_priority_score ? PRIORITY_COLOR(issue.ai_priority_score) : null;

  const handleAssign = async () => {
    if (!assignedTo) { setErr("Please select an authority user."); return; }
    setBusy(true); setErr("");
    try {
      await api.post(`/issues/${issue.id}/assign/`, { assigned_to_id: assignedTo, sla_hours: slaHours, note });
      onAssigned(issue.id, assignedTo);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Assignment failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        className="relative bg-[#0d1526] border border-white/15 rounded-3xl p-7 w-full max-w-md shadow-2xl shadow-black/70 z-10"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-xl">Assign to Authority</h2>
            <p className="text-slate-400 text-sm mt-1 line-clamp-1">{issue.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {pc && (
          <div className={`mb-6 rounded-2xl border px-4 py-3.5 ${pc.bg}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">AI Analysis</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`font-bold text-sm ${pc.text}`}>🎯 {issue.ai_priority_score}/10 — {pc.label}</span>
              {issue.ai_routing && (
                <span className="text-slate-300">{issue.ai_routing === "government" ? "🏛 Government" : "🤝 NGO"}</span>
              )}
              {issue.ai_urgency && (
                <span className="text-slate-400 capitalize">⚡ {issue.ai_urgency} urgency</span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign To</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/60 [&>option]:bg-[#0d1526]"
            >
              <option value="">Select authority user…</option>
              {authorityUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              SLA Hours
              {issue.ai_sla_hours && (
                <span className="ml-2 text-cyan-400 font-normal normal-case">(AI: {issue.ai_sla_hours}h)</span>
              )}
            </label>
            <input
              type="number" min="1" max="720"
              value={slaHours}
              onChange={e => setSlaHours(Number(e.target.value))}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note (optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Instructions for the authority team…"
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/60 resize-none placeholder-slate-500"
            />
          </div>
        </div>

        {err && (
          <p className="mt-3 text-red-400 text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle size={14} /> {err}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/15 text-slate-300 hover:text-white hover:border-white/25 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={busy}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30">
            {busy ? <><RefreshCw size={14} className="animate-spin" /> Assigning…</> : <><ShieldCheck size={14} /> Assign Issue</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── AI Detail Panel ────────────────────────────────────────────────────────────

function AIDetailPanel({ issue }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (issue.ai_status === "done") {
      api.get(`/ai/status/${issue.id}/`)
        .then(r => setData(r.data.ai_result))
        .catch(() => {});
    }
  }, [issue.id, issue.ai_status]);

  if (issue.ai_status === "pending" || issue.ai_status === "processing") {
    return (
      <div className="flex items-center gap-2 text-cyan-400 text-sm py-3">
        <RefreshCw size={14} className="animate-spin" /> AI analysis in progress…
      </div>
    );
  }
  if (issue.ai_status === "failed") {
    return <p className="text-red-400 text-sm py-3">⚠ AI analysis failed</p>;
  }
  if (!data) return <p className="text-slate-500 text-sm py-3">Loading AI data…</p>;

  const pc = PRIORITY_COLOR(data.priority_score);

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Analysis Results</p>

      {/* Score tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "Priority Score", value: `${data.priority_score}/10`, highlight: pc.text,           bg: pc.bg },
          { label: "NLP Score",      value: `${data.nlp_score}/10`,      highlight: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30"   },
          { label: "Visual Score",   value: data.visual_score != null ? `${data.visual_score}/10` : "N/A", highlight: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
          { label: "SLA",            value: `${data.sla_hours}h`,         highlight: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-3 py-2.5 text-center ${s.bg}`}>
            <p className={`text-base font-bold ${s.highlight}`}>{s.value}</p>
            <p className="text-slate-400 text-[11px] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${pc.bg} ${pc.text}`}>
          🎯 {pc.label} Priority
        </span>
        <span className="px-3 py-1.5 rounded-full border border-white/15 text-slate-200 bg-white/5 text-xs capitalize">
          ⚡ {data.urgency_level} Urgency
        </span>
        <span className="px-3 py-1.5 rounded-full border border-white/15 text-slate-200 bg-white/5 text-xs capitalize">
          {data.sentiment === "negative" ? "😡" : data.sentiment === "positive" ? "😊" : "😐"} {data.sentiment}
        </span>
        <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
          data.routing_target === "government"
            ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
            : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
        }`}>
          {data.routing_target === "government" ? "🏛 Government" : "🤝 NGO/CSR"}
        </span>
        {data.alert_admin && (
          <span className="px-3 py-1.5 rounded-full border border-red-500/40 text-red-300 bg-red-500/10 text-xs font-semibold">
            🚨 Admin Alerted
          </span>
        )}
      </div>

      {/* NLP summary */}
      {data.nlp_summary && (
        <p className="text-slate-300 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-3 italic leading-relaxed">
          "{data.nlp_summary}"
        </p>
      )}

      {data.damage_type && (
        <p className="text-slate-400 text-xs">
          <span className="text-slate-300 font-medium">Image: </span>
          {data.damage_type}
          {data.image_confidence != null && ` (${(data.image_confidence * 100).toFixed(0)}% confidence)`}
          {data.is_fake_likely && <span className="ml-2 text-red-400 font-semibold">⚠ Possibly Fake</span>}
        </p>
      )}
    </div>
  );
}

// ── Issue Card ─────────────────────────────────────────────────────────────────

function IssueCard({ issue, authorityUsers, onAssigned }) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const st  = STATUS_CFG[issue.status] || STATUS_CFG.pending_verification;
  const sev = SEV_COLOR[issue.severity] || SEV_COLOR.medium;
  const pc  = issue.ai_priority_score != null ? PRIORITY_COLOR(issue.ai_priority_score) : null;
  const canAssign = ["pending_verification", "verified", "assigned"].includes(issue.status);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="group bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/30"
      >
        {/* Card header with priority accent */}
        <div className={`h-1 w-full ${pc ? (pc.label === "Critical" ? "bg-gradient-to-r from-red-500 to-rose-600" : pc.label === "High" ? "bg-gradient-to-r from-orange-500 to-amber-500" : pc.label === "Medium" ? "bg-gradient-to-r from-amber-400 to-yellow-500" : "bg-gradient-to-r from-emerald-500 to-teal-500") : "bg-gradient-to-r from-slate-700 to-slate-600"}`} />

        <div className="p-5">
          {/* Title row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Priority badge */}
            {pc ? (
              <div className={`shrink-0 min-w-[52px] text-center rounded-xl border-2 px-2.5 py-2 ${pc.bg} ring-2 ${pc.ring}`}>
                <p className={`text-lg font-black leading-none ${pc.text}`}>{issue.ai_priority_score}</p>
                <p className={`text-[9px] font-bold mt-0.5 opacity-70 ${pc.text}`}>/10</p>
              </div>
            ) : issue.ai_status === "pending" ? (
              <div className="shrink-0 min-w-[52px] rounded-xl border border-cyan-500/30 bg-cyan-500/8 px-2.5 py-2 text-center">
                <RefreshCw size={16} className="text-cyan-400 animate-spin mx-auto" />
                <p className="text-[9px] text-cyan-400 mt-1">AI…</p>
              </div>
            ) : null}

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base leading-snug mb-2 line-clamp-2 group-hover:text-cyan-100 transition-colors">
                {issue.title}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color}`}>
                  {st.label}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${sev}`}>
                  {issue.severity}
                </span>
                {issue.ai_routing && (
                  <span className={`text-[11px] px-2.5 py-1 rounded-full border ${
                    issue.ai_routing === "government"
                      ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
                      : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  }`}>
                    {issue.ai_routing === "government" ? "🏛 Govt" : "🤝 NGO"}
                  </span>
                )}
                {issue.is_escalated && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full border border-orange-500/40 text-orange-300 bg-orange-500/10 font-semibold">
                    🔥 Escalated
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
              <MapPin size={11} className="text-slate-500 shrink-0" />
              <span className="truncate">{issue.location_address}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <User size={11} className="text-slate-500 shrink-0" />
              <span className="truncate">{issue.reporter_name}</span>
            </div>
            {issue.category_name && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Tag size={11} className="text-slate-500 shrink-0" />
                <span className="truncate">{issue.category_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto col-start-2 justify-end">
              <Calendar size={11} className="text-slate-500" />
              {new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </div>
          </div>

          {issue.assigned_to_name && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
              <ShieldCheck size={13} className="text-indigo-400 shrink-0" />
              <span className="text-xs text-indigo-300 font-medium">Assigned to {issue.assigned_to_name}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 flex items-center gap-3 border-t border-white/8 bg-black/20">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium"
          >
            <Bot size={13} />
            {expanded ? "Hide" : "Show"} AI Details
            <ChevronDown size={12} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>

          {canAssign && (
            <button
              onClick={() => setShowModal(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/30"
            >
              <Users size={13} />
              {issue.assigned_to_name ? "Re-assign" : "Assign"}
            </button>
          )}
        </div>

        {/* AI detail expansion */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="ai-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 py-5 border-t border-white/8 bg-slate-950/50">
                <AIDetailPanel issue={issue} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <AssignModal
            issue={issue}
            authorityUsers={authorityUsers}
            onClose={() => setShowModal(false)}
            onAssigned={onAssigned}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",         label: "All Issues" },
  { key: "unassigned",  label: "Needs Assignment" },
  { key: "ai_alerts",   label: "AI Alerts" },
  { key: "in_progress", label: "In Progress" },
  { key: "escalated",   label: "Escalated" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function IssuesManagementPage() {
  const [issues, setIssues]             = useState([]);
  const [authorityUsers, setAuthUsers]  = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState("all");
  const [search, setSearch]             = useState("");
  const [severityF, setSeverityF]       = useState("");
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [toast, setToast]               = useState("");

  const PAGE_SIZE = 12;
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
      if (search)    params.set("search", search);
      if (severityF) params.set("severity", severityF);
      if (tab === "escalated")   params.set("escalated", "true");
      if (tab === "in_progress") params.set("status", "in_progress");
      const { data } = await api.get(`/issues/all/?${params}`);
      setIssues(data.results);
      setTotalPages(data.total_pages);
    } finally {
      setLoading(false);
    }
  }, [page, search, severityF, tab]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  useEffect(() => {
    api.get("/auth/admin/authority-users/")
      .then(r => setAuthUsers(r.data))
      .catch(() => {});
  }, []);

  const handleAssigned = (issueId, assignedToId) => {
    const user = authorityUsers.find(u => String(u.id) === String(assignedToId));
    setIssues(prev => prev.map(i =>
      i.id === issueId ? { ...i, status: "assigned", assigned_to_name: user?.full_name || "Authority" } : i
    ));
    showToast(`Issue assigned to ${user?.full_name || "authority"}`);
  };

  const displayed = issues.filter(issue => {
    if (tab === "unassigned")  return ["pending_verification", "verified"].includes(issue.status);
    if (tab === "ai_alerts")   return issue.ai_priority_score != null && issue.ai_priority_score >= 8;
    if (tab === "in_progress") return issue.status === "in_progress";
    if (tab === "escalated")   return issue.is_escalated;
    return true;
  });

  const alertCount      = issues.filter(i => i.ai_priority_score >= 8).length;
  const unassignedCount = issues.filter(i => ["pending_verification","verified"].includes(i.status)).length;
  const inProgressCount = issues.filter(i => i.status === "in_progress").length;
  const escalatedCount  = issues.filter(i => i.is_escalated).length;

  const kpis = [
    { icon: Bot,        label: "AI Alerts",   value: alertCount,      color: "text-red-400",    bg: "from-red-500/10 to-red-500/5",     border: "border-red-500/25",    glow: "shadow-red-900/20"    },
    { icon: Users,      label: "Unassigned",  value: unassignedCount, color: "text-amber-400",  bg: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/25",  glow: "shadow-amber-900/20"  },
    { icon: Zap,        label: "In Progress", value: inProgressCount, color: "text-cyan-400",   bg: "from-cyan-500/10 to-cyan-500/5",   border: "border-cyan-500/25",   glow: "shadow-cyan-900/20"   },
    { icon: TrendingUp, label: "Escalated",   value: escalatedCount,  color: "text-orange-400", bg: "from-orange-500/10 to-orange-500/5", border: "border-orange-500/25", glow: "shadow-orange-900/20" },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                <BarChart3 size={20} className="text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Issues Management</h1>
            </div>
            <p className="text-slate-400 text-sm pl-1">Review AI-analysed civic issues and assign them to authority teams.</p>
          </div>
          <button onClick={fetchIssues}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:text-white hover:border-white/25 text-sm font-medium transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label}
              className={`rounded-2xl border bg-gradient-to-br ${k.bg} ${k.border} p-4 flex items-center gap-4 shadow-lg ${k.glow}`}>
              <div className={`p-3 rounded-xl bg-black/20 border ${k.border}`}>
                <k.icon size={18} className={k.color} />
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${k.color}`}>{k.value}</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-slate-900/60 border border-white/12 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="Search by title or location…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="bg-slate-900/60 border border-white/12 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500/50 [&>option]:bg-[#0d1526] transition-colors"
            value={severityF}
            onChange={e => { setSeverityF(e.target.value); setPage(1); }}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-white/8">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-cyan-600/20 text-cyan-300 border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}>
              {t.key === "ai_alerts" && <Bot size={13} />}
              {t.key === "escalated" && <Flame size={13} />}
              {t.label}
              {t.key === "ai_alerts" && alertCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alertCount}</span>
              )}
              {t.key === "unassigned" && unassignedCount > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unassignedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={28} className="text-cyan-500 animate-spin" />
              <p className="text-slate-500 text-sm">Loading issues…</p>
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Bot size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-base font-medium">No issues found</p>
            <p className="text-slate-600 text-sm mt-1">Try changing your filter or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {displayed.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                authorityUsers={authorityUsers}
                onAssigned={handleAssigned}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-5 py-2.5 rounded-xl border border-white/12 bg-white/5 text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-40 text-sm font-medium transition-colors">
              ← Previous
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/12">
              <span className="text-slate-400 text-sm">Page</span>
              <span className="text-white font-bold text-sm">{page}</span>
              <span className="text-slate-500 text-sm">of {totalPages}</span>
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-5 py-2.5 rounded-xl border border-white/12 bg-white/5 text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-40 text-sm font-medium transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold z-50 flex items-center gap-2"
          >
            <CheckCircle size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
