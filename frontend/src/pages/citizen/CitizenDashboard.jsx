import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin, AlertTriangle, Clock, CheckCircle, XCircle, RefreshCcw,
  Plus, Star, TrendingUp, ChevronRight, Camera, Eye
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { AIAnalysisBadge } from "../../components/AIAnalysisBadge";

const STATUS_CONFIG = {
  pending_verification: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", dot: "bg-amber-400" },
  verified: { label: "Verified", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30", dot: "bg-blue-400" },
  assigned: { label: "Assigned", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30", dot: "bg-indigo-400" },
  in_progress: { label: "In Progress", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30", dot: "bg-cyan-400" },
  escalated: { label: "Escalated", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", dot: "bg-orange-400" },
  resolved: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", dot: "bg-emerald-400" },
  closed: { label: "Closed", color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/30", dot: "bg-slate-400" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", dot: "bg-red-400" },
  fake: { label: "Marked Fake", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30", dot: "bg-rose-400" },
};

const SEVERITY_COLOR = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const STAT_FILTERS = [
  { key: "", label: "All" },
  { key: "pending_verification", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: 8 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/issues/?${params}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // Stats derived from issues
  const all = data?.results || [];
  const pending = all.filter(i => i.status === "pending_verification").length;
  const inProgress = all.filter(i => ["verified", "assigned", "in_progress"].includes(i.status)).length;
  const resolved = all.filter(i => ["resolved", "closed"].includes(i.status)).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* Top bar */}
      <div className="bg-[#0c1220]/80 backdrop-blur border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
              SC
            </div>
            <span className="font-semibold text-white">SmartCivic</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-sm">My Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Civic Score */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
              <Star size={14} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">{user?.civic_score ?? 0}</span>
              <span className="text-amber-500/70 text-xs">pts</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, <span className="text-cyan-400">{user?.full_name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Track your civic reports and their lifecycle below.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/report")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20 text-sm"
          >
            <Plus size={16} /> Report Issue
          </motion.button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reports", value: data?.total ?? "—", icon: <AlertTriangle size={20} />, color: "from-indigo-600 to-purple-600", glow: "shadow-indigo-500/20" },
            { label: "Pending", value: pending, icon: <Clock size={20} />, color: "from-amber-600 to-orange-600", glow: "shadow-amber-500/20" },
            { label: "In Progress", value: inProgress, icon: <TrendingUp size={20} />, color: "from-cyan-600 to-blue-600", glow: "shadow-cyan-500/20" },
            { label: "Resolved", value: resolved, icon: <CheckCircle size={20} />, color: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/20" },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 shadow-xl ${s.glow}`}>
              <div className="text-white/70 mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-white/70 text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters + Issues */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {STAT_FILTERS.map(f => (
                <button key={f.key}
                  onClick={() => { setStatusFilter(f.key); setPage(1); }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${statusFilter === f.key ? "bg-cyan-600 text-white shadow-lg" : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={fetchIssues} className="text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCcw size={15} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {all.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-16 text-slate-600">
                    <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No issues found. <button onClick={() => navigate("/report")} className="text-cyan-500 hover:underline">Report your first issue →</button></p>
                  </motion.div>
                ) : all.map((issue, i) => {
                  const st = STATUS_CONFIG[issue.status] || STATUS_CONFIG.pending_verification;
                  return (
                    <motion.div key={issue.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/issue/${issue.id}`)}
                      className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/20 hover:bg-white/5 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        {issue.thumbnail ? (
                          <img src={issue.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            <Camera size={20} className="text-slate-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-white font-semibold truncate group-hover:text-cyan-400 transition-colors">{issue.title}</h3>
                            <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 shrink-0 mt-0.5 transition-colors" />
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin size={11} />{issue.location_address}</span>
                            {issue.category_name && <span className="text-slate-600">· {issue.category_name}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${st.bg} ${st.color}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5`} />
                              {st.label}
                            </span>
                            <span className={`text-xs font-medium capitalize ${SEVERITY_COLOR[issue.severity]}`}>
                              {issue.severity}
                            </span>
                            <span className="text-xs text-slate-600 ml-auto">
                              {new Date(issue.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                          <div onClick={e => e.stopPropagation()}>
                            <AIAnalysisBadge issueId={issue.id} initialStatus={issue.ai_status} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm disabled:opacity-30 transition-colors">
                    ← Prev
                  </button>
                  <span className="px-4 py-2 text-slate-500 text-sm">{page} / {data.total_pages}</span>
                  <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm disabled:opacity-30 transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
