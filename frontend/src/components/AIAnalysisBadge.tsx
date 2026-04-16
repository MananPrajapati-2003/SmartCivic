/**
 * AIAnalysisBadge — displays the AI processing status on an issue card.
 *
 * Shows:
 *   🤖 AI Analysing…   (while pending/processing)
 *   Priority X/10 · label · category   (when done)
 *   ⚠ AI Analysis Failed               (when failed)
 *
 * Usage:
 *   <AIAnalysisBadge issueId={issue.id} initialStatus={issue.ai_status} />
 */
import React, { useEffect, useRef } from "react";
import { useAIStatus, type AIStatus } from "../hooks/useAIStatus";


interface Props {
  issueId: number;
  initialStatus?: AIStatus;
  onDone?: () => void;
}

const URGENCY_COLORS: Record<string, string> = {
  Critical: "#dc2626",   // red-600
  High:     "#ea580c",   // orange-600
  Medium:   "#ca8a04",   // yellow-600
  Low:      "#16a34a",   // green-600
};

const SENTIMENT_ICON: Record<string, string> = {
  negative: "😡",
  neutral:  "😐",
  positive: "😊",
};

export const AIAnalysisBadge: React.FC<Props> = ({ issueId, initialStatus = "pending", onDone }) => {
  // Always pass issueId — hook fetches once when already "done" to get the result data
  const { aiStatus, aiResult } = useAIStatus(issueId);

  const effectiveStatus = aiStatus === "pending" && initialStatus === "done" ? "done" : aiStatus;

  // Fire onDone only when status *transitions* to "done" (not on every render)
  const prevStatusRef = useRef<string>(initialStatus ?? "pending");
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = effectiveStatus;
    if (effectiveStatus === "done" && prev !== "done") {
      onDone?.();
    }
  }, [effectiveStatus]); // intentionally omit onDone to avoid re-firing on re-renders

  // ── Processing / Pending ─────────────────────────────────────────────────
  if (effectiveStatus === "pending" || effectiveStatus === "processing") {
    return (
      <span style={styles.base}>
        <span style={styles.spinner}>⏳</span>
        {" "}AI Analysing…
      </span>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (effectiveStatus === "failed") {
    return (
      <span style={{ ...styles.base, backgroundColor: "#fef2f2", color: "#dc2626" }}>
        ⚠ AI Analysis Failed
      </span>
    );
  }

  // ── Done — show rich badge ────────────────────────────────────────────────
  if (!aiResult) return null;

  const color = URGENCY_COLORS[aiResult.priority_label] ?? "#6b7280";
  const sentimentIcon = SENTIMENT_ICON[aiResult.sentiment] ?? "😐";

  return (
    <div style={styles.doneContainer}>
      {/* Priority pill */}
      <span style={{ ...styles.pill, backgroundColor: color }}>
        🎯 {aiResult.priority_score}/10 — {aiResult.priority_label}
      </span>

      {/* Category & routing */}
      <span style={styles.meta}>
        📂 {aiResult.predicted_category}
        {" · "}
        {aiResult.routing_target === "government" ? "🏛 Government" : "🤝 NGO"}
        {" · "}
        SLA {aiResult.sla_hours}h
      </span>

      {/* Sentiment */}
      <span style={styles.meta}>
        {sentimentIcon} {aiResult.sentiment}
        {aiResult.nlp_summary && ` — "${aiResult.nlp_summary}"`}
      </span>

      {/* Admin alert */}
      {aiResult.alert_admin && (
        <span style={styles.alertBadge}>🚨 Authority Alerted</span>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    border: "1px solid #bae6fd",
  },
  spinner: {
    display: "inline-block",
    animation: "spin 1.5s linear infinite",
  },
  doneContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "6px",
  },
  pill: {
    display: "inline-flex",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#fff",
    width: "fit-content",
  },
  meta: {
    fontSize: "11px",
    color: "#6b7280",
  },
  alertBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    width: "fit-content",
  },
};

export default AIAnalysisBadge;
