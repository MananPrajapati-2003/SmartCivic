import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCircle, X, Clock, Star, Flame, MapPin,
  ClipboardList, Building2, AlertTriangle, User, RefreshCcw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";

const ICON_MAP = {
  check:     <CheckCircle size={14} className="text-emerald-400" />,
  x:         <X size={14} className="text-red-400" />,
  user:      <User size={14} className="text-blue-400" />,
  clock:     <Clock size={14} className="text-cyan-400" />,
  star:      <Star size={14} className="text-amber-400" />,
  flame:     <Flame size={14} className="text-orange-400" />,
  lock:      <CheckCircle size={14} className="text-slate-400" />,
  alert:     <AlertTriangle size={14} className="text-red-400" />,
  clipboard: <ClipboardList size={14} className="text-indigo-400" />,
  building:  <Building2 size={14} className="text-amber-400" />,
  "map-pin": <MapPin size={14} className="text-cyan-400" />,
  info:      <Bell size={14} className="text-slate-400" />,
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ accentColor = "indigo" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/notifications/");
      setNotifications(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifications.filter(n => !readIds.has(n.id)).length;

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const handleClick = (n) => {
    setReadIds(prev => new Set([...prev, n.id]));
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const accentRing = {
    indigo: "border-indigo-500/30 text-indigo-400",
    cyan:   "border-cyan-500/30 text-cyan-400",
    emerald:"border-emerald-500/30 text-emerald-400",
  }[accentColor] || "border-indigo-500/30 text-indigo-400";

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-[#0f1729] border border-white/12 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-slate-400" />
                <span className="text-white text-sm font-semibold">Notifications</span>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    Mark all read
                  </button>
                )}
                <button onClick={fetchNotifications} className="text-slate-600 hover:text-slate-400 transition-colors">
                  <RefreshCcw size={12} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const isRead = readIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${
                        isRead ? "opacity-60" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isRead ? "bg-white/5" : "bg-white/8"
                      }`}>
                        {ICON_MAP[n.icon] || ICON_MAP.info}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-tight ${isRead ? "text-slate-400" : "text-white"}`}>
                          {n.message}
                        </p>
                        {n.detail && (
                          <p className="text-xs text-slate-600 mt-0.5 truncate">{n.detail}</p>
                        )}
                        <p className="text-[10px] text-slate-700 mt-1">{timeAgo(n.time)}</p>
                      </div>
                      {/* Unread dot */}
                      {!isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
