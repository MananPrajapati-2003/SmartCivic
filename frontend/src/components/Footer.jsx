import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Twitter,
  Facebook,
  Instagram,
  Github,
} from "lucide-react";
import { useSiteSettings } from "../context/SiteSettingsContext";

export const Footer = () => {
  const { settings } = useSiteSettings();
  return (
    <footer className="relative bg-linear-to-b from-[#0b0b14] via-[#0f0f1f] to-black border-t border-white/10">
      {/* soft glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-linear-to-r from-indigo-500 to-violet-500 rounded-lg shadow-md">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-violet-400 to-pink-400">
                {settings.site_name}
              </span>
            </Link>
            <p className="text-slate-300 text-sm leading-relaxed">
              Empowering citizens to build better communities. Report issues,
              track progress, and create impact together.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Report Issue", path: "/report" },
                { label: "Public Feed", path: "/feed" },
                { label: "Dashboard", path: "/dashboard" },
                { label: "Authorities", path: "/authorities" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-slate-300 hover:text-indigo-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Help Center", path: "/help" },
                { label: "Community Guidelines", path: "/guidelines" },
                { label: "Privacy Policy", path: "/privacy" },
                { label: "Terms of Service", path: "/terms" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-slate-300 hover:text-violet-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="font-semibold text-white mb-4">Connect</h3>
            <div className="flex space-x-4">
              {[Twitter, Facebook, Instagram, Github].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>
            © {new Date().getFullYear()} {settings.site_name} Platform. All rights
            reserved.
          </p>
          <p className="mt-4 md:mt-0">
            A way to <span className="text-pink-400">make</span> our
            Cities better
          </p>
        </div>
      </div>
    </footer>
  );
};
