import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare, Clock, TrendingUp, AlertOctagon,
  ChevronRight, RefreshCcw, ClipboardList
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [queueRes, assignedRes] = await Promise.all([
        api.get("/issues/queue/?page_size=5"),
        api.get("/issues/assigned/"),
      ]);
      const queue = queueRes.data;
      const assigned = assignedRes.data;
      setRecent(queue.results || []);
      setStats({
        queue: queue.total || 0,
        assigned: assigned.length || 0,
        inProgress: (assigned || []).filter(i => i.status === "in_progress").length,
        resolved: (assigned || []).filter(i => i.status === "resolved").length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const SEVERITY_DOT = { low: "bg-emerald-400", medium: "bg-amber-400", high: "bg-orange-400", critical: "bg-red-400" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Authority Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome, {user?.full_name}. Review and resolve issues in your jurisdiction.</p>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors"><RefreshCcw size={16} /></button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Queue", value: stats?.queue ?? "—", icon: <Clock size={20} />, color: "from-amber-600 to-orange-600", glow: "shadow-amber-500/20", action: () => navigate("/authority/queue") },
          { label: "Assigned to Me", value: stats?.assigned ?? "—", icon: <ClipboardList size={20} />, color: "from-blue-600 to-indigo-600", glow: "shadow-blue-500/20", action: () => navigate("/authority/my-issues") },
          { label: "In Progress", value: stats?.inProgress ?? "—", icon: <TrendingUp size={20} />, color: "from-cyan-600 to-teal-600", glow: "shadow-cyan-500/20" },
          { label: "Resolved", value: stats?.resolved ?? "—", icon: <CheckSquare size={20} />, color: "from-emerald-600 to-green-600", glow: "shadow-emerald-500/20" },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            onClick={s.action} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 shadow-xl ${s.glow} ${s.action ? "cursor-pointer hover:scale-[1.02] transition-transform" : ""}`}>
            <div className="text-white/70 mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-white/70 text-xs mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Queue */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Clock size={16} className="text-amber-400" /> Recent Pending Issues
          </h2>
          <button onClick={() => navigate("/authority/queue")}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors">
            View all →
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending issues — queue is clear!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(issue => (
              <div key={issue.id} onClick={() => navigate(`/authority/queue`)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 cursor-pointer border border-white/5 hover:border-white/12 transition-all group">
                <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[issue.severity] || "bg-slate-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{issue.title}</p>
                  <p className="text-slate-600 text-xs truncate">{issue.location_address}</p>
                </div>
                <span className="text-xs text-slate-600 capitalize">{issue.severity}</span>
                <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-400 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/authority/queue")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-blue-600/15 border border-blue-500/25 hover:bg-blue-600/25 text-blue-400 text-sm font-medium transition-all">
          <CheckSquare size={18} /> Start Verifying Issues
        </button>
        <button onClick={() => navigate("/authority/my-issues")}
          className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 hover:bg-indigo-600/25 text-indigo-400 text-sm font-medium transition-all">
          <ClipboardList size={18} /> View My Assignments
        </button>
      </div>
    </div>
  );
}
