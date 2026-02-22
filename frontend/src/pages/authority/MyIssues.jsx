import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, MapPin, Clock, TrendingUp, CheckCircle, Upload, Loader2, X } from "lucide-react";
import api from "../../api/axiosInstance";

const STATUS_CONFIG = {
  verified: { label: "Verified", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  assigned: { label: "Assigned", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  in_progress: { label: "In Progress", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
  escalated: { label: "Escalated", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
  resolved: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
};

const TRANSITIONS = {
  assigned: [{ val: "in_progress", label: "Start Working" }],
  in_progress: [{ val: "resolved", label: "Mark Resolved" }, { val: "escalated", label: "Escalate" }],
  resolved: [{ val: "closed", label: "Close Issue" }],
};

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
      onDone();
    } catch (e) { setError(e?.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-[#0f1729] border border-white/15 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Update Issue Status</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-4">{issue.title}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">New Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
              {transitions.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Add a note…"
              className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none placeholder-slate-600" />
          </div>
          {newStatus === "resolved" && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Proof Image (optional)</label>
              <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-dashed border-white/15 rounded-xl p-3 hover:border-white/30 transition-colors">
                <Upload size={14} className="text-slate-500" />
                <span className="text-xs text-slate-500">{proof ? proof.name : "Upload proof"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setProof(e.target.files[0])} />
              </label>
            </div>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 mt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-400 text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={submit} disabled={loading || !newStatus}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Update Status"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MyIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/issues/assigned/");
      setIssues(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDone = () => { setModal(null); setToast("Status updated!"); setTimeout(() => setToast(""), 3000); load(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Assigned Issues</h1>
          <p className="text-slate-500 text-sm">{issues.length} active assignments</p>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors"><RefreshCcw size={16} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 text-slate-600"><CheckCircle size={40} className="mx-auto mb-3 opacity-30" /><p>No active assignments.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.map((issue, i) => {
            const st = STATUS_CONFIG[issue.status] || {};
            const canUpdate = !!TRANSITIONS[issue.status]?.length;
            return (
              <motion.div key={issue.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors">
                {issue.thumbnail && <img src={issue.thumbnail} alt="" className="w-full h-24 object-cover rounded-xl mb-3 border border-white/8" />}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold text-sm">{issue.title}</h3>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border ${st.bg || ""} ${st.color || ""}`}>{st.label || issue.status}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <MapPin size={11} /><span className="truncate">{issue.location_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">
                    {new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                  <span className={`text-xs capitalize ml-auto ${issue.severity === "critical" ? "text-red-400" : issue.severity === "high" ? "text-orange-400" : "text-slate-500"}`}>
                    {issue.severity}
                  </span>
                  {canUpdate && (
                    <button onClick={() => setModal(issue)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/35 border border-blue-500/25 font-medium transition-colors">
                      Update Status
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium z-50">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && <UpdateModal issue={modal} onClose={() => setModal(null)} onDone={onDone} />}
      </AnimatePresence>
    </div>
  );
}
