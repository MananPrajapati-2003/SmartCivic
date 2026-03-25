import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare, Clock, TrendingUp, AlertOctagon,
  ChevronRight, RefreshCcw, ClipboardList, Flame,
  CalendarClock, MapPin, ArrowRight
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  assigned:   { label: "To Start",    color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  in_progress:{ label: "In Progress", color: "text-cyan-400",   bg: "bg-cyan-500/15 border-cyan-500/30" },
  escalated:  { label: "Escalated",   color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
  resolved:   { label: "Resolved",    color: "text-emerald-400",bg: "bg-emerald-500/15 border-emerald-500/30" },
};

const SEVERITY_DOT = {
  low: "bg-emerald-400", medium: "bg-amber-400",
  high: "bg-orange-400", critical: "bg-red-500",
};

function slaLabel(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const hrs = diff / 3_600_000;
  if (diff < 0) {
    const d = Math.floor(Math.abs(hrs) / 24);
    return { text: d > 0 ? `${d}d overdue` : `${Math.floor(Math.abs(hrs))}h overdue`, urgent: true };
  }
  if (hrs < 24) return { text: `${Math.floor(hrs)}h left`, urgent: hrs < 6 };
  return { text: `${Math.floor(hrs / 24)}d left`, urgent: false };
}

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentQueue, setRecentQueue] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [queueRes, assignedRes] = await Promise.all([
        api.get("/issues/queue/?page_size=5"),
        api.get("/issues/assigned/"),
      ]);
      const queue    = queueRes.data;
      const assigned = assignedRes.data;
      setRecentQueue(queue.results || []);
      setMyIssues(assigned || []);
      setStats({
        queue:      queue.total || 0,
        assigned:   assigned.length || 0,
        inProgress: assigned.filter(i => i.status === "in_progress").length,
        overdue:    assigned.filter(i => i.is_overdue).length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Show at most 4 urgent/assigned issues on dashboard
  const urgentFirst = [...myIssues].sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    if ((b.ai_priority_score || 0) !== (a.ai_priority_score || 0))
      return (b.ai_priority_score || 0) - (a.ai_priority_score || 0);
    return 0;
  }).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Authority Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome, {user?.full_name}. Here's what needs your attention today.
          </p>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors">
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* Overdue alert */}
      {!loading && stats?.overdue > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-red-500/8 border border-red-500/30 rounded-2xl px-4 py-3">
          <Flame size={16} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm flex-1">
            <span className="font-bold">{stats.overdue} issue{stats.overdue > 1 ? "s" : ""}</span> have passed their SLA deadline.
            Immediate action required to prevent escalation.
          </p>
          <button onClick={() => navigate("/authority/my-issues")}
            className="text-xs text-red-400 hover:text-red-300 font-semibold whitespace-nowrap flex items-center gap-1">
            View <ArrowRight size={12} />
          </button>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Queue", value: stats?.queue ?? "—",      icon: <Clock size={20} />,        color: "from-amber-600 to-orange-600",   glow: "shadow-amber-500/20",   action: () => navigate("/authority/queue") },
          { label: "My Assignments",value: stats?.assigned ?? "—",   icon: <ClipboardList size={20} />,color: "from-blue-600 to-indigo-600",    glow: "shadow-blue-500/20",    action: () => navigate("/authority/my-issues") },
          { label: "In Progress",   value: stats?.inProgress ?? "—", icon: <TrendingUp size={20} />,   color: "from-cyan-600 to-teal-600",      glow: "shadow-cyan-500/20" },
          { label: "SLA Overdue",   value: stats?.overdue ?? "—",    icon: <AlertOctagon size={20} />, color: stats?.overdue > 0 ? "from-red-600 to-rose-600" : "from-slate-600 to-slate-700", glow: stats?.overdue > 0 ? "shadow-red-500/25" : "", action: () => navigate("/authority/my-issues") },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            onClick={s.action}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 shadow-xl ${s.glow} ${s.action ? "cursor-pointer hover:scale-[1.03] transition-transform" : ""}`}>
            <div className="text-white/70 mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-white/70 text-xs mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* My Active Assignments — priority view */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-400" />
            My Active Assignments
          </h2>
          <button onClick={() => navigate("/authority/my-issues")}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : myIssues.length === 0 ? (
          <div className="text-center py-10 text-slate-600">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active assignments — all clear!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {urgentFirst.map(issue => {
              const st = STATUS_CONFIG[issue.status] || {};
              const sla = slaLabel(issue.sla_deadline);
              const canAct = ["assigned", "in_progress"].includes(issue.status);
              return (
                <div key={issue.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer
                    ${issue.is_overdue
                      ? "bg-red-500/5 border-red-500/25 hover:border-red-500/40"
                      : "bg-white/3 border-white/6 hover:border-white/15"
                    }`}
                  onClick={() => navigate("/authority/my-issues")}>

                  {/* Severity dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[issue.severity] || "bg-slate-500"}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white text-sm font-medium truncate">{issue.title}</p>
                      {issue.is_overdue && <Flame size={12} className="text-red-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin size={10} />
                      <span className="truncate">{issue.location_address}</span>
                      {issue.category_name && <><span>·</span><span>{issue.category_name}</span></>}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {sla && (
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${sla.urgent ? "text-red-400" : "text-cyan-400"}`}>
                        <CalendarClock size={10} />{sla.text}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${st.bg || ""} ${st.color || ""}`}>
                      {st.label || issue.status}
                    </span>
                    {canAct && (
                      <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-400 transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}

            {myIssues.length > 4 && (
              <button onClick={() => navigate("/authority/my-issues")}
                className="w-full py-2 text-xs text-slate-500 hover:text-blue-400 transition-colors text-center border border-dashed border-white/8 rounded-xl mt-1">
                + {myIssues.length - 4} more assignments → View all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pending Verification Queue */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Clock size={16} className="text-amber-400" /> Pending Verification Queue
          </h2>
          <button onClick={() => navigate("/authority/queue")}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors flex items-center gap-1">
            Start verifying <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : recentQueue.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Queue is clear — great work!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentQueue.map(issue => (
              <div key={issue.id} onClick={() => navigate("/authority/queue")}
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
    </div>
  );
}
