import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, LogOut, User } from "lucide-react";
import StaggeredMenu from "./background/StaggeredMenu";
import { Button } from "./ui/Button";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = [
    { label: "Home", link: "/" },
    { label: "About", link: "/about" },
    { label: "Dashboard", link: "/dashboard" },
    { label: "Report Issue", link: "/report" },
    { label: "Contact", link: "/contact" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* Role badge style helper */
  const roleBadgeColor = (role) => {
    const map = {
      citizen: "text-cyan-400",
      authority: "text-amber-400",
      ngo_csr: "text-emerald-400",
      org_admin: "text-purple-400",
      super_admin: "text-red-400",
    };
    return map[role] || "text-slate-400";
  };

  return (
    <>
      {/* ── Desktop Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-cyan-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-purple-500">
              SmartCivic
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((item) => {
              const active = location.pathname === item.link;
              return (
                <Link
                  key={item.link}
                  to={item.link}
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 -bottom-1 h-[2px] w-full bg-cyan-400 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              /* ── Logged-in user display ── */
              <div className="flex items-center gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-2.5">
                  {user.profile_image ? (
                    <img
                      src={`/media/${user.profile_image}`}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-cyan-400/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-500 to-purple-600 flex items-center justify-center border border-cyan-400/30">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white leading-tight">
                      {user.full_name}
                    </p>
                    <p className={`text-xs leading-tight capitalize ${roleBadgeColor(user.role)}`}>
                      {user.role.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors ml-1"
                >
                  <LogOut size={16} />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            ) : (
              /* ── Guest buttons ── */
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ────────────────────────────────────────────────── */}
      <div className="md:hidden">
        <StaggeredMenu
          position="right"
          items={links.map((l) => ({
            label: l.label,
            link: l.link,
            ariaLabel: l.label,
          }))}
          displayItemNumbering
          colors={["#0f172a", "#020617"]}
          accentColor="#22d3ee"
          menuButtonColor="#ffffff"
          openMenuButtonColor="#22d3ee"
        />
      </div>
    </>
  );
};
