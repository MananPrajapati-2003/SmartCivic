import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, LogOut, User } from "lucide-react";
import StaggeredMenu from "./background/StaggeredMenu";
import { Button } from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import NotificationBell from "./NotificationBell";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name || "SmartCivic";

  // CMS custom pages — fetched once, added to public nav links
  const [cmsPages, setCmsPages] = useState([]);
  useEffect(() => {
    fetch("/api/cms/pages/")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        // Only custom pages (not built-in slots) that are public
        const custom = (Array.isArray(data) ? data : [])
          .filter(p => p.slot === "custom" && p.is_public);
        setCmsPages(custom);
      })
      .catch(() => {});
  }, []);

  const cmsLinks = cmsPages.map(p => ({
    label: p.name,
    link: `/pages/${p.slug}`,
  }));

  // Role-specific nav links
  const getLinks = () => {
    if (!user) {
      return [
        { label: "Home",    link: "/" },
        { label: "About",   link: "/about" },
        { label: "SLA",     link: "/sla" },
        ...cmsLinks,
        { label: "Contact", link: "/contact" },
      ];
    }
    switch (user.role) {
      case "citizen":
        return [
          { label: "Home",         link: "/" },
          { label: "About",        link: "/about" },
          { label: "SLA",          link: "/sla" },
          ...cmsLinks,
          { label: "Dashboard",    link: "/dashboard" },
          { label: "Report Issue", link: "/report" },
          { label: "Contact",      link: "/contact" },
        ];
      case "authority":
        return [
          { label: "Dashboard", link: "/authority" },
          { label: "Queue", link: "/authority/queue" },
          { label: "My Issues", link: "/authority/my-issues" },
        ];
      case "ngo_csr":
        return [
          { label: "Dashboard", link: "/ngo" },
          { label: "Escalated Issues", link: "/ngo/escalated" },
        ];
      case "org_admin":
      case "super_admin":
        return [
          { label: "Admin Panel", link: "/admin" },
        ];
      default:
        return [{ label: "Home", link: "/" }];
    }
  };

  const links = getLinks();

  const handleLogout = async () => {
    await logout();
    // Replace history so the previous role's URL can't be navigated back to
    navigate("/login", { replace: true, state: null });
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
              {siteName}
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
                {/* Avatar + name — clickable → profile */}
                <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  {user.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-cyan-400"
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
                </Link>

                {/* Notifications */}
                <NotificationBell accentColor="cyan" />

                {/* Admin Panel link for super_admin */}
                {(user.role === "super_admin" || user.is_staff) && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors"
                  >
                    <ShieldAlert size={13} /> Admin
                  </Link>
                )}

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
