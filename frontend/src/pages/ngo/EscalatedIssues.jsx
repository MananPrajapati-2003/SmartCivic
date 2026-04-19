import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Flame, CheckCircle, Upload, RefreshCcw, Loader2, X, Heart, Edit3 } from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const SEVERITY_COLOR = {
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
};

function ProgressModal({ issue, currentNote, onClose, onDone }) {
  const [note, setNote] = useState(currentNote || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      await api.patch(`/issues/${issue.id}/ngo-assist/`, { note });
      onDone("Progress note updated!");
    } catch (e) { setError(e?.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-[#0f1729] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Update Progress</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-3 font-medium">{issue.title}</p>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Progress note (visible to citizens & admin)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Describe current progress, actions taken, or next steps…"
            className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none placeholder-slate-600" />
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-400 text-sm hover:text-white transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading || !note.trim()}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Save Update"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AssistModal({ issue, onClose, onDone }) {
  const [action, setAction] = useState("accept");
  const [note, setNote] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [proof, setProof] = useState(null);
  const [bonus, setBonus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("action", action);
      if (note) fd.append("note", note);
      if (declineReason) fd.append("decline_reason", declineReason);
      if (proof) fd.append("proof_image", proof);
      if (bonus) fd.append("bonus_credibility", bonus);
      await api.post(`/issues/${issue.id}/ngo-assist/`, fd);
      onDone(action === "accept" ? "Assistance accepted!" : "Declined.");
    } catch (e) { setError(e?.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-[#0f1729] border border-white/15 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Assistance Decision</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>
        <p className="text-slate-400 text-sm mb-4 font-medium">{issue.title}</p>

        {/* Accept / Decline toggle */}
        <div className="flex gap-2 mb-4">
          {["accept", "decline"].map(a => (
            <button key={a} onClick={() => setAction(a)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                action === a
                  ? a === "accept" ? "bg-emerald-600/30 border-emerald-500/40 text-emerald-400" : "bg-red-600/20 border-red-500/30 text-red-400"
                  : "border-white/10 text-slate-500 hover:text-white"
              }`}>{a}</button>
          ))}
        </div>

        {action === "accept" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Note (how you will help)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Describe your support…"
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none placeholder-slate-600" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bonus Credibility for Citizen (0–50)</label>
              <input type="number" min={0} max={50} value={bonus} onChange={e => setBonus(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Proof Image (optional)</label>
              <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-dashed border-white/15 rounded-xl p-3 hover:border-white/30 transition-colors">
                <Upload size={14} className="text-slate-500" />
                <span className="text-xs text-slate-500">{proof ? proof.name : "Upload proof"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setProof(e.target.files[0])} />
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Reason for declining</label>
            <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3} placeholder="Reason…"
              className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none placeholder-slate-600" />
          </div>
        )}

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-400 text-sm hover:text-white transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${
              action === "accept" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
            }`}>
            {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : action === "accept" ? "Accept & Assist" : "Decline"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EscalatedIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [progressModal, setProgressModal] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/issues/escalated/");
      setIssues(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDone = (msg) => {
    setModal(null); setToast(msg);
    setTimeout(() => setToast(""), 3000); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame size={22} className="text-orange-400" /> Escalated Issues
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{issues.length} issues needing NGO/CSR support</p>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors"><RefreshCcw size={16} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Heart size={40} className="mx-auto mb-3 opacity-30" />
          <p>No escalated issues right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issues.map((issue, i) => {
            const myAssist = issue.ngo_assistances?.find(a => a.accepted && a.ngo_name === user?.full_name);
            return (
              <motion.div key={issue.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors">
                {issue.thumbnail && <img src={issue.thumbnail} alt="" className="w-full h-32 object-cover rounded-xl mb-3 border border-white/8" />}
                <div className="flex items-start gap-2 justify-between mb-2">
                  <h3 className="text-white font-semibold text-sm">{issue.title}</h3>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border capitalize ${SEVERITY_COLOR[issue.severity]}`}>{issue.severity}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <MapPin size={11} /><span className="truncate">{issue.location_address}</span>
                </div>
                {issue.category_name && <p className="text-xs text-slate-600 mb-3">· {issue.category_name}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-400 font-medium bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-lg">Escalated</span>
                  {myAssist ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={12} /> Assisting
                      </span>
                      <button onClick={() => setProgressModal({ issue, note: myAssist.note })}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/35 border border-indigo-500/25 font-medium transition-colors">
                        <Edit3 size={11} /> Update
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setModal(issue)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/35 border border-emerald-500/25 font-medium transition-colors">
                      <Heart size={12} /> Assist
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
        {modal && <AssistModal issue={modal} onClose={() => setModal(null)} onDone={onDone} />}
      </AnimatePresence>
      <AnimatePresence>
        {progressModal && (
          <ProgressModal
            issue={progressModal.issue}
            currentNote={progressModal.note}
            onClose={() => setProgressModal(null)}
            onDone={(msg) => { setProgressModal(null); setToast(msg); setTimeout(() => setToast(""), 3000); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
