import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Upload, AlertTriangle, FileText, Type,
  CheckCircle, Loader2, X, Bot, ChevronRight
} from "lucide-react";
import api from "../api/axiosInstance";

const SEVERITY_LEVELS = [
  { value: "low",      label: "Low",      color: "text-emerald-400" },
  { value: "medium",   label: "Medium",   color: "text-amber-400"   },
  { value: "high",     label: "High",     color: "text-orange-400"  },
  { value: "critical", label: "Critical", color: "text-red-400"     },
];

const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

const inputCls = "w-full bg-[#0c1220] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all";

export default function ReportIssue() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category_id: "",
    description: "",
    location_address: "",
    latitude: "",
    longitude: "",
    severity: "medium",
  });
  const [images, setImages] = useState([]);          // File[]
  const [errors, setErrors] = useState({});
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);  // issued issue object on success
  const [serverError, setServerError] = useState("");

  // Load categories from backend
  useEffect(() => {
    api.get("/issues/categories/")
      .then(r => setCategories(r.data))
      .catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5)
      e.title = "Title must be at least 5 characters.";
    if (!form.category_id)
      e.category_id = "Please select a category.";
    if (!form.description.trim() || form.description.trim().length < 20)
      e.description = "Description must be at least 20 characters.";
    if (!form.location_address.trim())
      e.location_address = "Address is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLocationClick = () => {
    if (!("geolocation" in navigator)) {
      setErrors(e => ({ ...e, location_address: "Geolocation is not supported by your browser." }));
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLoadingLoc(false);
      },
      () => {
        setLoadingLoc(false);
        setErrors(e => ({ ...e, location_address: "Location access denied. Please type your address manually." }));
      },
      { timeout: 8000 }
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (idx) =>
    setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("category_id", form.category_id);
      fd.append("description", form.description.trim());
      fd.append("location_address", form.location_address.trim());
      fd.append("severity", form.severity);
      if (form.latitude)  fd.append("latitude", form.latitude);
      if (form.longitude) fd.append("longitude", form.longitude);
      images.forEach(img => fd.append("images", img));

      const { data } = await api.post("/issues/", fd);

      setSubmitted(data);
      // Scroll to top to show success banner
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const detail = err?.response?.data;
      if (typeof detail === "object" && detail !== null) {
        // Field-level errors from DRF
        const fieldErrors = {};
        for (const [key, val] of Object.entries(detail)) {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val;
        }
        setErrors(fieldErrors);
      } else {
        setServerError("Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Issue Submitted!</h1>
            <p className="text-slate-400 text-sm">
              Your issue has been received. Our AI is now analysing it — you'll see the
              priority score and routing decision shortly.
            </p>
          </div>

          {/* AI processing notice */}
          <div className="flex items-center gap-3 bg-cyan-500/8 border border-cyan-500/20 rounded-2xl px-4 py-3 text-left">
            <Bot size={18} className="text-cyan-400 shrink-0" />
            <div>
              <p className="text-cyan-300 text-xs font-semibold">AI Analysis Queued</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Severity scoring, category detection & routing are running in the background.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              View My Issues <ChevronRight size={14} />
            </button>
            <button
              onClick={() => {
                setSubmitted(null);
                setForm({ title: "", category_id: "", description: "", location_address: "", latitude: "", longitude: "", severity: "medium" });
                setImages([]);
              }}
              className="py-3 rounded-xl bg-white/6 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
            >
              Report Another
            </button>
          </div>

          <p className="text-slate-600 text-xs">Issue #{submitted.id} · Status: Pending Review</p>
        </motion.div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070b14] text-white pt-20 px-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-3">
            Report a Civic Issue
          </h1>
          <p className="text-slate-400 text-sm">
            Submitted issues are instantly picked up by our AI for priority scoring &amp; routing.
          </p>
        </div>

        {serverError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}
          className="bg-[#0c1220]/80 border border-white/8 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl"
        >
          {/* Title + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Issue Title" error={errors.title}>
              <div className="relative">
                <Type size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="e.g. Broken streetlight near park"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
            </Field>

            <Field label="Category" error={errors.category_id}>
              <div className="relative">
                <AlertTriangle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  className={`${inputCls} pl-9 [&>option]:bg-[#0c1220]`}
                  value={form.category_id}
                  onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                >
                  <option value="">Select category…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </Field>
          </div>

          {/* Description */}
          <Field label="Description" error={errors.description}>
            <div className="relative">
              <FileText size={14} className="absolute left-3.5 top-3 text-slate-500" />
              <textarea
                rows={4}
                className={`${inputCls} pl-9 resize-none`}
                placeholder="Describe the issue — location details, duration, impact on people…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <p className={`text-xs mt-1 ${form.description.length < 20 ? "text-slate-600" : "text-emerald-600"}`}>
              {form.description.length}/20 minimum characters
            </p>
          </Field>

          {/* Location */}
          <div className="space-y-4 pt-4 border-t border-white/6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Location</h3>
              <button type="button" onClick={handleLocationClick} disabled={loadingLoc}
                className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                {loadingLoc
                  ? <><Loader2 size={12} className="animate-spin" /> Detecting…</>
                  : <><MapPin size={12} /> Use My Location</>}
              </button>
            </div>

            <Field label="Address / Landmark" error={errors.location_address}>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="e.g. Near Central Park Gate 2, Bandra West"
                  value={form.location_address}
                  onChange={e => setForm(p => ({ ...p, location_address: e.target.value }))}
                />
              </div>
            </Field>

            {(form.latitude || form.longitude) && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input readOnly className={`${inputCls} opacity-50 cursor-default`} value={form.latitude} />
                </Field>
                <Field label="Longitude">
                  <input readOnly className={`${inputCls} opacity-50 cursor-default`} value={form.longitude} />
                </Field>
              </div>
            )}
          </div>

          {/* Severity + Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/6">
            <Field label="Severity">
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_LEVELS.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setForm(p => ({ ...p, severity: s.value }))}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                      form.severity === s.value
                        ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                        : "border-white/8 bg-white/3 text-slate-400 hover:border-white/20"
                    }`}>
                    <span className={s.color}>{s.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`Photos (${images.length}/5)`}>
              <div className="relative min-h-[100px] border border-dashed border-white/15 rounded-xl bg-white/3 hover:border-cyan-500/40 transition-colors flex flex-wrap gap-2 p-2 items-start">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 shrink-0">
                    <img src={URL.createObjectURL(img)} alt=""
                      className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X size={9} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-16 h-16 flex flex-col items-center justify-center border border-dashed border-white/15 rounded-lg cursor-pointer hover:border-cyan-500/40 text-slate-600 hover:text-cyan-400 transition-colors shrink-0">
                    <Upload size={16} />
                    <span className="text-[10px] mt-1">Add</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </Field>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-base bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              : "Submit Issue Report"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
