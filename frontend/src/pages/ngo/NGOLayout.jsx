import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Flame, LogOut, Leaf, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import NotificationBell from "../../components/NotificationBell";

const NAV = [
  { to: "/ngo", icon: <LayoutDashboard size={18} />, label: "Dashboard", end: true },
  { to: "/ngo/escalated", icon: <Flame size={18} />, label: "Escalated Issues" },
];

export default function NGOLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate("/login", { replace: true, state: null }); };

  return (
    <div className="flex h-screen bg-[#070b14] text-white overflow-hidden">
      <aside className="w-60 shrink-0 bg-[#0c1220] border-r border-white/8 flex flex-col">
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{settings?.site_name || "SmartCivic"}</p>
              <p className="text-emerald-400 text-xs">NGO / CSR Panel</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold shrink-0 hover:ring-2 hover:ring-emerald-400/50 transition-all overflow-hidden">
              {user?.profile_image
                ? <img src={user.profile_image} alt="" className="w-full h-full object-cover" />
                : (user?.full_name?.[0]?.toUpperCase() || <User size={14} />)
              }
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-slate-500 text-xs">NGO / CSR</p>
            </div>
            <NotificationBell accentColor="emerald" />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-emerald-600/25 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/8">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm w-full transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-6"><Outlet /></div></main>
    </div>
  );
}
