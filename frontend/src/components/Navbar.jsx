import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import StaggeredMenu from "./background/StaggeredMenu";
import { Button } from "./ui/Button";

export const Navbar = () => {
  const location = useLocation();

  const links = [
    { label: "Home", link: "/" },
    { label: "About", link: "/about" },
    { label: "Dashboard", link: "/dashboard" },
    { label: "Report Issue", link: "/report" },
    { label: "Contact", link: "/contact" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-cyan-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-purple-500">
              SmartCivic
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((item) => {
              const active = location.pathname === item.link;
              return (
                <Link
                  key={item.link}
                  to={item.link}
                  className="relative text-sm font-medium text-gray-300 hover:text-white"
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

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Staggered Menu (Mobile & Optional Desktop) */}
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
