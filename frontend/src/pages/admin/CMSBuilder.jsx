/**
 * CMS Page Builder — Super Admin only.
 *
 * Left panel : page picker + "New page" button
 * Right panel: block list with drag handles + "Add block" toolbar
 * Modal      : block editor (type-specific form fields)
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Edit2, Eye, EyeOff, GripVertical,
  ChevronDown, Loader2, AlertTriangle, CheckCircle,
  Type, CreditCard, Image, List, CheckSquare, Minus, Table2, Globe, Lock
} from "lucide-react";
import api from "../../api/axiosInstance";

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCK_ICONS = {
  text:     <Type size={14} />,
  card:     <CreditCard size={14} />,
  image:    <Image size={14} />,
  dropdown: <List size={14} />,
  checkbox: <CheckSquare size={14} />,
  divider:  <Minus size={14} />,
  heading:  <Type size={14} className="font-black" />,
  table:    <Table2 size={14} />,
};

const BLOCK_LABELS = {
  text:     "Text",
  card:     "Card",
  image:    "Image",
  dropdown: "Accordion",
  checkbox: "Checklist",
  divider:  "Divider",
  heading:  "Heading",
  table:    "Table",
};

const BUILT_IN_SLOTS = [
  { label: "SLA Page",     slug: "sla",     slot: "sla"     },
  { label: "Contact Page", slug: "contact", slot: "contact" },
  { label: "About Page",   slug: "about",   slot: "about"   },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function Tag({ children, color = "slate" }) {
  const map = {
    cyan:    "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    violet:  "bg-violet-500/10 text-violet-400 border-violet-500/25",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    amber:   "bg-amber-500/10 text-amber-400 border-amber-500/25",
    slate:   "bg-white/5 text-slate-400 border-white/10",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[color]}`}>{children}</span>
  );
}

function Toast({ msg, ok }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
        ${ok ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
             : "bg-red-500/20 border border-red-500/30 text-red-300"}`}>
      {ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </motion.div>
  );
}

// ── Block content editor forms ────────────────────────────────────────────────

function BlockEditor({ type, content, onChange }) {
  const set = (key, val) => onChange({ ...content, [key]: val });

  if (type === "heading") return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Level</label>
        <select value={content.level || 2} onChange={e => set("level", Number(e.target.value))}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none">
          <option value={2}>H2 — Section</option>
          <option value={3}>H3 — Sub-section</option>
          <option value={4}>H4 — Small</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Text</label>
        <input value={content.text || ""} onChange={e => set("text", e.target.value)}
          placeholder="Heading text…"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
      </div>
    </div>
  );

  if (type === "text") return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">Content</label>
      <textarea value={content.text || ""} onChange={e => set("text", e.target.value)}
        rows={6} placeholder="Your text content…"
        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 resize-none" />
    </div>
  );

  if (type === "card") return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Title</label>
        <input value={content.title || ""} onChange={e => set("title", e.target.value)}
          placeholder="Card title"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Body</label>
        <textarea value={content.body || ""} onChange={e => set("body", e.target.value)}
          rows={4} placeholder="Card body text"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 resize-none" />
      </div>
    </div>
  );

  if (type === "image") return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Image URL</label>
        <input value={content.url || ""} onChange={e => set("url", e.target.value)}
          placeholder="https://…/image.jpg"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Alt text</label>
        <input value={content.alt || ""} onChange={e => set("alt", e.target.value)}
          placeholder="Descriptive alt text"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Caption (optional)</label>
        <input value={content.caption || ""} onChange={e => set("caption", e.target.value)}
          placeholder="Image caption"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
      </div>
    </div>
  );

  if (type === "dropdown") {
    const items = content.items || [{ question: "", answer: "" }];
    const setItems = v => set("items", v);
    return (
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white/4 rounded-xl p-3 space-y-2">
            <input value={item.question} onChange={e => { const n = [...items]; n[i] = { ...n[i], question: e.target.value }; setItems(n); }}
              placeholder={`Question ${i + 1}`}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
            <textarea value={item.answer} onChange={e => { const n = [...items]; n[i] = { ...n[i], answer: e.target.value }; setItems(n); }}
              rows={2} placeholder="Answer"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 resize-none" />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1">
              <Trash2 size={10} /> Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, { question: "", answer: "" }])}
          className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1">
          <Plus size={10} /> Add item
        </button>
      </div>
    );
  }

  if (type === "checkbox") {
    const items = content.items || [""];
    const setItems = v => set("items", v);
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; setItems(n); }}
              placeholder={`Item ${i + 1}`}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
            <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-300 p-2">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, ""])}
          className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1">
          <Plus size={10} /> Add item
        </button>
      </div>
    );
  }

  if (type === "table") {
    const headers = content.headers || ["Column 1", "Column 2"];
    const rows    = content.rows    || [["", ""]];
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-2">Headers</label>
          <div className="flex gap-2 flex-wrap">
            {headers.map((h, i) => (
              <input key={i} value={h} onChange={e => { const n = [...headers]; n[i] = e.target.value; set("headers", n); set("rows", rows.map(r => r.length < n.length ? [...r, ""] : r)); }}
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-cyan-500/50 w-28" />
            ))}
            <button type="button" onClick={() => { set("headers", [...headers, `Col ${headers.length + 1}`]); set("rows", rows.map(r => [...r, ""])); }}
              className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1 px-2">
              <Plus size={10} /> Col
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-2">Rows</label>
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-2 mb-1.5 items-center">
              {row.map((cell, ci) => (
                <input key={ci} value={cell} onChange={e => { const n = rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? e.target.value : c) : r); set("rows", n); }}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-cyan-500/50" />
              ))}
              <button type="button" onClick={() => set("rows", rows.filter((_, i) => i !== ri))}
                className="text-red-400 hover:text-red-300"><Trash2 size={11} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set("rows", [...rows, headers.map(() => "")])}
            className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1">
            <Plus size={10} /> Add row
          </button>
        </div>
      </div>
    );
  }

  if (type === "divider") return (
    <p className="text-slate-500 text-sm">A horizontal rule will be inserted.</p>
  );

  return <p className="text-slate-500 text-sm">No editor for this block type.</p>;
}

// ── Block Modal ───────────────────────────────────────────────────────────────

function BlockModal({ initial, onSave, onClose, saving }) {
  const [type,    setType]    = useState(initial?.block_type || "text");
  const [content, setContent] = useState(initial?.content   || {});
  const [order,   setOrder]   = useState(initial?.order      ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0c1220] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-white font-semibold text-sm">{initial ? "Edit Block" : "Add Block"}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/8 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Type picker */}
          {!initial && (
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Block Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(BLOCK_LABELS).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => { setType(k); setContent({}); }}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all
                      ${type === k ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-400" : "border-white/8 text-slate-500 hover:border-white/20 hover:text-slate-300"}`}>
                    {BLOCK_ICONS[k]} {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Order */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Position (order index)</label>
            <input type="number" value={order} min={0} onChange={e => setOrder(Number(e.target.value))}
              className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
          </div>

          {/* Content editor */}
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Content</label>
            <BlockEditor type={type} content={content} onChange={setContent} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/12 text-slate-400 hover:text-white text-sm transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave({ block_type: type, content, order })} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle size={14} /> Save Block</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── New Page Modal ────────────────────────────────────────────────────────────

function NewPageModal({ onSave, onClose, saving }) {
  const [name,   setName]   = useState("");
  const [isPubl, setIsPubl] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0c1220] border border-white/10 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-white font-semibold text-sm">New Custom Page</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Page Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. How It Works"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50" />
            {name && (
              <p className="text-slate-500 text-xs mt-1">URL: <span className="text-cyan-400">/pages/{name.toLowerCase().replace(/\s+/g, "-")}</span></p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPubl} onChange={e => setIsPubl(e.target.checked)}
              className="accent-cyan-500 w-4 h-4" />
            <span className="text-slate-300 text-sm">Publicly visible</span>
          </label>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/12 text-slate-400 hover:text-white text-sm">Cancel</button>
          <button onClick={() => onSave({ name, slot: "custom", is_public: isPubl })} disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Page
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CMSBuilder() {
  const [pages,       setPages]       = useState([]);
  const [activePage,  setActivePage]  = useState(null);  // full page object with blocks
  const [loading,     setLoading]     = useState(true);
  const [blockModal,  setBlockModal]  = useState(null);  // null | { block? } (edit) | {} (add)
  const [newPageModal,setNewPageModal]= useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Load page list
  useEffect(() => {
    api.get("/cms/pages/")
      .then(r => setPages(r.data))
      .catch(() => showToast("Failed to load pages.", false))
      .finally(() => setLoading(false));
  }, []);

  const loadPage = useCallback((slug) => {
    setActivePage(null);
    api.get(`/cms/pages/${slug}/`)
      .then(r => setActivePage(r.data))
      .catch(() => showToast("Failed to load page.", false));
  }, []);

  // Ensure built-in pages exist (create on first visit if missing)
  const ensureBuiltIn = useCallback(async (slot) => {
    const exists = pages.find(p => p.slot === slot);
    if (exists) { loadPage(exists.slug); return; }
    try {
      const label = BUILT_IN_SLOTS.find(s => s.slot === slot)?.label || slot;
      const r = await api.post("/cms/pages/", { name: label, slug: slot, slot, is_builtin: true, is_public: true });
      setPages(prev => [...prev, r.data]);
      loadPage(r.data.slug);
    } catch { showToast("Could not initialise page.", false); }
  }, [pages, loadPage]);

  const handleSelectSlot = (slot) => ensureBuiltIn(slot);
  const handleSelectCustom = (slug) => loadPage(slug);

  // Create new custom page
  const handleCreatePage = async ({ name, slot, is_public }) => {
    setSaving(true);
    try {
      const r = await api.post("/cms/pages/", { name, slot, is_public });
      setPages(prev => [...prev, r.data]);
      setNewPageModal(false);
      loadPage(r.data.slug);
      showToast("Page created.");
    } catch { showToast("Failed to create page.", false); }
    finally { setSaving(false); }
  };

  // Save block (add or edit)
  const handleSaveBlock = async (blockData) => {
    if (!activePage) return;
    setSaving(true);
    try {
      if (blockModal?.block?.id) {
        // Edit existing
        const r = await api.patch(`/cms/blocks/${blockModal.block.id}/`, blockData);
        setActivePage(prev => ({
          ...prev,
          blocks: prev.blocks.map(b => b.id === r.data.id ? r.data : b),
        }));
        showToast("Block updated.");
      } else {
        // Add new
        const r = await api.post("/cms/blocks/", { ...blockData, page: activePage.id });
        setActivePage(prev => ({
          ...prev,
          blocks: [...prev.blocks, r.data].sort((a, b) => a.order - b.order),
        }));
        showToast("Block added.");
      }
      setBlockModal(null);
    } catch { showToast("Failed to save block.", false); }
    finally { setSaving(false); }
  };

  // Toggle block visibility
  const handleToggleVisible = async (block) => {
    try {
      const r = await api.patch(`/cms/blocks/${block.id}/`, { is_visible: !block.is_visible });
      setActivePage(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => b.id === r.data.id ? r.data : b),
      }));
    } catch { showToast("Failed to update block.", false); }
  };

  // Delete block
  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm("Delete this block?")) return;
    try {
      await api.delete(`/cms/blocks/${blockId}/`);
      setActivePage(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== blockId) }));
      showToast("Block deleted.");
    } catch { showToast("Failed to delete block.", false); }
  };

  // Move block up/down (simple reorder via order field)
  const handleMove = async (index, dir) => {
    const blocks = [...(activePage?.blocks || [])];
    const swap = index + dir;
    if (swap < 0 || swap >= blocks.length) return;
    [blocks[index].order, blocks[swap].order] = [blocks[swap].order, blocks[index].order];
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    setActivePage(prev => ({ ...prev, blocks: sorted }));
    try {
      await api.post("/cms/blocks/reorder/", { order: sorted.map(b => b.id) });
    } catch { showToast("Reorder failed.", false); }
  };

  // Toggle page public/private visibility
  const handleTogglePagePublic = async () => {
    if (!activePage) return;
    const newVal = !activePage.is_public;
    try {
      await api.patch(`/cms/pages/${activePage.slug}/`, { is_public: newVal });
      setActivePage(prev => ({ ...prev, is_public: newVal }));
      setPages(prev => prev.map(p => p.slug === activePage.slug ? { ...p, is_public: newVal } : p));
      showToast(newVal ? "Page is now public — visible in navbar." : "Page hidden — removed from navbar.");
    } catch { showToast("Failed to update visibility.", false); }
  };

  // Delete custom page
  const handleDeletePage = async () => {
    if (!activePage || activePage.is_builtin) return;
    if (!window.confirm(`Delete page "${activePage.name}"? This removes all its blocks.`)) return;
    try {
      await api.delete(`/cms/pages/${activePage.slug}/`);
      setPages(prev => prev.filter(p => p.slug !== activePage.slug));
      setActivePage(null);
      showToast("Page deleted.");
    } catch { showToast("Failed to delete page.", false); }
  };

  const customPages = pages.filter(p => p.slot === "custom");

  return (
    <div className="min-h-screen bg-[#070b14] flex">

      {/* ── Left sidebar: page picker ── */}
      <div className="w-64 shrink-0 bg-[#0c1220] border-r border-white/8 flex flex-col">
        <div className="px-5 py-5 border-b border-white/8">
          <h2 className="text-white font-bold text-sm">Page Builder</h2>
          <p className="text-slate-500 text-xs mt-0.5">Select a page to edit</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Built-in pages */}
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-2 pt-2 pb-1">Built-in Pages</p>
          {BUILT_IN_SLOTS.map(s => (
            <button key={s.slot} onClick={() => handleSelectSlot(s.slot)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all
                ${activePage?.slot === s.slot
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Globe size={13} className="shrink-0" /> {s.label}
            </button>
          ))}

          {/* Custom pages */}
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-2 pt-4 pb-1">Custom Pages</p>
          {loading && <p className="text-slate-600 text-xs px-3">Loading…</p>}
          {customPages.map(p => (
            <button key={p.slug} onClick={() => handleSelectCustom(p.slug)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all
                ${activePage?.slug === p.slug
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Lock size={13} className={`shrink-0 ${p.is_public ? "text-emerald-400" : "text-slate-600"}`} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
          {!loading && customPages.length === 0 && (
            <p className="text-slate-600 text-xs px-3 italic">No custom pages yet</p>
          )}
        </div>

        {/* New page button */}
        <div className="p-3 border-t border-white/8">
          <button onClick={() => setNewPageModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={14} /> New Page
          </button>
        </div>
      </div>

      {/* ── Right panel: block editor ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {!activePage ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
              <Table2 size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold">Select a page</p>
            <p className="text-slate-600 text-sm mt-1">Choose from the left panel to start editing</p>
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className="shrink-0 bg-[#0c1220] border-b border-white/8 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-white font-bold text-sm">{activePage.name}</h3>
                  <Tag color={activePage.is_builtin ? "cyan" : "violet"}>
                    {activePage.is_builtin ? "Built-in" : "Custom"}
                  </Tag>
                  <Tag color={activePage.is_public ? "emerald" : "amber"}>
                    {activePage.is_public ? "Public" : "Private"}
                  </Tag>
                </div>
                <p className="text-slate-500 text-xs flex items-center gap-2">
                  <a
                    href={activePage.slot === "sla" ? "/sla" : activePage.slot === "contact" ? "/contact" : activePage.slot === "about" ? "/about" : `/pages/${activePage.slug}`}
                    target="_blank" rel="noreferrer"
                    className="text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
                  >
                    {activePage.slot === "sla" ? "/sla" : activePage.slot === "contact" ? "/contact" : activePage.slot === "about" ? "/about" : `/pages/${activePage.slug}`}
                  </a>
                  · {activePage.blocks?.length || 0} blocks
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!activePage.is_builtin && (
                  <>
                    <button onClick={handleTogglePagePublic}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all
                        ${activePage.is_public
                          ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          : "border-slate-500/30 text-slate-400 hover:bg-white/5"}`}>
                      {activePage.is_public ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Hidden</>}
                    </button>
                    <button onClick={handleDeletePage}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors">
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
                <button onClick={() => setBlockModal({})}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90">
                  <Plus size={14} /> Add Block
                </button>
              </div>
            </div>

            {/* Block list */}
            <div className="flex-1 overflow-y-auto p-6">
              {activePage.blocks?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-slate-500 text-sm">No blocks yet.</p>
                  <button onClick={() => setBlockModal({})}
                    className="mt-3 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-sm">
                    <Plus size={14} /> Add the first block
                  </button>
                </div>
              )}

              <div className="space-y-3 max-w-2xl">
                <AnimatePresence>
                  {(activePage.blocks || []).map((block, i) => (
                    <motion.div key={block.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className={`bg-[#0c1220] border rounded-2xl p-4 flex gap-3 items-start
                        ${block.is_visible ? "border-white/8" : "border-white/4 opacity-50"}`}>
                      {/* Drag handle / reorder */}
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button onClick={() => handleMove(i, -1)} disabled={i === 0}
                          className="text-slate-600 hover:text-white disabled:opacity-20 leading-none">▲</button>
                        <GripVertical size={14} className="text-slate-600 mx-auto" />
                        <button onClick={() => handleMove(i, 1)} disabled={i === (activePage.blocks.length - 1)}
                          className="text-slate-600 hover:text-white disabled:opacity-20 leading-none">▼</button>
                      </div>

                      {/* Block info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-400">{BLOCK_ICONS[block.block_type]}</span>
                          <span className="text-white text-xs font-semibold">{BLOCK_LABELS[block.block_type]}</span>
                          <span className="text-slate-600 text-[10px]">#{block.order}</span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">
                          {block.content?.text || block.content?.title || block.content?.url || JSON.stringify(block.content).slice(0, 60)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleVisible(block)} title={block.is_visible ? "Hide" : "Show"}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
                          {block.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button onClick={() => setBlockModal({ block })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-white/8 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/8 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {blockModal !== null && (
          <BlockModal
            initial={blockModal.block}
            onSave={handleSaveBlock}
            onClose={() => setBlockModal(null)}
            saving={saving}
          />
        )}
        {newPageModal && (
          <NewPageModal
            onSave={handleCreatePage}
            onClose={() => setNewPageModal(false)}
            saving={saving}
          />
        )}
        {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      </AnimatePresence>
    </div>
  );
}
