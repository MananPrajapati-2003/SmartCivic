/**
 * Admin Issues Management Page
 * ─────────────────────────────
 * Shows all civic issues with AI analysis results.
 * Admin can assign verified issues to specific authority users.
 * Auto-escalation to NGO fires via Celery when SLA is breached.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Bot, AlertTriangle, CheckCircle, Clock,
  Users, ChevronDown, X, RefreshCw, Building2, Handshake,
  Zap, MapPin, User, Calendar, ArrowUpRight, ShieldCheck,
  TrendingUp, BarChart3
} from "lucide-react";
import api from "../../api/axiosInstance";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending_verification: { label: "Pending Review", color: "text-amber-400",  bg: "bg-amber-500/12 border-amber-500/30"  },
  verified:             { label: "Verified",        color: "text-blue-400",   bg: "bg-blue-500/12 border-blue-500/30"    },
  assigned:             { label: "Assigned",         color: "text-indigo-400", bg: "bg-indigo-500/12 border-indigo-500/30"},
  in_progress:          { label: "In Progress",      color: "text-cyan-400",   bg: "bg-cyan-500/12 border-cyan-500/30"   },
  escalated:            { label: "Escalated",        color: "text-orange-400", bg: "bg-orange-500/12 border-orange-500/30"},
  resolved:             { label: "Resolved",         color: "text-emerald-400",bg: "bg-emerald-500/12 border-emerald-500/30"},
  closed:               { label: "Closed",           color: "text-slate-400",  bg: "bg-slate-500/12 border-slate-500/30" },
  rejected:             { label: "Rejected",         color: "text-red-400",    bg: "bg-red-500/12 border-red-500/30"     },
  fake:                 { label: "Fake",             color: "text-rose-400",   bg: "bg-rose-500/12 border-rose-500/30"   },
};

const SEV_COLOR = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium:   "text-amber-400 bg-amber-500/10 border-amber-500/30",
  low:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

const PRIORITY_COLOR = (score) => {
  if (score >= 8)  return { text: "text-red-400",    bg: "bg-red-500/15 border-red-500/40",    label: "Critical" };
  if (score >= 6)  return { text: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/40", label: "High" };
  if (score >= 4)  return { text: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/40",  label: "Medium" };
  return           { text: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40", label: "Low" };
};

const SLA_DEFAULTS = { critical: 6, high: 24, medium: 48, low: 72 };

// ── Assign Modal ───────────────────────────────────────────────────────────────

function AssignModal({ issue, authorityUsers, onClose, onAssigned }) {
  const [assignedTo, setAssignedTo] = useState("");
  const [slaHours, setSlaHours]     = useState(
    issue.ai_sla_hours || SLA_DEFAULTS[issue.severity] || 72
  );
  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  const pc = issue.ai_priority_score ? PRIORITY_COLOR(issue.ai_priority_score) : null;

  const handleAssign = async () => {
    if (!assignedTo) { setErr("Please select an authority user."); return; }
    setBusy(true); setErr("");
    try {
      await api.post(`/issues/${issue.id}/assign/`, {
        assigned_to_id: assignedTo,
        sla_hours:      slaHours,
        note,
      });
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative bg-[#0c1729] border border-white/12 rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-black/60 z-10"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Assign to Authority</h2>
            <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{issue.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* AI Summary */}
        {pc && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 ${pc.bg}`}>
            <p className="text-xs font-semibold text-slate-400 mb-2">AI Analysis</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`font-bold ${pc.text}`}>
                🎯 {issue.ai_priority_score}/10 — {pc.label}
              </span>
              {issue.ai_routing && (
                <span className="text-slate-300">
                  {issue.ai_routing === "government" ? "🏛 Government" : "🤝 NGO"}
                </span>
              )}
              {issue.ai_predicted_category && (
                <span className="text-slate-400">📂 {issue.ai_predicted_category}</span>
              )}
              {issue.ai_urgency && (
                <span className="text-slate-400 capitalize">⚡ {issue.ai_urgency} urgency</span>
              )}
            </div>
          </div>
        )}

        {/* Authority selector */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50 [&>option]:bg-[#0c1729]"
            >
              <option value="">Select authority user…</option>
              {authorityUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              SLA Hours
              {issue.ai_sla_hours && (
                <span className="ml-2 text-cyan-500 font-normal normal-case">
                  (AI recommends {issue.ai_sla_hours}h)
                </span>
              )}
            </label>
            <input
              type="number" min="1" max="720"
              value={slaHours}
              onChange={e => setSlaHours(Number(e.target.value))}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Note (optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Instructions for the authority team…"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-cyan-500/50 resize-none placeholder-slate-600"
            />
          </div>
        </div>

        {err && (
          <p className="mt-3 text-red-400 text-xs flex items-center gap-1.5">
            <AlertTriangle size={12} /> {err}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/12 text-slate-400 hover:text-white text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {busy ? <><RefreshCw size={14} className="animate-spin" /> Assigning…</> : <><ShieldCheck size={14} /> Assign</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── AI Detail Panel (inline expand) ───────────────────────────────────────────

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
      <div className="flex items-center gap-2 text-cyan-400 text-xs py-2">
        <RefreshCw size={12} className="animate-spin" />
        AI analysis in progress…
      </div>
    );
  }
  if (issue.ai_status === "failed") {
    return <p className="text-red-400 text-xs py-2">⚠ AI analysis failed</p>;
  }
  if (!data) return <p className="text-slate-600 text-xs py-2">Loading AI data…</p>;

  const pc = PRIORITY_COLOR(data.priority_score);

  return (
    <div className="mt-3 pt-3 border-t border-white/6 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Analysis Results</p>

      {/* Scores grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Priority Score", value: `${data.priority_score}/10`, highlight: pc.text },
          { label: "NLP Score",      value: `${data.nlp_score}/10`,      highlight: "text-blue-400" },
          { label: "Visual Score",   value: data.visual_score != null ? `${data.visual_score}/10` : "N/A", highlight: "text-purple-400" },
          { label: "SLA",            value: `${data.sla_hours}h`,         highlight: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl px-3 py-2 text-center">
            <p className={`text-sm font-bold ${s.highlight}`}>{s.value}</p>
            <p className="text-slate-600 text-[10px] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* NLP outputs */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`px-2.5 py-1 rounded-full border font-medium ${pc.bg} ${pc.text}`}>
          🎯 {pc.label} Priority
        </span>
        <span className="px-2.5 py-1 rounded-full border border-white/10 text-slate-300 bg-white/3 capitalize">
          ⚡ {data.urgency_level} urgency
        </span>
        <span className="px-2.5 py-1 rounded-full border border-white/10 text-slate-300 bg-white/3 capitalize">
          {data.sentiment === "negative" ? "😡" : data.sentiment === "positive" ? "😊" : "😐"} {data.sentiment}
        </span>
        <span className={`px-2.5 py-1 rounded-full border font-medium ${
          data.routing_target === "government"
            ? "border-blue-500/30 text-blue-300 bg-blue-500/10"
            : "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
        }`}>
          {data.routing_target === "government" ? "🏛 Government" : "🤝 NGO/CSR"}
        </span>
        {data.alert_admin && (
          <span className="px-2.5 py-1 rounded-full border border-red-500/30 text-red-300 bg-red-500/10 font-semibold">
            🚨 Admin Alerted
          </span>
        )}
      </div>

      {/* NLP summary */}
      {data.nlp_summary && (
        <p className="text-slate-400 text-xs bg-white/3 border border-white/8 rounded-xl px-3 py-2 italic">
          "{data.nlp_summary}"
        </p>
      )}

      {/* Image analysis */}
      {data.damage_type && (
        <div className="text-xs text-slate-500">
          <span className="text-slate-400 font-medium">Image: </span>
          {data.damage_type}
          {data.image_confidence != null && ` (${(data.image_confidence * 100).toFixed(0)}% confidence)`}
          {data.is_fake_likely && <span className="ml-2 text-red-400 font-semibold">⚠ Possibly Fake</span>}
        </div>
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

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0c1220] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-colors"
      >
        {/* Top row */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* AI priority badge */}
            {pc && (
              <div className={`shrink-0 text-center rounded-xl border px-2.5 py-1.5 ${pc.bg}`}>
                <p className={`text-sm font-bold leading-none ${pc.text}`}>{issue.ai_priority_score}</p>
                <p className={`text-[9px] mt-0.5 font-medium ${pc.text}`}>/10</p>
              </div>
            )}
            {!pc && issue.ai_status === "pending" && (
              <div className="shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-2.5 py-1.5 text-center">
                <RefreshCw size={14} className="text-cyan-400 animate-spin mx-auto" />
                <p className="text-[9px] text-cyan-400 mt-0.5">AI…</p>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{issue.title}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>
                  {st.label}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${sev}`}>
                  {issue.severity}
                </span>
                {issue.ai_routing && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    issue.ai_routing === "government"
                      ? "border-blue-500/25 text-blue-400 bg-blue-500/8"
                      : "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"
                  }`}>
                    {issue.ai_routing === "government" ? "🏛 Govt" : "🤝 NGO"}
                  </span>
                )}
                {issue.is_escalated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-400 bg-orange-500/8 font-semibold">
                    🔥 Escalated
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={10} />{issue.location_address}</span>
            <span className="flex items-center gap-1"><User size={10} />{issue.reporter_name}</span>
            {issue.category_name && <span className="flex items-center gap-1">📂 {issue.category_name}</span>}
            {issue.assigned_to_name && (
              <span className="flex items-center gap-1 text-indigo-400">
                <ShieldCheck size={10} /> {issue.assigned_to_name}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              <Calendar size={10} />
              {new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 flex items-center gap-2 border-t border-white/6 pt-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Bot size={12} />
            {expanded ? "Hide" : "Show"} AI Details
            <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          <div className="ml-auto flex gap-2">
            {(issue.status === "pending_verification" || issue.status === "verified" || issue.status === "assigned") && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
              >
                <Users size={12} />
                {issue.assigned_to_name ? "Re-assign" : "Assign"}
              </button>
            )}
          </div>
        </div>

        {/* AI detail expansion */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="ai-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/6 px-4 pb-4"
            >
              <AIDetailPanel issue={issue} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Assign modal */}
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

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",         label: "All Issues" },
  { key: "unassigned",  label: "Needs Assignment" },
  { key: "ai_alerts",   label: "🚨 AI Alerts" },
  { key: "in_progress", label: "In Progress" },
  { key: "escalated",   label: "Escalated" },
];

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
      const params = new URLSearchParams({
        page,
        page_size: PAGE_SIZE,
      });
      if (search)   params.set("search", search);
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
      i.id === issueId
        ? { ...i, status: "assigned", assigned_to_name: user?.full_name || "Authority" }
        : i
    ));
    showToast(`Issue assigned to ${user?.full_name || "authority"}`);
  };

  // Client-side tab filtering
  const displayed = issues.filter(issue => {
    if (tab === "unassigned")
      return ["pending_verification", "verified"].includes(issue.status);
    if (tab === "ai_alerts")
      return issue.ai_priority_score != null && issue.ai_priority_score >= 8;
    if (tab === "in_progress")
      return issue.status === "in_progress";
    if (tab === "escalated")
      return issue.is_escalated;
    return true;
  });

  // Summary counts
  const alertCount     = issues.filter(i => i.ai_priority_score >= 8).length;
  const unassignedCount = issues.filter(i => ["pending_verification","verified"].includes(i.status)).length;
  const escalatedCount  = issues.filter(i => i.is_escalated).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={20} className="text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Issues Management</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Review AI-analysed civic issues and assign them to authority teams.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <Bot size={16} />,        label: "AI Alerts",    value: alertCount,      color: "text-red-400",    bg: "bg-red-500/8 border-red-500/20"     },
          { icon: <Users size={16} />,       label: "Unassigned",   value: unassignedCount, color: "text-amber-400",  bg: "bg-amber-500/8 border-amber-500/20"  },
          { icon: <Zap size={16} />,         label: "In Progress",  value: issues.filter(i => i.status === "in_progress").length, color: "text-cyan-400", bg: "bg-cyan-500/8 border-cyan-500/20" },
          { icon: <TrendingUp size={16} />,  label: "Escalated",    value: escalatedCount,  color: "text-orange-400", bg: "bg-orange-500/8 border-orange-500/20"},
        ].map(k => (
          <div key={k.label} className={`rounded-2xl border p-3 flex items-center gap-3 ${k.bg}`}>
            <span className={k.color}>{k.icon}</span>
            <div>
              <p className={`text-lg font-bold leading-none ${k.color}`}>{k.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-[#0c1220] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/40"
            placeholder="Search by title or location…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-[#0c1220] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-cyan-500/40 [&>option]:bg-[#0c1220]"
          value={severityF}
          onChange={e => { setSeverityF(e.target.value); setPage(1); }}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={fetchIssues}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-cyan-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}>
            {t.label}
            {t.key === "ai_alerts" && alertCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">{alertCount}</span>
            )}
            {t.key === "unassigned" && unassignedCount > 0 && (
              <span className="ml-2 bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded-full">{unassignedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Issue grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="text-cyan-500 animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <Bot size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No issues found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 text-sm transition-colors">
            Previous
          </button>
          <span className="text-slate-500 text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white disabled:opacity-40 text-sm transition-colors">
            Next
          </button>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium z-50 flex items-center gap-2"
          >
            <CheckCircle size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
