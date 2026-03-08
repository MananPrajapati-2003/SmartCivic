"""
AI Engine serializers.
"""
from rest_framework import serializers
from .models import AIAnalysisResult, EscalationLog


class AIAnalysisResultSerializer(serializers.ModelSerializer):
    priority_label = serializers.ReadOnlyField()  # property on model

    class Meta:
        model = AIAnalysisResult
        fields = [
            "id",
            "predicted_category",
            "category_confidence",
            "nlp_summary",
            "sentiment",
            "urgency_level",
            "nlp_score",
            "damage_type",
            "visual_score",
            "image_confidence",
            "is_fake_likely",
            "history_score",
            "env_score",
            "priority_score",
            "priority_label",
            "routing_target",
            "sla_hours",
            "alert_admin",
            "ai_version",
            "hf_nlp_latency_ms",
            "hf_image_latency_ms",
            "processed_at",
            "error_message",
        ]


class EscalationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EscalationLog
        fields = [
            "id", "issue", "escalated_to", "reason",
            "sla_deadline", "escalated_at", "resolved",
        ]
