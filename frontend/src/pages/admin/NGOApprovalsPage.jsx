import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, CheckCircle2, XCircle, Clock, Search,
  Globe, MapPin, Users, User, Mail, Phone,
  ChevronDown, AlertTriangle, Eye,
} from "lucide-react";
import api from "../../api/axiosInstance";

const STATUS_CONFIG = {
  pending:  { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/25",  icon: Clock,          label: "Pending" },
  approved: { color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/25",icon: CheckCircle2,   label: "Approved" },
  rejected: { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/25",    icon: XCircle,        label: "Rejected" },
};

// ── Reject Modal ────────────────────────────────────────────────────────────
function RejectModal({ ngo, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#0d1526] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <XCircle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Reject Application</h3>
            <p className="text-slate-500 text-xs">{ngo.org_name}</p>
          </div>
        </div>
        <label className="block text-xs text-slate-400 mb-2 font-medium">
          Rejection Reason <span className="text-red-400">*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Provide a clear reason for rejection..."
          rows={4}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 resize-none outline-none focus:border-red-500/50"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────
function NGODetailDrawer({ ngo, onClose, onApprove, onReject, actionLoading }) {
  const cfg = STATUS_CONFIG[ngo.approval_status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed inset-y-0 right-0 w-full max-w-lg z-40 bg-[#080f1e] border-l border-white/8 shadow-2xl overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Building2 size={22} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{ngo.org_name}</h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                <Icon size={11} />{cfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Info grid */}
        <div className="space-y-4 mb-6">
          <Section title="Contact Person">
            <Row icon={User} label="Name" value={ngo.contact_name} />
            <Row icon={Mail} label="Email" value={ngo.email} />
            <Row icon={Phone} label="Mobile" value={ngo.mobile || "—"} />
          </Section>
          <Section title="Organisation">
            <Row icon={MapPin} label="Address" value={ngo.address} />
            <Row icon={Users} label="Team Size" value={ngo.team_size + " members"} />
            {ngo.website && <Row icon={Globe} label="Website" value={<a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{ngo.website}</a>} />}
          </Section>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Description</p>
            <p className="text-slate-300 text-sm leading-relaxed bg-white/3 rounded-xl p-4">{ngo.description}</p>
          </div>
          {ngo.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-xs font-semibold mb-1">Rejection Reason</p>
              <p className="text-red-300 text-sm">{ngo.rejection_reason}</p>
            </div>
          )}
          <Section title="Timeline">
            <Row icon={Clock} label="Registered" value={ngo.registered_at} />
            {ngo.reviewed_by && <Row icon={User} label="Reviewed by" value={ngo.reviewed_by} />}
            {ngo.reviewed_at && <Row icon={Clock} label="Reviewed at" value={ngo.reviewed_at} />}
          </Section>
        </div>

        {/* Actions */}
        {ngo.approval_status === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={() => onApprove(ngo.id)}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 size={15} />
              {actionLoading === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => onReject(ngo)}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle size={15} />
              Reject
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white/3 border border-white/6 rounded-xl p-4">
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-slate-600 mt-0.5 shrink-0" />
      <span className="text-slate-500 text-xs w-20 shrink-0">{label}</span>
      <span className="text-slate-300 text-xs flex-1">{value}</span>
    </div>
  );
}

// ── NGO Card (List Item) ───────────────────────────────────────────────────
function NGOCard({ ngo, onView, onApprove, onReject }) {
  const cfg = STATUS_CONFIG[ngo.approval_status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{ngo.org_name}</h3>
            <p className="text-slate-500 text-xs">{ngo.contact_name} · {ngo.email}</p>
            <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={10} />{ngo.address}
              <span className="mx-1">·</span>
              <Users size={10} />{ngo.team_size} members
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
            <Icon size={11} />{cfg.label}
          </span>
          <span className="text-slate-600 text-[10px]">{ngo.registered_at}</span>
        </div>
      </div>

      {/* Description preview */}
      <p className="text-slate-500 text-xs mt-3 line-clamp-2">{ngo.description}</p>

      {/* Rejection reason */}
      {ngo.rejection_reason && (
        <div className="mt-3 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
          <p className="text-red-400 text-xs"><strong>Rejected:</strong> {ngo.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/6">
        <button
          onClick={() => onView(ngo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          <Eye size={12} /> View Details
        </button>
        {ngo.approval_status === "pending" && (
          <>
            <button
              onClick={() => onApprove(ngo.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors"
            >
              <CheckCircle2 size={12} /> Approve
            </button>
            <button
              onClick={() => onReject(ngo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function NGOApprovalsPage() {
  const [data, setData] = useState({ results: [], counts: { pending: 0, approved: 0, rejected: 0 } });
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab });
      if (search) params.set("search", search);
      const res = await api.get("/auth/admin/ngo/?" + params.toString());
      setData(res.data);
    } catch {
      showToast("Failed to load NGO registrations.", "error");
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    setActionLoading("approve_" + id);
    try {
      await api.patch(`/auth/admin/ngo/${id}/action/`, { action: "approve" });
      showToast("NGO approved! Credentials email sent.");
      setSelectedNGO(null);
      fetchData();
    } catch (e) {
      showToast(e?.response?.data?.detail || "Approval failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason) => {
    setActionLoading("reject");
    try {
      await api.patch(`/auth/admin/ngo/${rejectTarget.id}/action/`, { action: "reject", reason });
      showToast("Application rejected. Notification sent.");
      setRejectTarget(null);
      setSelectedNGO(null);
      fetchData();
    } catch (e) {
      showToast(e?.response?.data?.detail || "Rejection failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const TABS = [
    { key: "pending", label: "Pending", color: "text-amber-400 border-amber-400" },
    { key: "approved", label: "Approved", color: "text-emerald-400 border-emerald-400" },
    { key: "rejected", label: "Rejected", color: "text-red-400 border-red-400" },
  ];

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border
              ${toast.type === "error"
                ? "bg-red-500/20 border-red-500/30 text-red-300"
                : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">NGO / CSR Approvals</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and manage NGO registration requests</p>
        </div>
        {data.counts.pending > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold">
            {data.counts.pending} pending
          </span>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-6 border-b border-white/8 flex-1">
          {TABS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-2.5 text-sm font-medium transition-colors relative ${tab === key ? color : "text-slate-500 hover:text-slate-300"}`}
            >
              {label}
              <span className="ml-1.5 text-xs">({data.counts[key] ?? 0})</span>
              {tab === key && (
                <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-current rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-60">
          <Search size={14} className="text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search org or contact…"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600"
          />
        </div>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/3 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : data.results.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <Building2 size={40} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">No {tab} applications</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {data.results.map(ngo => (
              <NGOCard
                key={ngo.id}
                ngo={ngo}
                onView={setSelectedNGO}
                onApprove={handleApprove}
                onReject={setRejectTarget}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedNGO && (
          <>
            <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setSelectedNGO(null)} />
            <NGODetailDrawer
              ngo={selectedNGO}
              onClose={() => setSelectedNGO(null)}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              actionLoading={actionLoading}
            />
          </>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            ngo={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={handleReject}
            loading={actionLoading === "reject"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
