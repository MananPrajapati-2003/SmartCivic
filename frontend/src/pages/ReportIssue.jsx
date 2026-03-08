import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Upload, AlertTriangle, FileText, Type } from "lucide-react";

// Mock Categories based on standard civic issues
const CATEGORIES = [
  { id: 1, name: "Roads & Potholes" },
  { id: 2, name: "Garbage & Sanitation" },
  { id: 3, name: "Streetlights" },
  { id: 4, name: "Water Supply" },
  { id: 5, name: "Traffic & Parking" },
  { id: 6, name: "Public Safety" },
];

const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];

/* Reusable Input Component */
const Input = ({ icon, label, error, ...props }) => (
  <div className="space-y-1">
    <label className="text-sm text-slate-400 ml-1">{label}</label>
    <div className="flex items-center gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2">
      <span className="text-indigo-400">{icon}</span>
      <input
        {...props}
        className="bg-transparent outline-none text-white w-full text-sm placeholder:text-slate-600"
      />
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

const ReportIssue = () => {
  const [form, setForm] = useState({
    title: "",
    category_id: "", // reported_by FK
    description: "",
    location_address: "",
    latitude: "",
    longitude: "",
    severity_level: "Low",
    issue_image: "",
  });

  const [errors, setErrors] = useState({});
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Validate form based on schema constraints
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.category_id) e.category_id = "Category is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.location_address.trim()) e.location_address = "Address is required";
    
    // Latitude/Longitude are optional in schema (nullable), but good to have.
    // severity_level is nullable but we default to Low.
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLocationClick = () => {
    if ("geolocation" in navigator) {
      setLoadingLoc(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          setLoadingLoc(false);
        },
        (error) => {
          alert("Error getting location: " + error.message);
          setLoadingLoc(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Mock uploading
      setForm({ ...form, issue_image: file.name });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Payload matching CivicIssue Schema
    const payload = {
      reported_by: parseInt(form.category_id), // FK
      title: form.title,
      description: form.description,
      issue_image: form.issue_image || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      location_address: form.location_address,
      severity_level: form.severity_level,
      current_status: "Open", // Default
    };

    console.log("REPORT ISSUE PAYLOAD 👉", payload);

    alert("Your issue has been submitted successfully!");

    // Clear form
    setForm({
      title: "",
      category_id: "",
      description: "",
      location_address: "",
      latitude: "",
      longitude: "",
      severity_level: "Low",
      issue_image: "",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-purple-500 mb-4">
            Report a Civic Issue
          </h1>
          <p className="text-slate-400">
            Help us build a better city by reporting issues in your neighborhood.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0f0f12] border border-white/10 rounded-2xl p-8 shadow-xl space-y-6"
        >
          {/* Section: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Issue Title"
              icon={<Type size={18} />}
              placeholder="e.g. Broken Streetlight"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={errors.title}
            />

            <div className="space-y-1">
              <label className="text-sm text-slate-400 ml-1">Category</label>
              <div className="flex items-center gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2">
                <AlertTriangle className="text-indigo-400" size={18} />
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="bg-transparent outline-none text-white w-full text-sm [&>option]:bg-black"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category_id && <p className="text-red-400 text-xs">{errors.category_id}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm text-slate-400 ml-1">Description</label>
            <div className="flex gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2">
              <FileText className="text-indigo-400 mt-1" size={18} />
              <textarea
                rows={4}
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-transparent outline-none text-white w-full text-sm resize-none placeholder:text-slate-600"
              />
            </div>
            {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
          </div>

          {/* Location Section */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Location Details</h3>
              <button
                type="button"
                onClick={handleLocationClick}
                disabled={loadingLoc}
                className="flex items-center gap-2 text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full hover:bg-cyan-500/20 transition-colors"
              >
                <MapPin size={14} />
                {loadingLoc ? "Detecting..." : "Get My Location"}
              </button>
            </div>

            <Input
              label="Address / Landmark"
              icon={<MapPin size={18} />}
              placeholder="e.g. Near Central Park Gate 2"
              value={form.location_address}
              onChange={(e) => setForm({ ...form, location_address: e.target.value })}
              error={errors.location_address}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                icon={<MapPin size={18} />}
                placeholder="0.000000"
                value={form.latitude}
                readOnly
                className="opacity-60 cursor-not-allowed"
              />
              <Input
                label="Longitude"
                icon={<MapPin size={18} />}
                placeholder="0.000000"
                value={form.longitude}
                readOnly
                className="opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Media & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <label className="text-sm text-slate-400 ml-1">Severity Level</label>
              <div className="flex items-center gap-2 bg-black border border-indigo-500/30 rounded-lg px-3 py-2">
                <AlertTriangle className="text-red-400" size={18} />
                <select
                  value={form.severity_level}
                  onChange={(e) => setForm({ ...form, severity_level: e.target.value })}
                  className="bg-transparent outline-none text-white w-full text-sm [&>option]:bg-black"
                >
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-400 ml-1">Upload Image</label>
              <div 
                className="relative flex flex-col items-center justify-center gap-2 bg-black border border-dashed border-indigo-500/30 rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition-colors"
                style={{ minHeight: "120px" }}
              >
                {form.issue_image && typeof form.issue_image !== 'string' ? (
                  <div className="relative w-full h-full">
                     <img 
                       src={URL.createObjectURL(form.issue_image)} 
                       alt="Preview" 
                       className="w-full h-48 object-cover rounded-md"
                     />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                        <span className="text-xs text-white">Click to change</span>
                     </div>
                  </div>
                ) : (
                  <>
                    <Upload className="text-indigo-400" size={24} />
                    <span className="text-sm text-slate-500 text-center">
                       {form.issue_image ? form.issue_image : "Click to upload image"}
                    </span>
                  </>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        setForm({...form, issue_image: file});
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 mt-6 rounded-xl font-bold text-lg shadow-lg
            bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white"
          >
            Submit Report
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ReportIssue;
