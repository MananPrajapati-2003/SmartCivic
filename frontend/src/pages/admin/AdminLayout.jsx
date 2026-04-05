import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu,
  Bell, Gauge, Building2, UserPlus, ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosInstance";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ngoPending, setNgoPending] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch pending NGO count for sidebar badge
  useEffect(() => {
    api.get("/auth/admin/ngo/?status=pending")
      .then(r => setNgoPending(r.data?.counts?.pending ?? 0))
      .catch(() => {});
  }, []);

  const navItems = [
    { to: "/admin",          label: "Dashboard",    icon: LayoutDashboard, end: true },
    { to: "/admin/issues",   label: "Issues",       icon: ClipboardList },
    { to: "/admin/users",    label: "Users",        icon: Users },
    { to: "/admin/ngo-approvals", label: "NGO Approvals", icon: Building2, badge: ngoPending > 0 ? ngoPending : null },
    { to: "/admin/create-account", label: "Create Account", icon: UserPlus },
    { to: "/admin/settings", label: "Settings",     icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`flex flex-col h-full bg-[#0a0f1e] border-r border-white/8 transition-all duration-300
        ${mobile ? "w-72" : collapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-white/8 ${collapsed && !mobile ? "justify-center px-2" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <Gauge size={18} className="text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <p className="text-white font-bold text-sm">SmartCivic</p>
            <p className="text-indigo-400 text-xs font-medium">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group
               ${isActive
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }
              ${collapsed && !mobile ? "justify-center" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} />
                {(!collapsed || mobile) && (
                  <span className="flex-1">{label}</span>
                )}
                {(!collapsed || mobile) && badge && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold min-w-[18px] text-center">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-white/8 space-y-2">
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.full_name}</p>
              <p className="text-indigo-400 text-[10px] capitalize truncate">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm
            ${collapsed && !mobile ? "justify-center" : ""}`}
        >
          <LogOut size={16} />
          {(!collapsed || mobile) && "Logout"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#060b18] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex relative">
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white shadow-lg hover:bg-indigo-500 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 md:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 h-full z-40 md:hidden"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-5 py-4 border-b border-white/8 bg-[#060b18]/80 backdrop-blur-xl shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* NGO badge in top bar too */}
            {ngoPending > 0 && (
              <button
                onClick={() => navigate("/admin/ngo-approvals")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
              >
                <Building2 size={12} /> {ngoPending} Pending NGO{ngoPending !== 1 ? "s" : ""}
              </button>
            )}
            <button className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
              <Bell size={16} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
