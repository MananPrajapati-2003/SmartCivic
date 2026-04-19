import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin, X, CheckCircle, Loader2, ArrowLeft, ArrowRight,
  AlertTriangle, FileImage, Navigation, Brain,
  Camera, Zap, ShieldAlert, Lock, RefreshCw
} from "lucide-react";
import api from "../../api/axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// Constants — outside component
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "details",  label: "Details",  icon: Zap,        accent: "cyan"  },
  { id: "photos",   label: "Photos",   icon: Camera,      accent: "teal"  },
  { id: "location", label: "Location", icon: MapPin,      accent: "amber" },
  { id: "severity", label: "Severity", icon: ShieldAlert, accent: "rose"  },
];

const ACCENT = {
  cyan:  { ring: "border-cyan-500/60",  bg: "bg-cyan-500/12",  text: "text-cyan-400",  icon: "bg-cyan-500/10 border-cyan-500/25",  btn: "from-cyan-600 to-blue-600",    glow: "shadow-cyan-500/20"  },
  teal:  { ring: "border-teal-500/60",  bg: "bg-teal-500/12",  text: "text-teal-400",  icon: "bg-teal-500/10 border-teal-500/25",  btn: "from-teal-600 to-cyan-600",    glow: "shadow-teal-500/20"  },
  amber: { ring: "border-amber-500/60", bg: "bg-amber-500/12", text: "text-amber-400", icon: "bg-amber-500/10 border-amber-500/25", btn: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20" },
  rose:  { ring: "border-rose-500/60",  bg: "bg-rose-500/12",  text: "text-rose-400",  icon: "bg-rose-500/10 border-rose-500/25",  btn: "from-rose-600 to-pink-600",    glow: "shadow-rose-500/20"  },
};

const SEVERITIES = [
  { value: "low",      label: "Low",      desc: "Minor inconvenience, can wait",    dot: "bg-emerald-400", ring: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300", base: "border-white/10 text-slate-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-300" },
  { value: "medium",   label: "Medium",   desc: "Noticeable, needs attention soon", dot: "bg-amber-400",   ring: "border-amber-500/60 bg-amber-500/10 text-amber-300",   base: "border-white/10 text-slate-400 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300"   },
  { value: "high",     label: "High",     desc: "Significant community impact",     dot: "bg-orange-400",  ring: "border-orange-500/60 bg-orange-500/10 text-orange-300", base: "border-white/10 text-slate-400 hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300" },
  { value: "critical", label: "Critical", desc: "Immediate action required",        dot: "bg-red-400",     ring: "border-red-500/60 bg-red-500/10 text-red-300",         base: "border-white/10 text-slate-400 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300"         },
];

const URGENCY_TO_SEVERITY = { low: "low", medium: "medium", high: "high", critical: "critical" };

const slideVariants = {
  enter:  (d) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
};

const urgencyPillStyle = {
  low:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medium:   "text-amber-400  bg-amber-500/10  border-amber-500/30",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  critical: "text-red-400    bg-red-500/10    border-red-500/30",
};

function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-400 flex items-center gap-1 mt-1.5">
      <AlertTriangle size={11} />{msg}
    </p>
  );
}

function StepDot({ s, index, current }) {
  const done   = index < current;
  const active = index === current;
  const ac     = ACCENT[s.accent];
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all shrink-0
      ${active ? `${ac.text} ${ac.ring}` : done ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/15 text-slate-600"}`}>
      {done ? <CheckCircle size={11} /> : index + 1}
    </div>
  );
}

function ImageCard({ file, onRemove }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/30">
      <img src={url} alt={file.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button type="button" onClick={onRemove}
          className="w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-500 flex items-center justify-center transition-colors">
          <X size={14} className="text-white" />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-1.5">
        <p className="text-white text-[10px] truncate">{file.name}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function SubmitIssue() {
  const navigate = useNavigate();

  // ── form fields ──────────────────────────────────────────────────────────────
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [severity,    setSeverity]    = useState("medium");
  const [address,     setAddress]     = useState("");
  const [latitude,    setLatitude]    = useState("");
  const [longitude,   setLongitude]   = useState("");
  const [images,      setImages]      = useState([]);

  // ── AI category hint (shown below description — updated when title/description changes) ─
  // Actual AI classification requires a photo; this state just tracks whether there's
  // a result (set by runFullAiPreview on step 1→2) to show in the category box.
  const [textAi,        setTextAi]        = useState(null);
  const textAiDebounce  = useRef(null);

  // ── Full AI preview (runs on step 1→2 transition, uses photo + text) ─────────
  const [aiPreview,    setAiPreview]    = useState(null);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiError,      setAiError]      = useState("");

  // ── wizard ───────────────────────────────────────────────────────────────────
  const [step,       setStep]       = useState(0);
  const [dir,        setDir]        = useState(1);
  const [errors,     setErrors]     = useState({});
  const [locLoad,    setLocLoad]    = useState(false);
  const [geocoding,  setGeocoding]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(null);

  // ── post-submit polling ───────────────────────────────────────────────────────
  const [pollStatus, setPollStatus] = useState(null);
  const [aiResult,   setAiResult]   = useState(null);
  const pollRef = useRef(null);
  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── Text-only AI hint — fires after user stops typing description (debounced) ─
  useEffect(() => {
    // Text-only debounce — the HF ResNet50 model requires an image, so we only
    // update the placeholder text state here; actual AI runs on step 1→2 transition.
    clearTimeout(textAiDebounce.current);
    setTextAi(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  // ── Full AI preview (photo + text) — called at step 1 → 2 transition ─────────
  const runFullAiPreview = async () => {
    if (images.length === 0) return; // ResNet50 requires an image — skip if none
    setAiLoading(true);
    setAiError("");
    try {
      const fd = new FormData();
      fd.append("text", `${title.trim()}. ${description.trim()}`);
      fd.append("image", images[0]);
      const { data } = await api.post("/ai/preview/", fd);
      if (data?.needs_image) return; // shouldn't happen since we check above
      setAiPreview(data);
      setTextAi(data); // also update step-0 category box with the result
      const aiSev = URGENCY_TO_SEVERITY[data.urgency];
      if (aiSev) setSeverity(aiSev);
    } catch (err) {
      setAiError(err?.response?.data?.detail || "AI preview unavailable — you can still submit.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    setImages(prev => [...prev, ...files].slice(0, 5));
  }, []);
  const handleDragOver = useCallback((e) => e.preventDefault(), []);

  // ── GPS + reverse geocode ─────────────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoad(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      setLatitude(lat); setLongitude(lng);
      setLocLoad(false);
      setGeocoding(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data?.address) {
          const a = data.address;
          const parts = [
            a.road || a.pedestrian || a.footway,
            a.suburb || a.neighbourhood,
            a.city || a.town || a.village || a.county,
            a.state,
          ].filter(Boolean);
          setAddress(parts.length ? parts.join(", ") : data.display_name?.split(",").slice(0, 4).join(",").trim() || "");
        }
      } catch { /* user can type manually */ }
      finally { setGeocoding(false); }
    }, () => setLocLoad(false), { timeout: 10000, enableHighAccuracy: true });
  };

  // ── Post-submit polling ───────────────────────────────────────────────────────
  const startPolling = (issueId) => {
    setPollStatus("pending");
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      if (++attempts > 40) { clearInterval(pollRef.current); return; }
      try {
        const { data } = await api.get(`/ai/status/${issueId}/`);
        setPollStatus(data.ai_status);
        if (data.ai_status === "done")   { setAiResult(data.ai_result); clearInterval(pollRef.current); }
        if (data.ai_status === "failed") { clearInterval(pollRef.current); }
      } catch { clearInterval(pollRef.current); }
    }, 3000);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (title.trim().length < 5)        e.title       = "At least 5 characters required";
      if (description.trim().length < 20) e.description = "At least 20 characters required";
    }
    if (s === 2) {
      if (!address.trim()) e.address = "Address / landmark is required";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goNext = async () => {
    if (!validateStep(step)) return;
    setErrors({});
    // Step 1 (Photos) → Step 2 (Location): run full AI with photo
    if (step === 1) {
      setDir(1);
      setStep(2);
      await runFullAiPreview();
      return;
    }
    setDir(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDir(-1);
    setErrors({});
    setStep(s => s - 1);
  };

  const goTo = (i) => {
    if (i > step && !validateStep(step)) return;
    setDir(i > step ? 1 : -1);
    setErrors({});
    setStep(i);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title",            title.trim());
      fd.append("description",      description.trim());
      fd.append("severity",         severity);
      fd.append("location_address", address.trim());
      const cat = aiPreview || textAi;
      if (cat?.category_id) fd.append("category_id", cat.category_id);
      if (latitude)  fd.append("latitude",  latitude);
      if (longitude) fd.append("longitude", longitude);
      images.forEach(img => fd.append("images", img));
      const res = await api.post("/issues/", fd);
      setSuccess(res.data);
      startPolling(res.data.id);
    } catch (err) {
      const d = err?.response?.data;
      setErrors(d && typeof d === "object" ? d : { api: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const ac = ACCENT[STEPS[step]?.accent || "cyan"];
  // The best available AI result to display
  const displayAi = aiPreview || textAi;

  // ─────────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-5">
        <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18 }} className="max-w-sm w-full space-y-3">

          <div className="bg-[#0c1729] border border-emerald-500/30 rounded-3xl p-7 text-center shadow-2xl shadow-emerald-500/10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 14 }}
              className="w-[72px] h-[72px] bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/40">
              <CheckCircle size={34} className="text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-1">Issue Submitted!</h2>
            <p className="text-slate-400 text-sm mb-1">
              <span className="text-white font-medium">"{success.title}"</span>
            </p>
            <p className="text-slate-600 text-xs mb-5">Issue #{success.id} · Entering verification queue</p>
            <div className="space-y-2">
              <button onClick={() => navigate("/dashboard")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                View My Dashboard
              </button>
              <button onClick={() => {
                setSuccess(null); setAiResult(null); setPollStatus(null);
                setAiPreview(null); setTextAi(null);
                setTitle(""); setDescription(""); setSeverity("medium");
                setAddress(""); setLatitude(""); setLongitude(""); setImages([]);
                setStep(0);
              }}
                className="w-full py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
                Report Another Issue
              </button>
            </div>
          </div>

          <div className="bg-[#0c1729] border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-violet-400" />
              <span className="text-white text-sm font-semibold">Full AI Analysis</span>
              <span className="text-slate-600 text-xs ml-auto">background task</span>
            </div>
            {(pollStatus === "pending" || pollStatus === "processing") && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Loader2 size={13} className="animate-spin text-violet-400" />
                Computing priority score, routing, SLA…
              </div>
            )}
            {pollStatus === "done" && aiResult && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/4 rounded-xl p-3">
                    <p className="text-slate-500 text-[11px] mb-1">Priority</p>
                    <p className="text-white font-bold text-xl leading-none">{aiResult.priority_score}<span className="text-slate-500 text-xs font-normal">/10</span></p>
                    <p className="text-violet-400 text-[11px] font-medium mt-0.5">{aiResult.priority_label}</p>
                  </div>
                  <div className="bg-white/4 rounded-xl p-3">
                    <p className="text-slate-500 text-[11px] mb-1">Confirmed Category</p>
                    <p className="text-white text-xs font-medium leading-tight">{aiResult.predicted_category?.replace(/_/g, " ")}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{Math.round((aiResult.category_confidence || 0) * 100)}% confidence</p>
                  </div>
                </div>
                <div className="flex justify-between bg-white/4 rounded-xl px-3 py-2.5 text-xs">
                  <span className="text-slate-500">Route: <span className="text-white capitalize">{aiResult.routing_target}</span></span>
                  <span className="text-slate-500">SLA: <span className="text-cyan-400 font-semibold">{aiResult.sla_hours}h</span></span>
                </div>
                {aiResult.nlp_summary && (
                  <p className="text-slate-400 text-xs italic border-l-2 border-violet-500/40 pl-3">"{aiResult.nlp_summary}"</p>
                )}
              </motion.div>
            )}
            {pollStatus === "failed" && (
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <AlertTriangle size={11} /> AI analysis failed — issue submitted, will be reviewed manually.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WIZARD
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col">

      {/* Top bar */}
      <div className="bg-[#0c1220]/90 backdrop-blur-xl border-b border-white/8 shrink-0">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/8 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-sm">Report a Civic Issue</h1>
            <p className="text-slate-500 text-xs">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
            <Brain size={11} className="text-violet-400" />
            <span className="text-violet-400 text-xs font-medium">AI-Classified</span>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="shrink-0 max-w-2xl mx-auto w-full px-5 pt-5 pb-4">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const a       = ACCENT[s.accent];
            const done    = i < step;
            const current = i === step;
            return (
              <React.Fragment key={s.id}>
                <button type="button" onClick={() => goTo(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap
                    ${current ? `${a.bg} ${a.text} border ${a.ring}` : done ? "bg-white/5 text-slate-300 border border-white/10 hover:border-white/20" : "text-slate-600 border border-transparent hover:text-slate-400"}`}>
                  <StepDot s={s} index={i} current={step} />
                  <span className="hidden sm:block">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 transition-all duration-500 ${i < step ? "bg-emerald-500/40" : "bg-white/8"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div className={`h-full bg-gradient-to-r ${ac.btn} rounded-full`}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }} />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 pb-5 flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── STEP 0: Title + Description + AI Category (read-only) ─── */}
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#0c1220] border border-white/8 rounded-2xl p-6 overflow-y-auto">

                <div className="flex items-center gap-2.5 mb-5">
                  <div className={`p-2 rounded-xl border ${ACCENT.cyan.icon}`}>
                    <Zap size={15} className={ACCENT.cyan.text} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">Issue Details</h3>
                </div>

                {/* Title */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Issue Title <span className="text-red-400">*</span></span>
                    <span className={`font-normal ${title.length >= 200 ? "text-red-400" : "text-slate-600"}`}>{title.length}/200</span>
                  </label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Large pothole on MG Road near HDFC Bank"
                    maxLength={200}
                    className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-all
                      ${errors.title ? "border-red-500/50" : "border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15"}`} />
                  <FieldErr msg={errors.title} />
                </div>

                {/* Description */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                    <span>Description <span className="text-red-400">*</span></span>
                    <span className={`font-normal ${description.length >= 2000 ? "text-red-400" : "text-slate-600"}`}>{description.length}/2000</span>
                  </label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={6} maxLength={2000}
                    placeholder="When did this start? How big is the problem? Impact on residents? Any safety risk?…"
                    className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-all resize-none leading-relaxed
                      ${errors.description ? "border-red-500/50" : "border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/15"}`} />
                  <FieldErr msg={errors.description} />
                </div>

                {/* ── AI Category Result — read-only, appears below description ── */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain size={10} className="text-violet-400" />
                    Category
                    <Lock size={8} className="text-slate-600 ml-1" />
                  </label>

                  <AnimatePresence mode="wait">
                    {textAi ? (
                      <motion.div key="result" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0d1a2e] border border-violet-500/30">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/25">
                            <Brain size={13} className="text-violet-400" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{textAi.category}</p>
                            <p className="text-slate-500 text-xs">{Math.round((textAi.confidence || 0) * 100)}% confidence</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${urgencyPillStyle[textAi.urgency] || urgencyPillStyle.medium}`}>
                          {textAi.urgency}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/3 border border-dashed border-white/10">
                        <Camera size={13} className="text-slate-600 shrink-0" />
                        <p className="text-slate-600 text-sm">Detected from your photo</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: Photos ──────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#0c1220] border border-white/8 rounded-2xl p-6 overflow-y-auto">

                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`p-2 rounded-xl border ${ACCENT.teal.icon}`}>
                    <Camera size={15} className={ACCENT.teal.text} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">Photos ({images.length}/5)</h3>
                </div>

                <div
                  onDrop={handleDrop} onDragOver={handleDragOver}
                  onClick={() => images.length < 5 && document.getElementById("file-input").click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all
                    ${images.length >= 5 ? "border-white/5 opacity-40 pointer-events-none"
                      : "border-white/12 hover:border-teal-500/35 hover:bg-teal-500/3 cursor-pointer group"}`}
                >
                  <input id="file-input" type="file" accept="image/*" multiple className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setImages(prev => [...prev, ...files].slice(0, 5));
                      e.target.value = "";
                    }} />
                  <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-500/10 group-hover:border-teal-500/25 transition-all">
                    <FileImage size={24} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <p className="text-slate-300 text-sm font-medium">{images.length === 0 ? "Click or drag photos here" : "Add more photos"}</p>
                  <p className="text-slate-600 text-xs mt-1.5">PNG, JPG, WebP · Up to 5 images</p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                    {images.map((img, i) => (
                      <ImageCard key={`${img.name}-${i}`} file={img}
                        onRemove={() => setImages(prev => prev.filter((_, j) => j !== i))} />
                    ))}
                  </div>
                )}

              </motion.div>
            )}

            {/* ── STEP 2: Location + Final AI result ──────────────── */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#0c1220] border border-white/8 rounded-2xl p-6 overflow-y-auto">

                {/* Final AI classification card */}
                <AnimatePresence mode="wait">
                  {aiLoading && (
                    <motion.div key="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 mb-5 bg-violet-500/8 border border-violet-500/20 rounded-xl px-4 py-3">
                      <Loader2 size={16} className="animate-spin text-violet-400 shrink-0" />
                      <div>
                        <p className="text-violet-300 text-sm font-semibold">AI Analysing with Photo…</p>
                        <p className="text-slate-500 text-xs">Running visual + text classification</p>
                      </div>
                    </motion.div>
                  )}

                  {!aiLoading && displayAi && (
                    <motion.div key="ai-done" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-5 bg-[#0d1a2e] border border-violet-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Brain size={14} className="text-violet-400" />
                          <span className="text-white text-sm font-semibold">
                            {aiPreview ? "AI Classification (Photo + Text)" : "AI Classification (Text Only)"}
                          </span>
                        </div>
                        <button type="button" onClick={runFullAiPreview} title="Re-run AI"
                          className="text-slate-500 hover:text-violet-400 transition-colors p-1 rounded-lg hover:bg-white/5">
                          <RefreshCw size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-slate-500 text-[11px] mb-1">Category</p>
                          <p className="text-white font-semibold text-sm">{displayAi.category}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{Math.round((displayAi.confidence || 0) * 100)}% confidence</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${urgencyPillStyle[displayAi.urgency] || urgencyPillStyle.medium}`}>
                          <p className="text-[11px] mb-1 opacity-70">Urgency</p>
                          <p className="font-semibold text-sm capitalize">{displayAi.urgency}</p>
                        </div>
                      </div>
                      {displayAi.summary && (
                        <p className="text-slate-400 text-xs italic border-l-2 border-violet-500/40 pl-3">"{displayAi.summary}"</p>
                      )}
                    </motion.div>
                  )}

                  {!aiLoading && aiError && !displayAi && (
                    <motion.div key="ai-err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-5 flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-300 text-xs font-semibold">AI Preview Unavailable</p>
                        <p className="text-slate-500 text-xs">{aiError}</p>
                        <button type="button" onClick={runFullAiPreview}
                          className="text-amber-400 text-xs mt-1 flex items-center gap-1 hover:text-amber-300 transition-colors">
                          <RefreshCw size={10} /> Retry
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Location */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`p-2 rounded-xl border ${ACCENT.amber.icon}`}>
                    <MapPin size={15} className={ACCENT.amber.text} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">Location</h3>
                </div>

                <div className="space-y-3">
                  <button type="button" onClick={detectLocation} disabled={locLoad || geocoding}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-amber-500/8 border border-amber-500/25 text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/40 transition-all text-sm font-semibold disabled:opacity-50">
                    {locLoad    ? <><Loader2 size={15} className="animate-spin" /> Getting GPS…</>
                     : geocoding ? <><Loader2 size={15} className="animate-spin" /> Finding address…</>
                     : <><Navigation size={15} /> Auto-detect My Location</>}
                  </button>

                  {latitude && longitude && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2">
                      <CheckCircle size={12} /> GPS: {latitude}, {longitude}
                    </motion.div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Street Address / Landmark <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                        placeholder="Near HDFC ATM, Brigade Road, Bengaluru, Karnataka"
                        className={`w-full bg-black/40 border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-all
                          ${errors.address ? "border-red-500/50" : "border-white/10 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10"}`} />
                    </div>
                    <FieldErr msg={errors.address} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[["Latitude", latitude, setLatitude, "12.971599"], ["Longitude", longitude, setLongitude, "77.594563"]].map(([lbl, val, setter, ph]) => (
                      <div key={lbl}>
                        <label className="text-xs text-slate-600 block mb-1">{lbl} <span className="text-slate-700 text-[10px]">(optional)</span></label>
                        <input type="text" value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                          className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2 text-slate-300 text-sm outline-none focus:border-white/20 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Severity + Review + Submit ──────────────── */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#0c1220] border border-white/8 rounded-2xl p-6 overflow-y-auto">

                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`p-2 rounded-xl border ${ACCENT.rose.icon}`}>
                    <ShieldAlert size={15} className={ACCENT.rose.text} />
                  </div>
                  <h3 className="text-white font-semibold text-sm">Severity</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {SEVERITIES.map(s => {
                    const isSelected = severity === s.value;
                    const isHinted   = displayAi?.urgency === s.value && !isSelected;
                    return (
                      <button key={s.value} type="button" onClick={() => setSeverity(s.value)}
                        className={`relative p-4 rounded-xl border text-left transition-all ${isSelected ? s.ring : s.base}`}>
                        {isHinted && (
                          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-violet-500 rounded-full border-2 border-[#0c1220]" />
                        )}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${s.dot} ${isSelected ? "opacity-100" : "opacity-35"}`} />
                          <span className="font-semibold text-sm">{s.label}</span>
                          {isSelected && <CheckCircle size={12} className="ml-auto opacity-70" />}
                        </div>
                        <p className="text-xs opacity-55 leading-relaxed">{s.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Final review */}
                <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2 mb-4">
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-2.5">Final Review</p>
                  {[
                    { label: "Title",    value: title || "—" },
                    { label: "Category", value: displayAi?.category || "Will be set after submission" },
                    { label: "Location", value: address || "—" },
                    { label: "Photos",   value: images.length ? `${images.length} attached` : "None" },
                    { label: "GPS",      value: latitude ? `${latitude}, ${longitude}` : "Not captured" },
                    { label: "Severity", value: SEVERITIES.find(s => s.value === severity)?.label || "—" },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 text-xs">
                      <span className="text-slate-600 w-16 shrink-0">{row.label}</span>
                      <span className="text-slate-300 truncate">{row.value}</span>
                    </div>
                  ))}
                </div>

                {(errors.api || errors.detail) && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-3">
                    <AlertTriangle size={14} /> {errors.detail || errors.api}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav footer */}
        <div className="shrink-0 pt-3 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={goBack}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/12 text-slate-400 hover:text-white hover:border-white/25 text-sm font-medium transition-all">
              <ArrowLeft size={15} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} disabled={aiLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${ac.btn} text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg ${ac.glow} disabled:opacity-60`}>
              {aiLoading
                ? <><Loader2 size={15} className="animate-spin" /> AI Analysing…</>
                : <>Continue <ArrowRight size={15} /></>}
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60">
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                : <><CheckCircle size={16} /> Submit Report</>}
            </button>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs pt-2">
          Securely submitted · Category set by AI · Full analysis runs after submission
        </p>
      </div>
    </div>
  );
}
