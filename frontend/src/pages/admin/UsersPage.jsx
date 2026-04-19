import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight,
  Trash2, Edit3, X, RefreshCcw, Building2
} from "lucide-react";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const DEPT_OPTIONS = [
  { value: "general",     label: "General" },
  { value: "roads",       label: "Roads" },
  { value: "water",       label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "sanitation",  label: "Sanitation" },
  { value: "safety",      label: "Safety" },
  { value: "environment", label: "Environment" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "citizen", label: "Citizen" },
  { value: "authority", label: "Authority" },
  { value: "ngo_csr", label: "NGO / CSR" },
  { value: "org_admin", label: "Org Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_BADGE = {
  citizen: "bg-slate-700 text-slate-300",
  authority: "bg-blue-900/50 text-blue-300 border border-blue-700/40",
  ngo_csr: "bg-emerald-900/50 text-emerald-300 border border-emerald-700/40",
  org_admin: "bg-amber-900/50 text-amber-300 border border-amber-700/40",
  super_admin: "bg-red-900/50 text-red-300 border border-red-700/40",
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [form, setForm] = useState({
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    is_email_verified: user.is_email_verified,
    civic_score: user.civic_score,
  });
  const [dept, setDept] = useState(user.department || "general");
  const [saving, setSaving] = useState(false);
  const [savingDept, setSavingDept] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/auth/admin/users/${user.id}/`, form);
      // If authority user and dept changed, save department too
      if (form.role === "authority" && dept !== (user.department || "general")) {
        await api.patch(`/auth/admin/users/${user.id}/department/`, { department: dept });
      }
      onSave();
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
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0f1729] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Edit User</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60">
              {ROLE_OPTIONS.filter(r => r.value).map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Department — only shown for authority role */}
          {form.role === "authority" && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block flex items-center gap-1">
                <Building2 size={11} /> Department
              </label>
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60">
                {DEPT_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-600 mt-1">Controls which issue categories this officer sees</p>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Civic Score</label>
            <input type="number" value={form.civic_score} onChange={e => setForm(f => ({ ...f, civic_score: Number(e.target.value) }))}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-indigo-500" />
              <span className="text-slate-300 text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_email_verified} onChange={e => setForm(f => ({ ...f, is_email_verified: e.target.checked }))} className="accent-indigo-500" />
              <span className="text-slate-300 text-sm">Email Verified</span>
            </label>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", role: "", is_verified: "", is_active: "", sort: "-date_joined" });
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: 15, ...filters });
      [...params.keys()].forEach(k => { if (!params.get(k)) params.delete(k); });
      const res = await api.get(`/auth/admin/users/?${params}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/admin/users/${deleteId}/`);
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.detail || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const FilterSelect = ({ value, onChange, options }) => (
    <select value={value} onChange={onChange}
      className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{data?.total ?? "—"} total users</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-slate-400 hover:text-white text-sm transition-all">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white/3 border border-white/8 rounded-2xl p-4">
        <div className="flex items-center gap-2 bg-black/40 border border-white/12 rounded-xl px-3 py-2 flex-1 min-w-52">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            placeholder="Search by name, email, phone…"
            className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-600"
          />
        </div>
        <FilterSelect value={filters.role} onChange={e => { setFilters(f => ({ ...f, role: e.target.value })); setPage(1); }}
          options={ROLE_OPTIONS} />
        <FilterSelect value={filters.is_verified} onChange={e => { setFilters(f => ({ ...f, is_verified: e.target.value })); setPage(1); }}
          options={[{ value: "", label: "All Verified" }, { value: "true", label: "Verified" }, { value: "false", label: "Unverified" }]} />
        <FilterSelect value={filters.is_active} onChange={e => { setFilters(f => ({ ...f, is_active: e.target.value })); setPage(1); }}
          options={[{ value: "", label: "All Status" }, { value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
        <FilterSelect value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
          options={[
            { value: "-date_joined", label: "Newest First" },
            { value: "date_joined", label: "Oldest First" },
            { value: "-civic_score", label: "Highest Score" },
            { value: "full_name", label: "Name A-Z" },
          ]} />
      </div>

      {/* Table */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-500">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/2">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Role / Dept</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Mobile</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">Score</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Joined</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.results?.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-600">No users found</td></tr>
                )}
                {data?.results?.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.profile_image ? (
                          <img src={u.profile_image} alt={u.full_name} className="w-9 h-9 rounded-full object-cover border border-white/15" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold border border-indigo-500/30">
                            {u.full_name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{u.full_name}</p>
                          <p className="text-slate-600 text-xs">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${ROLE_BADGE[u.role]}`}>
                        {u.role.replace("_", " ")}
                      </span>
                      {u.role === "authority" && u.department && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                          <Building2 size={10} />
                          <span className="capitalize">{u.department}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-300">{u.email}</p>
                        <span className={`text-xs ${u.is_email_verified ? "text-emerald-400" : "text-red-400"}`}>
                          {u.is_email_verified ? "✓ Verified" : "✗ Unverified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-300">{u.mobile_number || "—"}</p>
                        {u.mobile_number && (
                          <span className={`text-xs ${u.is_mobile_verified ? "text-emerald-400" : "text-slate-600"}`}>
                            {u.is_mobile_verified ? "✓ Verified" : "✗ Unverified"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-amber-400 font-bold">{u.civic_score}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${u.is_active ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/30" : "bg-red-900/50 text-red-300 border border-red-700/30"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.date_joined}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setEditUser(u)}
                          className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors flex items-center justify-center">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => setDeleteId(u.id)}
                          className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors flex items-center justify-center">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <p className="text-slate-600 text-xs">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-slate-400 text-sm">{page} / {data.total_pages}</span>
              <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page === data.total_pages}
                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editUser && (
          <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={() => { setEditUser(null); fetchUsers(); }} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0f1729] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/40">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Delete User?</h3>
              <p className="text-slate-400 text-sm mt-2">This action is permanent and cannot be undone.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-slate-400 hover:text-white text-sm transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
