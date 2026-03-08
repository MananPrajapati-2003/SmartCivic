import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Camera, Upload, X, CheckCircle, Loader2,
  ArrowLeft, ArrowRight, AlertTriangle, FileImage,
  Zap, Navigation
} from "lucide-react";
import api from "../../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: All helper components are defined OUTSIDE SubmitIssue.
// If defined inside, React recreates them on every render causing total remount
// → focus loss after each keystroke.
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITIES = [
  { value: "low",      label: "Low",      desc: "Minor inconvenience",    color: "emerald", glow: "shadow-emerald-500/20" },
  { value: "medium",   label: "Medium",   desc: "Noticeable problem",     color: "amber",   glow: "shadow-amber-500/20" },
  { value: "high",     label: "High",     desc: "Significant impact",     color: "orange",  glow: "shadow-orange-500/20" },
  { value: "critical", label: "Critical", desc: "Immediate action needed",color: "red",     glow: "shadow-red-500/20" },
];

const SEV_STYLES = {
  emerald: { unsel: "border-white/10 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400", sel: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/20" },
  amber:   { unsel: "border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-amber-400",   sel: "border-amber-500/60 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/20" },
  orange:  { unsel: "border-white/10 text-slate-400 hover:border-orange-500/40 hover:text-orange-400", sel: "border-orange-500/60 bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/20" },
  red:     { unsel: "border-white/10 text-slate-400 hover:border-red-500/40 hover:text-red-400",       sel: "border-red-500/60 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/20" },
};

// ── Reusable field wrapper ────────────────────────────────────────────────────
function FieldWrap({ label, hint, error, charCount, maxChars, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        {charCount != null && (
          <span className={`text-xs ${charCount >= maxChars ? "text-red-400" : "text-slate-600"}`}>
            {charCount}/{maxChars}
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 transition-all duration-300 ${i === current ? "opacity-100" : "opacity-40"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i < current  ? "border-cyan-500 bg-cyan-500 text-white" :
              i === current? "border-cyan-400 bg-cyan-400/15 text-cyan-400" :
                             "border-white/15 text-slate-600"
            }`}>
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === current ? "text-white" : "text-slate-600"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 transition-all duration-500 ${i < current ? "bg-cyan-500" : "bg-white/10"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Image preview card ────────────────────────────────────────────────────────
function ImageCard({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square">
      <img src={url} alt={file.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button type="button" onClick={onRemove}
          className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
          <X size={14} className="text-white" />
        </button>
      </div>
      <div className="absolute bottom-1 left-1 right-1">
        <p className="text-white text-[10px] bg-black/60 rounded-md px-1.5 py-0.5 truncate">{file.name}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ["Details", "Location", "Media & Submit"];

export default function SubmitIssue() {
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle]       = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [address, setAddress]   = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [images, setImages]     = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [step, setStep]         = useState(0);
  const [errors, setErrors]     = useState({});
  const [categories, setCategories] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(null);

  const dropRef = useRef(null);

  useEffect(() => {
    api.get("/issues/categories/")
      .then(r => setCategories(r.data))
      .catch(() => {});
  }, []);

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    setImages(prev => [...prev, ...files].slice(0, 5));
  }, []);

  const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    );
  };

  // ── Validation per step ──────────────────────────────────────────────────────
  const validateStep0 = () => {
    const e = {};
    if (title.trim().length < 5)        e.title       = "At least 5 characters required";
    if (!categoryId)                     e.categoryId  = "Please select a category";
    if (description.trim().length < 20) e.description = "At least 20 characters required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep1 = () => {
    const e = {};
    if (!address.trim()) e.address = "Address / landmark is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append("title",            title.trim());
      fd.append("category_id",      categoryId);
      fd.append("description",      description.trim());
      fd.append("severity",         severity);
      fd.append("location_address", address.trim());
      if (latitude)  fd.append("latitude",  latitude);
      if (longitude) fd.append("longitude", longitude);
      images.forEach(img => fd.append("images", img));

      const res = await api.post("/issues/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(res.data);
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === "object") {
        setErrors(d);
      } else {
        setErrors({ api: "Submission failed. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18 }}
          className="bg-[#0c1729] border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-emerald-500/10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 14 }}
            className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-emerald-500/40"
          >
            <CheckCircle size={36} className="text-emerald-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Submitted!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-1">
            <span className="text-white font-semibold">"{success.title}"</span> has been received.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            It will enter the verification queue and an authority will review it shortly. You'll be able to track progress from your dashboard.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
            >
              → Go to My Dashboard
            </button>
            <button
              onClick={() => {
                setSuccess(null);
                setTitle(""); setCategoryId(""); setDescription("");
                setSeverity("medium"); setAddress(""); setLatitude(""); setLongitude(""); setImages([]);
                setStep(0);
              }}
              className="w-full py-3 rounded-xl border border-white/12 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Report Another Issue
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b14]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="bg-[#0c1220]/80 backdrop-blur-xl border-b border-white/8 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/8 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-sm">Report a Civic Issue</h1>
            <p className="text-slate-600 text-xs">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
            <Zap size={13} className="text-cyan-400" />
            <span className="text-cyan-400 text-xs font-medium">SmartCivic Reporting</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
            Be the Change
          </h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Your report matters. Each issue you submit brings the city one step closer to being better.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <StepDots steps={STEPS} current={step} />
        </div>

        {/* Card */}
        <div className="bg-[#0c1220] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

          <AnimatePresence mode="wait">
            {/* ── STEP 0: Issue Details ── */}
            {step === 0 && (
              <motion.div key="step0"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
                className="p-6 space-y-5"
              >
                <div className="pb-1 border-b border-white/5">
                  <h3 className="text-white font-bold text-base">Issue Details</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Tell us what the problem is</p>
                </div>

                {/* Title */}
                <FieldWrap label="Issue Title" hint="Be specific — good titles get faster responses" error={errors.title} charCount={title.length} maxChars={200}>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Large pothole on MG Road near City Bank"
                    maxLength={200}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </FieldWrap>

                {/* Category */}
                <FieldWrap label="Category" error={errors.categoryId}>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => setCategoryId(String(cat.id))}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                          String(categoryId) === String(cat.id)
                            ? "border-cyan-500/60 bg-cyan-500/12 text-cyan-300"
                            : "border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200 bg-white/2"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </FieldWrap>

                {/* Description */}
                <FieldWrap label="Description" hint="Describe when it started, impact on residents, and any safety concerns" error={errors.description} charCount={description.length} maxChars={2000}>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="The pothole appeared after heavy rain last week. It's approximately 2 feet wide and is causing vehicles to swerve dangerously, risking accidents…"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none leading-relaxed"
                  />
                </FieldWrap>

                {/* Severity */}
                <FieldWrap label="Severity Level">
                  <div className="grid grid-cols-2 gap-2">
                    {SEVERITIES.map(s => {
                      const st = SEV_STYLES[s.color];
                      const isSelected = severity === s.value;
                      return (
                        <button key={s.value} type="button"
                          onClick={() => setSeverity(s.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${isSelected ? st.sel : st.unsel}`}
                        >
                          <div className="font-semibold text-sm">{s.label}</div>
                          <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </FieldWrap>
              </motion.div>
            )}

            {/* ── STEP 1: Location ── */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
                className="p-6 space-y-5"
              >
                <div className="pb-1 border-b border-white/5">
                  <h3 className="text-white font-bold text-base">Location</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Help authorities find the issue quickly</p>
                </div>

                {/* Address */}
                <FieldWrap label="Address / Landmark *" hint="Include nearby landmarks for precision" error={errors.address}>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g., Near HDFC ATM, Brigade Road, Bengaluru"
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                </FieldWrap>

                {/* GPS Auto-detect */}
                <div className="bg-white/2 border border-white/6 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white text-sm font-semibold">GPS Coordinates</p>
                      <p className="text-slate-600 text-xs mt-0.5">Pinpoint accuracy for faster dispatch</p>
                    </div>
                    <button type="button" onClick={detectLocation} disabled={locLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/35 text-xs font-semibold transition-all disabled:opacity-50">
                      {locLoading
                        ? <><Loader2 size={13} className="animate-spin" /> Detecting…</>
                        : <><Navigation size={13} /> Auto-detect</>}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 block mb-1">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={e => setLatitude(e.target.value)}
                        placeholder="0.000000"
                        className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-slate-400 text-sm outline-none focus:border-white/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 block mb-1">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={e => setLongitude(e.target.value)}
                        placeholder="0.000000"
                        className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-slate-400 text-sm outline-none focus:border-white/20 transition-all"
                      />
                    </div>
                  </div>
                  {latitude && longitude && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                      <CheckCircle size={11} /> Location detected — {latitude}, {longitude}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Media & Submit ── */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}
                className="p-6 space-y-5"
              >
                <div className="pb-1 border-b border-white/5">
                  <h3 className="text-white font-bold text-base">Photos & Submit</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Images help authorities verify issues faster</p>
                </div>

                {/* Image upload */}
                <FieldWrap label={`Photos (${images.length}/5)`} hint="JPG, PNG or WebP · Max 5 images">
                  {/* Drop zone */}
                  <div
                    ref={dropRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-cyan-500/30 hover:bg-cyan-500/3 transition-all cursor-pointer group"
                    onClick={() => document.getElementById("file-input").click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        setImages(prev => [...prev, ...files].slice(0, 5));
                        e.target.value = "";
                      }}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-500/10 transition-colors">
                      <FileImage size={22} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium group-hover:text-slate-300 transition-colors">
                      {images.length === 0 ? "Click or drag images here" : "Add more images"}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">Up to 5 images allowed</p>
                  </div>

                  {/* Preview grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                      {images.map((img, i) => (
                        <ImageCard key={`${img.name}-${i}`} file={img}
                          onRemove={() => setImages(prev => prev.filter((_, j) => j !== i))} />
                      ))}
                    </div>
                  )}
                </FieldWrap>

                {/* Review summary */}
                <div className="bg-white/2 border border-white/6 rounded-2xl p-4 space-y-2.5">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Review Summary</p>
                  {[
                    { label: "Title",    value: title },
                    { label: "Category", value: categories.find(c => String(c.id) === String(categoryId))?.name || "—" },
                    { label: "Severity", value: SEVERITIES.find(s => s.value === severity)?.label || "—" },
                    { label: "Location", value: address || "—" },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 text-sm">
                      <span className="text-slate-600 w-20 shrink-0">{row.label}</span>
                      <span className="text-slate-300 truncate">{row.value}</span>
                    </div>
                  ))}
                </div>

                {errors.api && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    <AlertTriangle size={14} /> {errors.api}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Nav footer ── */}
          <div className="px-6 py-4 border-t border-white/6 flex gap-3 bg-black/20">
            {step > 0 && (
              <button type="button" onClick={back}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/12 text-slate-400 hover:text-white hover:border-white/25 text-sm font-medium transition-all">
                <ArrowLeft size={15} /> Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20">
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60">
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                  : <><CheckCircle size={16} /> Submit Report</>}
              </button>
            )}
          </div>
        </div>

        {/* Bottom tip */}
        <p className="text-center text-slate-700 text-xs mt-5">
          🔒 Your report is securely submitted and tracked.
        </p>
      </div>
    </div>
  );
}
