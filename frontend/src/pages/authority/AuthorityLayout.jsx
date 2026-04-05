import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, CheckSquare, ClipboardList, LogOut, Shield, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosInstance";

const NAV = [
  { to: "/authority", icon: <LayoutDashboard size={18} />, label: "Dashboard", end: true },
  { to: "/authority/queue", icon: <CheckSquare size={18} />, label: "Verification Queue" },
  { to: "/authority/my-issues", icon: <ClipboardList size={18} />, label: "My Assigned" },
];

export default function AuthorityLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    api.get("/issues/queue/?page_size=1").then(r => setQueueCount(r.data.total || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="flex h-screen bg-[#070b14] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#0c1220] border-r border-white/8 flex flex-col">
        {/* Brand */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">SmartCivic</p>
              <p className="text-blue-400 text-xs">Authority Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-slate-500 text-xs">Authority</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-blue-600/25 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }>
              {item.icon}
              {item.label}
              {item.label === "Verification Queue" && queueCount > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">
                  {queueCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/8">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm w-full transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
