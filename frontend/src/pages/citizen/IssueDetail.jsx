import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Clock, CheckCircle, Star, Camera,
  AlertTriangle, MessageSquare, Loader2, ChevronDown
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  pending_verification: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  verified: { label: "Verified", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  assigned: { label: "Assigned", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  in_progress: { label: "In Progress", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
  escalated: { label: "Escalated", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
  resolved: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  closed: { label: "Closed", color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/30" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" },
  fake: { label: "Fake", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
};

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feedback state
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get(`/issues/${id}/`).then(r => {
      setIssue(r.data);
      if (r.data.feedback) setFeedbackDone(true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const submitFeedback = async () => {
    setSubmitting(true);
    try {
      await api.post(`/issues/${id}/feedback/`, { rating, comment });
      setFeedbackDone(true);
      setToast("Feedback submitted!");
      setTimeout(() => setToast(""), 3000);
      // Refresh to get closed status
      const r = await api.get(`/issues/${id}/`);
      setIssue(r.data);
    } catch (e) {
      setToast(e?.response?.data?.detail || "Failed.");
      setTimeout(() => setToast(""), 3000);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );
  if (!issue) return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-500">
      Issue not found.
    </div>
  );

  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.pending_verification;
  const canFeedback = issue.can_submit_feedback && !feedbackDone && issue.reporter_email === user?.email;

  return (
    <div className="min-h-screen bg-[#070b14] pb-16">
      {/* Top bar */}
      <div className="bg-[#0c1220]/80 backdrop-blur border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="text-slate-300 font-medium truncate">{issue.title}</span>
          <span className={`ml-auto shrink-0 text-xs font-semibold px-2.5 py-1 rounded-xl border ${st.bg} ${st.color}`}>
            {st.label}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Images */}
        {issue.images?.length > 0 && (
          <div className={`grid gap-2 ${issue.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {issue.images.map(img => (
              <img key={img.id} src={img.url} alt={img.caption}
                className="w-full h-48 object-cover rounded-2xl border border-white/10" />
            ))}
          </div>
        )}

        {/* Header */}
        <div>
          <div className="flex items-start gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white flex-1">{issue.title}</h1>
            {issue.is_escalated && (
              <span className="shrink-0 text-xs font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 rounded-xl">
                🔥 Escalated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
            <MapPin size={13} /><span>{issue.location_address}</span>
            {issue.category?.name && <><span className="text-slate-700">·</span><span>{issue.category.name}</span></>}
            <span className="text-slate-700">·</span>
            <span className={`capitalize font-medium ${
              issue.severity === "critical" ? "text-red-400" : issue.severity === "high" ? "text-orange-400" : issue.severity === "medium" ? "text-amber-400" : "text-emerald-400"
            }`}>{issue.severity}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
          <h2 className="text-white font-semibold mb-2 text-sm">Description</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{issue.description}</p>
        </div>

        {/* Timeline */}
        {issue.status_updates?.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <h2 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" /> Timeline
            </h2>
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-4">
                {issue.status_updates.map((u, i) => (
                  <div key={u.id} className="relative">
                    <div className="absolute -left-2.5 top-1 w-2 h-2 rounded-full bg-cyan-500 border-2 border-[#070b14]" />
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-medium capitalize">{u.to_status.replace(/_/g, " ")}</span>
                        <span className="text-slate-600 text-xs">
                          {new Date(u.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {u.note && <p className="text-slate-500 text-xs mt-0.5">{u.note}</p>}
                      {u.changed_by_name && <p className="text-slate-700 text-xs mt-0.5">by {u.changed_by_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assignment */}
        {issue.assignment && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
            <h2 className="text-white font-semibold mb-1 text-sm">Assigned Authority</h2>
            <p className="text-blue-300 text-sm">{issue.assignment.assigned_to_name}</p>
            <p className="text-slate-500 text-xs mt-0.5">
              SLA Deadline: {new Date(issue.assignment.sla_deadline).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              {issue.assignment.is_overdue && <span className="text-red-400 ml-2 font-semibold">⚠ Overdue</span>}
            </p>
          </div>
        )}

        {/* NGO Assistance */}
        {issue.ngo_assistances?.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
            <h2 className="text-white font-semibold mb-3 text-sm">NGO Assistance</h2>
            {issue.ngo_assistances.map(a => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">N</div>
                <div>
                  <p className="text-white text-xs font-medium">{a.ngo_name} {a.ngo_org && `· ${a.ngo_org}`}</p>
                  {a.note && <p className="text-slate-500 text-xs">{a.note}</p>}
                </div>
                <span className={`ml-auto text-xs font-medium ${a.accepted ? "text-emerald-400" : "text-red-400"}`}>
                  {a.accepted ? "Assisting" : "Declined"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Citizen Feedback */}
        {canFeedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-1 text-sm flex items-center gap-2">
              <Star size={14} className="text-amber-400" /> Rate this Resolution
            </h2>
            <p className="text-slate-500 text-xs mb-4">Your feedback helps improve civic services.</p>
            {/* Star picker */}
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={`w-8 h-8 rounded-xl text-lg transition-transform hover:scale-110 ${n <= rating ? "text-amber-400" : "text-slate-700"}`}>★</button>
              ))}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Any comments? (optional)"
              className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none resize-none mb-3" />
            <button onClick={submitFeedback} disabled={submitting}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {submitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Submit Feedback"}
            </button>
          </motion.div>
        )}

        {feedbackDone && issue.feedback && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <CheckCircle size={20} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-emerald-400 text-sm font-medium">Feedback submitted · {issue.feedback.rating}★</p>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
