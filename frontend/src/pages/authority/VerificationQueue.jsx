import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle, XCircle, AlertOctagon, ChevronDown,
  MapPin, Camera, Eye, RefreshCcw, Loader2, X
} from "lucide-react";
import api from "../../api/axiosInstance";

const SEVERITY_COLOR = { low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", medium: "text-amber-400 border-amber-500/30 bg-amber-500/10", high: "text-orange-400 border-orange-500/30 bg-orange-500/10", critical: "text-red-400 border-red-500/30 bg-red-500/10" };

function ActionModal({ issue, action, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (action !== "approve" && !reason.trim()) { setError("Reason is required."); return; }
    setLoading(true);
    try {
      await api.post(`/issues/${issue.id}/verify/`, { action, reason });
      onDone();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed.");
    } finally { setLoading(false); }
  };

  const COLOR = { approve: { btn: "bg-emerald-600 hover:bg-emerald-500", title: "Approve Issue", icon: <CheckCircle size={24} className="text-emerald-400" />, border: "border-emerald-500/30" }, reject: { btn: "bg-red-600 hover:bg-red-500", title: "Reject Issue", icon: <XCircle size={24} className="text-red-400" />, border: "border-red-500/30" }, fake: { btn: "bg-rose-700 hover:bg-rose-600", title: "Mark as Fake/Spam", icon: <AlertOctagon size={24} className="text-rose-400" />, border: "border-rose-500/30" } }[action];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className={`bg-[#0f1729] border ${COLOR.border} rounded-2xl p-6 w-full max-w-sm`}>
        <div className="flex items-center gap-3 mb-4">
          {COLOR.icon}
          <h3 className="text-white font-bold text-lg">{COLOR.title}</h3>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-3">Issue: <strong className="text-white">{issue.title}</strong></p>
        {action !== "approve" && (
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Enter reason…"
            className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-white/30 resize-none mb-3" />
        )}
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${COLOR.btn} disabled:opacity-50`}>
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function VerificationQueue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { issue, action }
  const [toast, setToast] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: 12 });
      if (search) params.set("search", search);
      if (severity) params.set("severity", severity);
      const res = await api.get(`/issues/queue/?${params}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, severity]);

  useEffect(() => { fetch(); }, [fetch]);

  const onDone = (msg = "Action completed") => {
    setModal(null);
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
    fetch();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Verification Queue</h1>
          <p className="text-slate-500 text-sm mt-0.5">{data?.total ?? "..."} issues awaiting review</p>
        </div>
        <button onClick={fetch} className="text-slate-500 hover:text-white transition-colors"><RefreshCcw size={16} /></button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white/4 border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-52">
          <Search size={14} className="text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search title or location…"
            className="bg-transparent text-white text-sm outline-none w-full placeholder-slate-600" />
        </div>
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="bg-white/4 border border-white/10 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none">
          <option value="">All Severities</option>
          {["low", "medium", "high", "critical"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Issue Cards */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : !data?.results?.length ? (
        <div className="text-center py-16 text-slate-600">
          <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p>Queue is empty. All caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.results.map((issue, i) => (
            <motion.div key={issue.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors">
              {/* Thumbnail */}
              {issue.thumbnail && <img src={issue.thumbnail} alt="" className="w-full h-32 object-cover rounded-xl mb-3 border border-white/8" />}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-white font-semibold text-sm leading-snug">{issue.title}</h3>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border capitalize ${SEVERITY_COLOR[issue.severity]}`}>{issue.severity}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <MapPin size={11} /><span className="truncate">{issue.location_address}</span>
              </div>
              {issue.category_name && <p className="text-xs text-slate-600 mb-3">Category: {issue.category_name}</p>}
              <div className="text-xs text-slate-600 mb-3">Reported by: <span className="text-slate-400">{issue.reporter_name}</span></div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => setModal({ issue, action: "approve" })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/35 text-xs font-semibold border border-emerald-500/25 transition-colors">
                  <CheckCircle size={13} /> Approve
                </button>
                <button onClick={() => setModal({ issue, action: "reject" })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/35 text-xs font-semibold border border-red-500/25 transition-colors">
                  <XCircle size={13} /> Reject
                </button>
                <button onClick={() => setModal({ issue, action: "fake" })}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600/15 text-rose-400 hover:bg-rose-600/30 text-xs font-semibold border border-rose-500/20 transition-colors">
                  <AlertOctagon size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 text-sm transition-colors">← Prev</button>
          <span className="px-4 py-2 text-slate-500 text-sm">{page} / {data.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 text-sm transition-colors">Next →</button>
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

      {/* Action Modal */}
      <AnimatePresence>
        {modal && <ActionModal issue={modal.issue} action={modal.action} onClose={() => setModal(null)} onDone={() => onDone("Action applied.")} />}
      </AnimatePresence>
    </div>
  );
}
