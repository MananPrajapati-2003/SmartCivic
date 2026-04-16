/**
 * useAIStatus — React hook for polling the AI analysis state of a civic issue.
 *
 * Polls GET /api/ai/status/<issueId>/ every 3 seconds until the AI job is
 * either "done" or "failed", then stops automatically.
 *
 * Usage:
 *   const { aiStatus, aiResult } = useAIStatus(issue.id);
 */
import { useEffect, useRef, useState } from "react";
import api from "../api/axiosInstance";   // your existing Axios instance

export type AIStatus = "pending" | "processing" | "done" | "failed";

export interface AIResult {
  predicted_category: string;
  category_confidence: number;
  nlp_summary: string;
  sentiment: "positive" | "negative" | "neutral";
  urgency_level: "low" | "medium" | "high" | "critical";
  nlp_score: number;
  damage_type: string;
  visual_score: number | null;
  priority_score: number;   // 0–10 weighted final score
  priority_label: "Low" | "Medium" | "High" | "Critical";
  routing_target: "government" | "ngo";
  sla_hours: number;
  alert_admin: boolean;
  processed_at: string;
  error_message: string;
}

interface UseAIStatusReturn {
  aiStatus: AIStatus;
  aiResult: AIResult | null;
  isLoading: boolean;
}

const POLL_INTERVAL_MS = 3000; // 3 seconds

export function useAIStatus(issueId: number | null): UseAIStatusReturn {
  const [aiStatus, setAIStatus] = useState<AIStatus>("pending");
  const [aiResult, setAIResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!issueId) return;

    setIsLoading(true);
    setAIStatus("pending");
    setAIResult(null);

    const poll = async () => {
      try {
        const { data } = await api.get(`/ai/status/${issueId}/`);
        const status: AIStatus = data.ai_status;
        setAIStatus(status);

        if (status === "done") {
          setAIResult(data.ai_result);
          setIsLoading(false);
          stopPolling();  // stop — result is in
        } else if (status === "failed") {
          setIsLoading(false);
          stopPolling();
        }
        // else keep polling — still pending/processing
      } catch {
        // Network error — keep polling silently
      }
    };

    // Always fetch immediately (even if already done — to get the result data)
    // then continue polling every 3s only if still pending/processing
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
      setIsLoading(false);
    };
  }, [issueId]);

  return { aiStatus, aiResult, isLoading };
}
