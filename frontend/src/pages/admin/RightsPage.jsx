import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShieldCheck, ShieldX, User, RefreshCcw,
  CheckCircle, Loader2, AlertTriangle, X, Save
} from "lucide-react";
import api from "../../api/axiosInstance";

const ROLE_BADGE = {
  authority: "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  ngo_csr: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  org_admin: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
  super_admin: "bg-red-900/40 text-red-300 border border-red-700/40",
};

const PERM_GROUPS = [
  {
    group: "Issue Management",
    perms: [
      { key: "view_reports", label: "View Reports", desc: "Read all submitted issues" },
      { key: "approve_reports", label: "Approve Reports", desc: "Mark issues as verified/approved" },
      { key: "reject_reports", label: "Reject Reports", desc: "Reject/close issues" },
      { key: "assign_issues", label: "Assign Issues", desc: "Assign issues to authority users" },
    ],
  },
  {
    group: "User & Organisation",
    perms: [
      { key: "manage_users", label: "Manage Users", desc: "Edit, activate, deactivate users" },
      { key: "manage_ngo", label: "Manage NGOs", desc: "Approve/reject NGO registrations" },
      { key: "create_accounts", label: "Create Accounts", desc: "Create authority/admin accounts" },
    ],
  },
  {
    group: "Data & Communication",
    perms: [
      { key: "view_ai_data", label: "View AI Data", desc: "See AI analysis and statistics" },
      { key: "export_data", label: "Export Data", desc: "Download reports and data exports" },
      { key: "send_notifications", label: "Send Notifications", desc: "Broadcast alerts to users" },
    ],
  },
  {
    group: "Platform",
    perms: [
      { key: "manage_settings", label: "Manage Settings", desc: "Change platform-wide settings" },
      { key: "add_pages", label: "Add Pages", desc: "Create/edit informational pages" },
    ],
  },
];

// ─── Permission Editor Panel ─────────────────────────────────────────────────
function PermissionsPanel({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [roleDefaults, setRoleDefaults] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get(`/auth/rights/${userId}/`)
      .then(r => {
        setData(r.data);
        const defaults = new Set(r.data.role_default_permissions || []);
        setRoleDefaults(defaults);
        // Pre-select: role defaults + explicitly granted
        const allActive = new Set([...defaults, ...r.data.permissions]);
        setSelected(allActive);
      })
      .catch(() => setError("Failed to load permissions."))
      .finally(() => setLoading(false));
  }, [userId]);

  const toggle = (key) => {
    // Role defaults cannot be unticked
    if (roleDefaults.has(key)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    const allKeys = PERM_GROUPS.flatMap(g => g.perms.map(p => p.key));
    setSelected(new Set(allKeys));
  };

  // Clear only removes explicitly-granted extras, keeps role defaults
  const clearAll = () => setSelected(new Set(roleDefaults));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Only save extra permissions — role defaults are implicit, not stored
      const extras = [...selected].filter(k => !roleDefaults.has(k));
      await api.post(`/auth/rights/${userId}/`, { permissions: extras });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0f1729] border border-white/15 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            {data && (
              <>
                <h3 className="text-white font-bold">{data.user_name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border capitalize ${ROLE_BADGE[data.user_role] || "text-slate-400"}`}>
                  {data.user_role?.replace("_", " ")}
                </span>
              </>
            )}
            {!data && !loading && <h3 className="text-white font-bold">Permissions</h3>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {data && (
            <>
              {/* Quick actions */}
              <div className="flex gap-2">
                <button onClick={selectAll} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-600/35 transition-colors font-medium">
                  <ShieldCheck size={12} /> Grant All
                </button>
                <button onClick={clearAll} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50 transition-colors font-medium">
                  <ShieldX size={12} /> Clear All
                </button>
                <span className="ml-auto text-xs text-slate-500 self-center">
                  {selected.size} / {PERM_GROUPS.flatMap(g => g.perms).length} active
                  {roleDefaults.size > 0 && <span className="text-emerald-500 ml-1">({roleDefaults.size} from role)</span>}
                </span>
              </div>

              {/* Permission groups */}
              {PERM_GROUPS.map(group => (
                <div key={group.group}>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{group.group}</p>
                  <div className="space-y-2">
                    {group.perms.map(perm => {
                      const isDefault = roleDefaults.has(perm.key);
                      const isChecked = selected.has(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isDefault
                              ? "bg-emerald-500/8 border-emerald-500/25 cursor-default"
                              : isChecked
                              ? "bg-indigo-600/15 border-indigo-500/30 cursor-pointer"
                              : "bg-white/2 border-white/8 hover:border-white/15 cursor-pointer"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isDefault
                              ? "bg-emerald-600 border-emerald-500"
                              : isChecked
                              ? "bg-indigo-600 border-indigo-500"
                              : "bg-transparent border-slate-600"
                          }`}>
                            {isChecked && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggle(perm.key)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white flex items-center gap-2">
                              {perm.label}
                              {isDefault && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">
                                  role default
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{perm.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="px-5 py-4 border-t border-white/8 shrink-0">
            {error && (
              <p className="text-red-400 text-xs mb-2 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : saved
                ? <><CheckCircle size={14} /> Saved!</>
                : <><Save size={14} /> Save Permissions</>
              }
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Rights Page ─────────────────────────────────────────────────────────────
export default function RightsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/auth/user-search/?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck size={22} className="text-indigo-400" /> Rights & Permissions
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Search for a staff or admin user to grant or revoke granular permissions.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <label className="text-xs text-slate-400 font-medium mb-2 block">Search Users (name or email)</label>
        <div className="flex items-center gap-2 bg-black/40 border border-white/12 rounded-xl px-3 py-2.5">
          {searching
            ? <Loader2 size={15} className="text-slate-500 shrink-0 animate-spin" />
            : <Search size={15} className="text-slate-500 shrink-0" />
          }
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to search authority, NGO, or admin users…"
            className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-600 hover:text-slate-400">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/8 hover:border-indigo-500/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {u.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{u.full_name}</p>
                  <p className="text-slate-500 text-xs truncate">{u.email}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border capitalize ${ROLE_BADGE[u.role] || "text-slate-400"}`}>
                  {u.role?.replace("_", " ")}
                </span>
                <button
                  onClick={() => setSelectedId(u.id)}
                  className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-600/35 font-medium transition-colors"
                >
                  <ShieldCheck size={12} /> Manage
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-6">No staff users found matching "{query}"</p>
        )}
        {query.length > 0 && query.length < 2 && (
          <p className="text-slate-700 text-xs mt-2">Type at least 2 characters to search</p>
        )}
      </div>

      {/* Info box */}
      <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 text-xs text-slate-500 space-y-1">
        <p className="text-indigo-400 font-semibold mb-1">About Permissions</p>
        <p>Citizens are always excluded from this system — permissions only apply to authority, NGO, org_admin, and super_admin users.</p>
        <p>Saving replaces the user's entire permission set. Permissions take effect immediately on their next API call.</p>
      </div>

      {/* Permission panel */}
      <AnimatePresence>
        {selectedId && (
          <PermissionsPanel userId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
