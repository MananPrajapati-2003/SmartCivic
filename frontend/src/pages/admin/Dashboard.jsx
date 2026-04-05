import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, Smartphone, TrendingUp, UserCheck, Activity } from "lucide-react";
import api from "../../api/axiosInstance";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value ?? "—"}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
);

// ─── Chart option helpers ─────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: "#111827",
  borderColor: "#1e293b",
  textStyle: { color: "#e2e8f0" },
};

const axisStyle = {
  axisLabel: { color: "#64748b", fontSize: 11 },
  axisLine: { lineStyle: { color: "#1e293b" } },
  splitLine: { lineStyle: { color: "#0f172a" } },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/auth/admin/stats/")
      .then(res => setStats(res.data))
      .catch(err => setError(err?.response?.data?.detail || "Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" />
    </div>
  );
  if (error) return <div className="text-red-400 p-6 text-center">{error}</div>;

  const ov = stats.overview;

  // EChart options
  const monthlyOption = {
    backgroundColor: "transparent",
    tooltip: { ...tooltipStyle, trigger: "axis" },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "category", data: stats.monthly_registrations.map(r => r.month), ...axisStyle },
    yAxis: { type: "value", minInterval: 1, ...axisStyle },
    series: [{
      name: "Registrations",
      type: "bar",
      data: stats.monthly_registrations.map(r => r.count),
      barMaxWidth: 32,
      itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#6366f1" }, { offset: 1, color: "#8b5cf6" }] }, borderRadius: [6, 6, 0, 0] },
    }],
  };

  const dailyOption = {
    backgroundColor: "transparent",
    tooltip: { ...tooltipStyle, trigger: "axis" },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "category", data: stats.daily_registrations.map(r => r.day), ...axisStyle },
    yAxis: { type: "value", minInterval: 1, ...axisStyle },
    series: [{
      name: "Daily",
      type: "line",
      data: stats.daily_registrations.map(r => r.count),
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { color: "#22d3ee", width: 2.5 },
      itemStyle: { color: "#22d3ee" },
      areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(34,211,238,0.25)" }, { offset: 1, color: "rgba(34,211,238,0)" }] } },
    }],
  };

  const ROLE_LABELS = {
    citizen: "Citizen",
    authority: "Authority",
    ngo_csr: "NGO / CSR",
    org_admin: "Org Admin",
    super_admin: "Super Admin",
  };
  const ROLE_COLORS = ["#6366f1", "#22d3ee", "#10b981", "#f59e0b", "#ef4444"];

  const roleOption = {
    backgroundColor: "transparent",
    tooltip: { ...tooltipStyle, trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 10, top: "center", textStyle: { color: "#94a3b8", fontSize: 11 } },
    series: [{
      type: "pie",
      radius: ["50%", "80%"],
      center: ["38%", "50%"],
      label: { show: false },
      data: stats.role_breakdown.map((r, i) => ({
        value: r.count,
        name: ROLE_LABELS[r.role] || r.role,
        itemStyle: { color: ROLE_COLORS[i % ROLE_COLORS.length] },
      })),
    }],
  };

  const verifiedOption = {
    backgroundColor: "transparent",
    tooltip: { ...tooltipStyle, trigger: "item", formatter: "{b}: {c} ({d}%)" },
    series: [{
      type: "pie",
      radius: ["50%", "80%"],
      label: { show: false },
      data: [
        { value: ov.verified_users, name: "Email Verified", itemStyle: { color: "#6366f1" } },
        { value: ov.total_users - ov.verified_users, name: "Unverified", itemStyle: { color: "#1e293b" } },
      ],
    }],
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview of SmartCivic platform metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={ov.total_users} icon={Users} color="bg-indigo-600" delay={0} />
        <StatCard label="This Month" value={ov.new_this_month} icon={TrendingUp} color="bg-cyan-600" delay={0.05} />
        <StatCard label="This Week" value={ov.new_this_week} icon={Activity} color="bg-purple-600" delay={0.1} />
        <StatCard label="Verified" value={ov.verified_users} sub={`${ov.verification_rate}% rate`} icon={ShieldCheck} color="bg-emerald-600" delay={0.15} />
        <StatCard label="Mobile Ver." value={ov.mobile_verified} icon={Smartphone} color="bg-amber-600" delay={0.2} />
        <StatCard label="Active" value={ov.active_users} icon={UserCheck} color="bg-teal-600" delay={0.25} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Monthly Registrations</h3>
          <ReactECharts option={monthlyOption} style={{ height: 220 }} />
        </div>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Users by Role</h3>
          <ReactECharts option={roleOption} style={{ height: 220 }} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Daily Registrations (Last 30 Days)</h3>
          <ReactECharts option={dailyOption} style={{ height: 200 }} />
        </div>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Email Verification Rate</h3>
          <ReactECharts option={verifiedOption} style={{ height: 160 }} />
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Verified</span>
              <span className="text-indigo-400 font-semibold">{ov.verified_users}</span>
            </div>
            <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ov.verification_rate}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>0</span>
              <span className="text-slate-400">{ov.verification_rate}%</span>
              <span>{ov.total_users}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
