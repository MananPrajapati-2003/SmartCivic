"""
ai_engine admin registrations.
"""
from django.contrib import admin
from .models import AIAnalysisResult, EscalationLog


@admin.register(AIAnalysisResult)
class AIAnalysisResultAdmin(admin.ModelAdmin):
    list_display = [
        "issue_id", "predicted_category", "sentiment", "urgency_level",
        "priority_score", "routing_target", "sla_hours", "alert_admin",
        "is_fake_likely", "processed_at",
    ]
    list_filter = [
        "routing_target", "sentiment", "urgency_level",
        "alert_admin", "is_fake_likely",
    ]
    search_fields = ["issue__title", "predicted_category", "damage_type"]
    readonly_fields = [
        "processed_at", "hf_nlp_latency_ms", "hf_image_latency_ms",
        "priority_score", "history_score", "env_score",
    ]
    ordering = ["-processed_at"]


@admin.register(EscalationLog)
class EscalationLogAdmin(admin.ModelAdmin):
    list_display = [
        "issue_id", "escalated_to", "reason",
        "sla_deadline", "escalated_at", "resolved",
    ]
    list_filter = ["escalated_to", "resolved"]
    search_fields = ["issue__title", "reason"]
    readonly_fields = ["escalated_at"]
