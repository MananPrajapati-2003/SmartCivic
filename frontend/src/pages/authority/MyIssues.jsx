import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw, MapPin, Clock, CheckCircle, Upload, Loader2, X,
  AlertTriangle, Flame, ArrowRight, CalendarClock, Tag
} from "lucide-react";
import api from "../../api/axiosInstance";

const STATUS_CONFIG = {
  verified:   { label: "Verified",     color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30" },
  assigned:   { label: "Assigned",     color: "text-indigo-400",  bg: "bg-indigo-500/15 border-indigo-500/30" },
  in_progress:{ label: "In Progress",  color: "text-cyan-400",    bg: "bg-cyan-500/15 border-cyan-500/30" },
  escalated:  { label: "Escalated",    color: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/30" },
  resolved:   { label: "Resolved",     color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
};

const TRANSITIONS = {
  assigned:   [{ val: "in_progress", label: "Start Working", color: "bg-blue-600 hover:bg-blue-500" }],
  in_progress:[
    { val: "resolved",  label: "Mark Resolved", color: "bg-emerald-600 hover:bg-emerald-500" },
    { val: "escalated", label: "Escalate",       color: "bg-orange-600 hover:bg-orange-500" },
  ],
  resolved: [{ val: "closed", label: "Close Issue", color: "bg-slate-600 hover:bg-slate-500" }],
};

const SEVERITY_COLOR = {
  critical: "text-red-400 bg-red-500/15 border-red-500/30",
  high:     "text-orange-400 bg-orange-500/15 border-orange-500/30",
  medium:   "text-amber-400 bg-amber-500/15 border-amber-500/30",
  low:      "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
};

/** Returns { label, color } describing time until/since deadline */
function slaCountdown(deadline) {
  if (!deadline) return null;
  const now = Date.now();
  const diff = new Date(deadline).getTime() - now;
  const absHours = Math.abs(diff) / 3_600_000;
  if (diff < 0) {
    const days = Math.floor(absHours / 24);
    const hrs  = Math.floor(absHours % 24);
    return {
      label: days > 0 ? `${days}d ${hrs}h overdue` : `${Math.floor(absHours)}h overdue`,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/30",
    };
  }
  if (absHours < 6)  return { label: `${Math.floor(absHours)}h left`, color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30" };
  if (absHours < 24) return { label: `${Math.floor(absHours)}h left`, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" };
  const days = Math.floor(absHours / 24);
  const hrs  = Math.floor(absHours % 24);
  return { label: `${days}d ${hrs}h left`, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" };
}

// ── Update Modal ──────────────────────────────────────────────────────────────
function UpdateModal({ issue, onClose, onDone }) {
  const transitions = TRANSITIONS[issue.status] || [];
  const [newStatus, setNewStatus] = useState(transitions[0]?.val || "");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("status", newStatus);
      if (note) fd.append("note", note);
      if (proof) fd.append("proof_image", proof);
      await api.post(`/issues/${issue.id}/status/`, fd);
      onDone(newStatus);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        className="bg-[#0f1729] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold">Update Issue Status</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-slate-500 text-xs mb-4 truncate">{issue.title}</p>

        <div className="space-y-3">
          {/* Status selector */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Move to Status</label>
            <div className="flex gap-2">
              {transitions.map(t => (
                <button key={t.val} onClick={() => setNewStatus(t.val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    newStatus === t.val
                      ? `${t.color} text-white border-transparent`
                      : "border-white/10 text-slate-400 hover:text-white"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Work Note <span className="text-slate-600">(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Describe what work was done or why escalating…"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none placeholder-slate-600" />
          </div>

          {newStatus === "resolved" && (
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Proof Image <span className="text-slate-600">(optional)</span></label>
              <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-dashed border-white/15 rounded-xl p-3 hover:border-white/30 transition-colors">
                <Upload size={14} className="text-slate-500" />
                <span className="text-xs text-slate-500">{proof ? proof.name : "Upload proof of resolution"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setProof(e.target.files[0])} />
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/12 text-slate-400 text-sm hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={loading || !newStatus}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Confirm Update"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Issue Card ────────────────────────────────────────────────────────────────
function IssueCard({ issue, onUpdate }) {
  const st = STATUS_CONFIG[issue.status] || {};
  const canUpdate = !!TRANSITIONS[issue.status]?.length;
  const countdown = slaCountdown(issue.sla_deadline);
  const priorityScore = issue.ai_priority_score;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white/3 border rounded-2xl overflow-hidden transition-all hover:border-white/15 ${
        issue.is_overdue ? "border-red-500/30 bg-red-500/3" : "border-white/8"
      }`}>

      {/* Top image strip */}
      {issue.thumbnail && (
        <img src={issue.thumbnail} alt="" className="w-full h-28 object-cover border-b border-white/8" />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm leading-snug">{issue.title}</h3>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border ${st.bg || ""} ${st.color || ""}`}>
            {st.label || issue.status}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><MapPin size={11} /><span className="truncate max-w-[160px]">{issue.location_address}</span></span>
          {issue.category_name && (
            <span className="flex items-center gap-1"><Tag size={11} />{issue.category_name}</span>
          )}
          <span className={`capitalize font-semibold border px-1.5 py-0.5 rounded-md text-[11px] ${SEVERITY_COLOR[issue.severity] || "text-slate-400"}`}>
            {issue.severity}
          </span>
        </div>

        {/* AI + SLA row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {priorityScore != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
              priorityScore >= 8 ? "text-red-400 bg-red-500/15 border-red-500/30"
              : priorityScore >= 5 ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
              : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
            }`}>
              AI {priorityScore.toFixed(1)}
            </span>
          )}
          {issue.ai_urgency && (
            <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg capitalize">
              {issue.ai_urgency}
            </span>
          )}
          {countdown && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg border ${countdown.bg} ${countdown.color}`}>
              <CalendarClock size={11} />{countdown.label}
            </span>
          )}
          {issue.is_overdue && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-400">
              <Flame size={12} /> SLA Overdue — escalation risk
            </span>
          )}
        </div>

        {/* SLA bar (visual progress) */}
        {issue.sla_deadline && issue.assigned_at && (
          <SLABar assignedAt={issue.assigned_at} deadline={issue.sla_deadline} />
        )}

        {/* Assignment note */}
        {issue.assigned_note && (
          <p className="text-slate-500 text-xs mt-2 italic border-l-2 border-white/10 pl-2 leading-relaxed">
            "{issue.assigned_note}"
          </p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/6">
          <span className="text-xs text-slate-600 flex items-center gap-1">
            <Clock size={11} />
            {new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          {canUpdate && (
            <button onClick={() => onUpdate(issue)}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/35 border border-blue-500/25 font-medium transition-colors">
              Update Status <ArrowRight size={11} />
            </button>
          )}
          {!canUpdate && issue.status === "resolved" && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle size={12} /> Resolved
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Thin progress bar showing time elapsed vs total SLA duration */
function SLABar({ assignedAt, deadline }) {
  const total = new Date(deadline).getTime() - new Date(assignedAt).getTime();
  const elapsed = Date.now() - new Date(assignedAt).getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-orange-400" : "bg-cyan-500";
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-slate-600 mb-1">
        <span>SLA Progress</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/6 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Tab filter ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",         label: "All" },
  { key: "assigned",    label: "To Start" },
  { key: "in_progress", label: "In Progress" },
  { key: "escalated",   label: "Escalated" },
  { key: "resolved",    label: "Resolved" },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/issues/assigned/");
      setIssues(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDone = (newStatus) => {
    setModal(null);
    setToast(`Status updated to "${newStatus.replace(/_/g, " ")}"!`);
    setTimeout(() => setToast(""), 3000);
    load();
  };

  const filtered = tab === "all" ? issues : issues.filter(i => i.status === tab);
  const overdueCount = issues.filter(i => i.is_overdue).length;
  const toStartCount = issues.filter(i => i.status === "assigned").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Assigned Issues</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {issues.length} total assignments
            {overdueCount > 0 && <span className="text-red-400 font-semibold ml-2">· {overdueCount} overdue</span>}
            {toStartCount > 0 && <span className="text-amber-400 font-semibold ml-2">· {toStartCount} to start</span>}
          </p>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors">
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* Overdue alert banner */}
      {overdueCount > 0 && !loading && (
        <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/25 rounded-2xl px-4 py-3">
          <Flame size={16} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">
            <span className="font-bold">{overdueCount} issue{overdueCount > 1 ? "s" : ""}</span> have passed their SLA deadline.
            Update status or escalate to avoid further escalation.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1">
        {TABS.map(t => {
          const count = t.key === "all" ? issues.length : issues.filter(i => i.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-white"
              }`}>
              {t.label} {count > 0 && <span className={`ml-1 ${tab === t.key ? "opacity-80" : "opacity-50"}`}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{tab === "all" ? "No active assignments." : `No issues with status "${tab.replace(/_/g, " ")}".`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(issue => (
            <IssueCard key={issue.id} issue={issue} onUpdate={setModal} />
          ))}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium z-50">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update modal */}
      <AnimatePresence>
        {modal && <UpdateModal issue={modal} onClose={() => setModal(null)} onDone={onDone} />}
      </AnimatePresence>
    </div>
  );
}
