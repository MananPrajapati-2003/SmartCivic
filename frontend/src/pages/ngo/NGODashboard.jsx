import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Flame, Heart, CheckCircle, RefreshCcw, ChevronRight, TrendingUp } from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function NGODashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [escalated, setEscalated] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/issues/escalated/");
      setEscalated(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const accepted = escalated.filter(i => i.ngo_assistances?.some(a => a.accepted));
  const pending = escalated.length - accepted.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">NGO / CSR Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome, {user?.full_name}. Support escalated civic issues in your area.</p>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors"><RefreshCcw size={16} /></button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Escalated", value: escalated.length, icon: <Flame size={20} />, color: "from-orange-600 to-red-600", glow: "shadow-orange-500/20" },
          { label: "Needs Support", value: pending, icon: <Heart size={20} />, color: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/20" },
          { label: "I'm Assisting", value: accepted.length, icon: <CheckCircle size={20} />, color: "from-blue-600 to-indigo-600", glow: "shadow-blue-500/20" },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 shadow-xl ${s.glow}`}>
            <div className="text-white/70 mb-2">{s.icon}</div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-white/70 text-xs mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Latest Escalated */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Flame size={16} className="text-orange-400" /> Latest Escalated Issues
          </h2>
          <button onClick={() => navigate("/ngo/escalated")}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">View all →</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
        ) : escalated.slice(0, 5).length === 0 ? (
          <div className="text-center py-8 text-slate-600"><p className="text-sm">No escalated issues right now.</p></div>
        ) : (
          <div className="space-y-2">
            {escalated.slice(0, 5).map(issue => (
              <div key={issue.id} onClick={() => navigate("/ngo/escalated")}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 cursor-pointer border border-white/5 hover:border-white/12 transition-all group">
                <Flame size={14} className="text-orange-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{issue.title}</p>
                  <p className="text-slate-600 text-xs truncate">{issue.location_address}</p>
                </div>
                <ChevronRight size={14} className="text-slate-700 group-hover:text-emerald-400 shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => navigate("/ngo/escalated")}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/25 font-semibold text-sm transition-all">
        <Heart size={16} /> Browse & Assist Escalated Issues
      </button>
    </div>
  );
}
