import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Camera, Save, Lock, Eye, EyeOff, CheckCircle,
  Loader2, AlertTriangle, Sun, Moon, ShieldCheck, Star,
  LogOut, ArrowLeft, Mail, Phone, Shield, Palette, Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const ROLE_BADGE = {
  citizen:     { label: "Citizen",     color: "text-cyan-400",    bg: "bg-cyan-500/15 border-cyan-500/40"    },
  authority:   { label: "Authority",   color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/40"  },
  ngo_csr:     { label: "NGO / CSR",   color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40"},
  org_admin:   { label: "Org Admin",   color: "text-purple-400",  bg: "bg-purple-500/15 border-purple-500/40" },
  super_admin: { label: "Super Admin", color: "text-red-400",     bg: "bg-red-500/15 border-red-500/40"      },
};

const inputCls = "w-full bg-black/40 border border-white/12 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/60 placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function AlertBox({ type, msg }) {
  if (!msg) return null;
  const isErr = type === "error";
  return (
    <div className={`flex items-center gap-2.5 text-sm rounded-xl px-4 py-3 border ${
      isErr
        ? "text-red-400 bg-red-500/10 border-red-500/20"
        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    }`}>
      {isErr ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
      {msg}
    </div>
  );
}

const TABS = [
  { key: "profile",    label: "Profile",   icon: User   },
  { key: "security",   label: "Security",  icon: Shield },
  { key: "appearance", label: "Appearance", icon: Palette },
];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");

  // ── Profile form ─────────────────────────────────────────────────────────────
  const [name, setName]         = useState(user?.full_name || "");
  const [mobile, setMobile]     = useState(user?.mobile_number || "");
  const [avatar, setAvatar]     = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState("");
  const [saveErr, setSaveErr]   = useState("");

  // ── Password form ─────────────────────────────────────────────────────────────
  const [oldPw, setOldPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState("");
  const [pwErr, setPwErr]       = useState("");

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true); setSaveErr(""); setSaveMsg("");
    try {
      const fd = new FormData();
      fd.append("full_name", name);
      if (mobile) fd.append("mobile_number", mobile);
      if (avatar) fd.append("profile_image", avatar);
      const { data } = await api.patch("/auth/me/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const patch = { full_name: data.full_name, mobile_number: data.mobile_number };
      if (data.profile_image_url) patch.profile_image = data.profile_image_url;
      updateUser(patch);
      setSaveMsg("Profile updated successfully!");
      setAvatar(null);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      const d = err?.response?.data;
      setSaveErr(
        d?.detail || d?.full_name?.[0] || d?.mobile_number?.[0] ||
        (typeof d === "object" && d ? Object.values(d).flat()[0] : null) ||
        (err?.response ? `Server error (${err.response.status})` : "Cannot connect to server.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { setPwErr("Passwords do not match."); return; }
    if (newPw.length < 8)    { setPwErr("Password must be at least 8 characters."); return; }
    setPwSaving(true); setPwErr(""); setPwMsg("");
    try {
      await api.post("/auth/change-password/", { old_password: oldPw, new_password: newPw, confirm_new_password: confirmPw });
      setPwMsg("Password changed successfully!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwMsg(""), 3000);
    } catch (err) {
      setPwErr(err?.response?.data?.detail || "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true, state: null });
  };

  const roleInfo    = ROLE_BADGE[user?.role] || { label: user?.role, color: "text-slate-400", bg: "bg-slate-700/30 border-slate-600/30" };
  const displayImage = previewUrl || user?.profile_image || null;
  const backPath = { citizen: "/dashboard", authority: "/authority", ngo_csr: "/ngo" }[user?.role] || "/admin";

  return (
    <div className="min-h-screen bg-[#060b18] py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto">

        {/* Back nav */}
        <button onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-8">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* ── LEFT: Identity card ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Avatar card */}
            <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/12 rounded-3xl p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-5">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white/10 hover:border-indigo-500/60 transition-all group shadow-2xl shadow-indigo-900/40"
                >
                  {displayImage ? (
                    <img src={displayImage} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={44} className="text-white/60" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera size={22} className="text-white" />
                  </div>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#060b18] flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg"
                >
                  <Camera size={13} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Name & role */}
              <h2 className="text-xl font-bold text-white mb-1">{user?.full_name}</h2>
              <p className="text-slate-400 text-sm mb-3 truncate w-full">{user?.email}</p>

              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${roleInfo.bg} ${roleInfo.color}`}>
                <ShieldCheck size={11} />
                {roleInfo.label}
              </span>

              {/* Stats row */}
              <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-white/8 w-full">
                {user?.is_email_verified && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <ShieldCheck size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-500">Verified</p>
                  </div>
                )}
                {user?.civic_score !== undefined && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Star size={14} className="text-amber-400" />
                    </div>
                    <p className="text-[10px] text-slate-500">{user.civic_score} pts</p>
                  </div>
                )}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <Mail size={14} className="text-indigo-400" />
                  </div>
                  <p className="text-[10px] text-slate-500">Email</p>
                </div>
              </div>
            </div>

            {/* Quick info card */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-sm text-slate-200 truncate">{user?.email}</p>
                </div>
              </div>
              {(mobile || user?.mobile_number) && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Phone size={13} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Mobile</p>
                    <p className="text-sm text-slate-200">{mobile || user?.mobile_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </motion.div>

          {/* ── RIGHT: Tabbed settings ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            {/* Tab bar */}
            <div className="flex gap-1 mb-5 bg-slate-900/60 border border-white/10 rounded-2xl p-1.5">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === t.key
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/12 rounded-3xl p-7 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Profile Information</h3>
                  <p className="text-sm text-slate-400">Update your name, mobile number, and photo.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Full Name">
                    <input value={name} onChange={e => setName(e.target.value)}
                      className={inputCls} placeholder="Your full name" />
                  </Field>
                  <Field label="Email Address">
                    <input value={user?.email || ""} disabled className={inputCls} />
                  </Field>
                  <Field label="Mobile Number">
                    <input value={mobile} onChange={e => setMobile(e.target.value)}
                      className={inputCls} placeholder="+91 9876543210" />
                  </Field>
                  <Field label="Role">
                    <input value={roleInfo.label} disabled className={inputCls} />
                  </Field>
                </div>

                <AlertBox type="error"   msg={saveErr} />
                <AlertBox type="success" msg={saveMsg} />

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-900/30"
                >
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
                </button>
              </motion.div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === "security" && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/12 rounded-3xl p-7 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Change Password</h3>
                  <p className="text-sm text-slate-400">Use a strong password of at least 8 characters.</p>
                </div>

                <div className="space-y-5">
                  <Field label="Current Password">
                    <div className="relative">
                      <input type={showOld ? "text" : "password"} value={oldPw}
                        onChange={e => setOldPw(e.target.value)}
                        className={inputCls + " pr-12"} placeholder="Enter current password" />
                      <button type="button" onClick={() => setShowOld(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        className={inputCls + " pr-12"} placeholder="At least 8 characters" />
                      <button type="button" onClick={() => setShowNew(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password">
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      className={inputCls} placeholder="Repeat new password" />
                  </Field>
                </div>

                {/* Password strength hint */}
                {newPw && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                        newPw.length >= i * 3
                          ? newPw.length >= 12 ? "bg-emerald-500" : newPw.length >= 8 ? "bg-amber-500" : "bg-red-500"
                          : "bg-white/10"
                      }`} />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">
                      {newPw.length < 8 ? "Weak" : newPw.length < 12 ? "Fair" : "Strong"}
                    </span>
                  </div>
                )}

                <AlertBox type="error"   msg={pwErr} />
                <AlertBox type="success" msg={pwMsg} />

                <button
                  onClick={handleChangePassword}
                  disabled={pwSaving || !oldPw || !newPw || !confirmPw}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-bold transition-all"
                >
                  {pwSaving ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : <><Lock size={15} /> Update Password</>}
                </button>
              </motion.div>
            )}

            {/* ── Appearance Tab ── */}
            {activeTab === "appearance" && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/12 rounded-3xl p-7 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Appearance</h3>
                  <p className="text-sm text-slate-400">Personalise how the platform looks for you.</p>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-black/30 border border-white/10">
                  <div>
                    <p className="text-base font-semibold text-white">Theme</p>
                    <p className="text-sm text-slate-400 mt-0.5">Switch between dark and light modes</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1.5">
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        theme === "dark" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Moon size={14} /> Dark
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        theme === "light" ? "bg-amber-500 text-black shadow-md" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Sun size={14} /> Light
                    </button>
                  </div>
                </div>

                {/* Active theme preview */}
                <div className={`rounded-2xl border p-5 ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-300"}`}>
                  <p className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                    Preview — {theme === "dark" ? "Dark" : "Light"} Mode
                  </p>
                  <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    This is how your dashboard will appear.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
