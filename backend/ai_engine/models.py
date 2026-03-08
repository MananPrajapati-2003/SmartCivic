"""
AI Engine database models.

AIAnalysisResult  — stores per-issue NLP + image inference output
EscalationLog     — audit trail of SLA-triggered escalations
"""
from django.db import models


class AIAnalysisResult(models.Model):
    """One-to-one record of AI analysis for every civic issue."""

    SENTIMENT_POSITIVE = "positive"
    SENTIMENT_NEGATIVE = "negative"
    SENTIMENT_NEUTRAL = "neutral"
    SENTIMENT_CHOICES = [
        (SENTIMENT_POSITIVE, "Positive"),
        (SENTIMENT_NEGATIVE, "Negative"),
        (SENTIMENT_NEUTRAL, "Neutral"),
    ]

    URGENCY_LOW = "low"
    URGENCY_MEDIUM = "medium"
    URGENCY_HIGH = "high"
    URGENCY_CRITICAL = "critical"
    URGENCY_CHOICES = [
        (URGENCY_LOW, "Low"),
        (URGENCY_MEDIUM, "Medium"),
        (URGENCY_HIGH, "High"),
        (URGENCY_CRITICAL, "Critical"),
    ]

    ROUTING_GOVERNMENT = "government"
    ROUTING_NGO = "ngo"
    ROUTING_CHOICES = [
        (ROUTING_GOVERNMENT, "Government"),
        (ROUTING_NGO, "NGO / CSR"),
    ]

    # ── Relation ──────────────────────────────────────────────────────────────
    issue = models.OneToOneField(
        "issues.CivicIssue",
        on_delete=models.CASCADE,
        related_name="ai_result",
    )

    # ── NLP outputs (from Hugging Face BERT Space) ────────────────────────────
    predicted_category = models.CharField(max_length=100, blank=True)
    category_confidence = models.FloatField(default=0.0)
    nlp_summary = models.TextField(blank=True, default="")   # HF-generated 1-line summary
    sentiment = models.CharField(
        max_length=20, choices=SENTIMENT_CHOICES, default=SENTIMENT_NEUTRAL
    )
    urgency_level = models.CharField(
        max_length=20, choices=URGENCY_CHOICES, default=URGENCY_MEDIUM
    )
    nlp_score = models.FloatField(default=0.0)   # 0–10 normalised urgency

    # ── Image outputs (from Hugging Face ResNet50 Space) ──────────────────────
    damage_type = models.CharField(max_length=100, blank=True, default="")
    visual_score = models.FloatField(null=True, blank=True)   # 0–10
    image_confidence = models.FloatField(null=True, blank=True)
    is_fake_likely = models.BooleanField(default=False)

    # ── Server-side computed scores ───────────────────────────────────────────
    history_score = models.FloatField(default=0.0)   # repeat complaint weight
    env_score = models.FloatField(default=0.0)       # weather/season/area risk

    # ── Final weighted priority score ─────────────────────────────────────────
    priority_score = models.FloatField(default=0.0)  # 0–10 (main KPI)

    # ── Routing decision ──────────────────────────────────────────────────────
    routing_target = models.CharField(
        max_length=20, choices=ROUTING_CHOICES, default=ROUTING_GOVERNMENT
    )
    sla_hours = models.IntegerField(default=72)
    alert_admin = models.BooleanField(default=False)

    # ── Performance tracking ──────────────────────────────────────────────────
    hf_nlp_latency_ms = models.IntegerField(null=True, blank=True)
    hf_image_latency_ms = models.IntegerField(null=True, blank=True)
    ai_version = models.CharField(max_length=20, default="v1.0")
    processed_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(blank=True, default="")

    class Meta:
        db_table = "ai_analysis_results"
        ordering = ["-processed_at"]

    def __str__(self):
        return (
            f"AI[#{self.issue_id}] {self.predicted_category} | "
            f"{self.sentiment} | score:{self.priority_score}"
        )

    @property
    def priority_label(self) -> str:
        """Human-readable label for the priority score (0–10)."""
        if self.priority_score >= 8:
            return "Critical"
        if self.priority_score >= 6:
            return "High"
        if self.priority_score >= 4:
            return "Medium"
        return "Low"


class EscalationLog(models.Model):
    """
    Audit trail every time an issue is automatically escalated
    because its SLA deadline was breached.
    """
    issue = models.ForeignKey(
        "issues.CivicIssue",
        on_delete=models.CASCADE,
        related_name="escalation_logs",
    )
    escalated_to = models.CharField(max_length=50)   # "ngo" | "csr" | "admin"
    reason = models.CharField(max_length=300)        # e.g. "SLA breached 48h — status: in_progress"
    sla_deadline = models.DateTimeField()
    escalated_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    notified_emails = models.TextField(blank=True, default="")  # comma-separated

    class Meta:
        db_table = "ai_escalation_logs"
        ordering = ["-escalated_at"]

    def __str__(self):
        return f"Escalation[#{self.issue_id}] → {self.escalated_to} at {self.escalated_at:%Y-%m-%d %H:%M}"
