/**
 * DynamicPage — renders any CMS custom page at /p/:slug
 * Fetches blocks from /api/cms/pages/:slug/ and renders each block type.
 */
import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors">
        <span className="text-white font-medium text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/6">{a}</div>
      )}
    </div>
  );
}

function Block({ block }) {
  const { block_type: type, content } = block;

  if (type === "heading") {
    const Tag = content.level === 3 ? "h3" : content.level === 4 ? "h4" : "h2";
    const sz  = content.level === 3 ? "text-xl" : content.level === 4 ? "text-lg" : "text-2xl";
    return <Tag className={`text-white font-bold ${sz} mb-2`}>{content.text}</Tag>;
  }
  if (type === "text") {
    return <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{content.text}</p>;
  }
  if (type === "card") {
    return (
      <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
        {content.title && <p className="text-white font-semibold mb-1">{content.title}</p>}
        {content.body  && <p className="text-slate-400 text-sm leading-relaxed">{content.body}</p>}
      </div>
    );
  }
  if (type === "image") {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <img src={content.url} alt={content.alt || ""} className="w-full object-cover" />
        {content.caption && <p className="text-slate-500 text-xs text-center py-2">{content.caption}</p>}
      </div>
    );
  }
  if (type === "dropdown") {
    return (
      <div className="space-y-2">
        {(content.items || []).map((item, i) => (
          <FAQItem key={i} q={item.question} a={item.answer} />
        ))}
      </div>
    );
  }
  if (type === "checkbox") {
    return (
      <ul className="space-y-2">
        {(content.items || []).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
            <ShieldCheck size={14} className="text-emerald-400 mt-0.5 shrink-0" /> {item}
          </li>
        ))}
      </ul>
    );
  }
  if (type === "divider") return <hr className="border-white/10 my-2" />;
  if (type === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              {(content.headers || []).map((h, i) => (
                <th key={i} className="text-slate-300 font-semibold px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(content.rows || []).map((row, i) => (
              <tr key={i} className="border-t border-white/6 hover:bg-white/3">
                {row.map((cell, j) => <td key={j} className="text-slate-400 px-4 py-3">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

export default function DynamicPage() {
  const { slug } = useParams();
  const [page,    setPage]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/cms/pages/${slug}/`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setPage(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-cyan-400" />
    </div>
  );

  if (notFound || !page) return <Navigate to="/" replace />;

  const blocks = (page.blocks || []).filter(b => b.is_visible);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-transparent to-violet-500/8 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center relative">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {page.name}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-14">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle size={28} className="text-slate-600 mb-3" />
            <p className="text-slate-500">This page has no content yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {blocks.map((block, i) => (
              <motion.div key={block.id}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <Block block={block} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
