from rest_framework import serializers
from django.utils import timezone
from .models import (
    IssueCategory, CivicIssue, IssueImage,
    Assignment, StatusUpdate, NGOAssistance, IssueFeedback, AuditLog
)


# ─── Category ─────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueCategory
        fields = ["id", "name", "icon", "description"]


# ─── Issue Images ─────────────────────────────────────────────────────────────

class IssueImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = IssueImage
        fields = ["id", "url", "caption", "uploaded_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


# ─── Status Update ────────────────────────────────────────────────────────────

class StatusUpdateSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.full_name", read_only=True)
    changed_by_role = serializers.CharField(source="changed_by.role", read_only=True)
    proof_url = serializers.SerializerMethodField()

    class Meta:
        model = StatusUpdate
        fields = [
            "id", "from_status", "to_status", "note",
            "proof_url", "changed_by_name", "changed_by_role", "updated_at"
        ]

    def get_proof_url(self, obj):
        request = self.context.get("request")
        if obj.proof_image and request:
            return request.build_absolute_uri(obj.proof_image.url)
        return None


# ─── Assignment ───────────────────────────────────────────────────────────────

class AssignmentSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True)
    assigned_to_email = serializers.CharField(source="assigned_to.email", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            "id", "assigned_to_name", "assigned_to_email",
            "assigned_at", "sla_hours", "sla_deadline", "is_overdue", "note"
        ]


# ─── NGO Assistance ───────────────────────────────────────────────────────────

class NGOAssistanceSerializer(serializers.ModelSerializer):
    ngo_name = serializers.CharField(source="ngo_user.full_name", read_only=True)
    ngo_org = serializers.SerializerMethodField()
    proof_url = serializers.SerializerMethodField()

    class Meta:
        model = NGOAssistance
        fields = [
            "id", "ngo_name", "ngo_org", "accepted", "decline_reason",
            "note", "proof_url", "bonus_credibility", "created_at"
        ]

    def get_ngo_org(self, obj):
        try:
            return obj.ngo_user.ngo_profile.org_name
        except Exception:
            return None

    def get_proof_url(self, obj):
        request = self.context.get("request")
        if obj.proof_image and request:
            return request.build_absolute_uri(obj.proof_image.url)
        return None


# ─── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueFeedback
        fields = ["id", "rating", "comment", "submitted_at"]
        read_only_fields = ["submitted_at"]


# ─── Issue — List (compact) ───────────────────────────────────────────────────

class IssueListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)
    reporter_name = serializers.CharField(source="reported_by.full_name", read_only=True)
    reporter_id = serializers.IntegerField(source="reported_by.id", read_only=True)
    thumbnail = serializers.SerializerMethodField()
    has_feedback = serializers.SerializerMethodField()
    ai_routing = serializers.SerializerMethodField()
    ai_urgency = serializers.SerializerMethodField()
    ai_predicted_category = serializers.SerializerMethodField()
    ai_sla_hours = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    sla_deadline = serializers.SerializerMethodField()
    sla_hours_assigned = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    assigned_note = serializers.SerializerMethodField()
    assigned_at = serializers.SerializerMethodField()

    class Meta:
        model = CivicIssue
        fields = [
            "id", "title", "category_name", "category_icon",
            "location_address", "severity", "status", "is_escalated",
            "reporter_name", "reporter_id", "thumbnail", "has_feedback",
            "ai_status", "ai_priority_score",
            "ai_routing", "ai_urgency", "ai_predicted_category", "ai_sla_hours",
            "assigned_to_name", "sla_deadline", "sla_hours_assigned",
            "is_overdue", "assigned_note", "assigned_at",
            "created_at", "updated_at"
        ]

    def get_thumbnail(self, obj):
        request = self.context.get("request")
        img = obj.images.first()
        if img and request:
            return request.build_absolute_uri(img.image.url)
        return None

    def get_has_feedback(self, obj):
        return hasattr(obj, "feedback")

    def _ai(self, obj):
        try:
            return obj.ai_result
        except Exception:
            return None

    def get_ai_routing(self, obj):
        r = self._ai(obj)
        return r.routing_target if r else None

    def get_ai_urgency(self, obj):
        r = self._ai(obj)
        return r.urgency_level if r else None

    def get_ai_predicted_category(self, obj):
        r = self._ai(obj)
        return r.predicted_category if r else None

    def get_ai_sla_hours(self, obj):
        r = self._ai(obj)
        return r.sla_hours if r else None

    def get_assigned_to_name(self, obj):
        try:
            return obj.assignment.assigned_to.full_name
        except Exception:
            return None

    def get_sla_deadline(self, obj):
        try:
            return obj.assignment.sla_deadline
        except Exception:
            return None

    def get_sla_hours_assigned(self, obj):
        try:
            return obj.assignment.sla_hours
        except Exception:
            return None

    def get_is_overdue(self, obj):
        try:
            return obj.assignment.is_overdue
        except Exception:
            return False

    def get_assigned_note(self, obj):
        try:
            return obj.assignment.note
        except Exception:
            return None

    def get_assigned_at(self, obj):
        try:
            return obj.assignment.assigned_at
        except Exception:
            return None


# ─── Issue — Full Detail ──────────────────────────────────────────────────────

class IssueDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    reporter_name = serializers.CharField(source="reported_by.full_name", read_only=True)
    reporter_email = serializers.CharField(source="reported_by.email", read_only=True)
    images = IssueImageSerializer(many=True, read_only=True)
    status_updates = StatusUpdateSerializer(many=True, read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    ngo_assistances = NGOAssistanceSerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(read_only=True)
    verified_by_name = serializers.CharField(source="verified_by.full_name", read_only=True)
    can_submit_feedback = serializers.BooleanField(read_only=True)

    class Meta:
        model = CivicIssue
        fields = [
            "id", "title", "description", "category",
            "location_address", "latitude", "longitude",
            "severity", "status", "is_escalated", "escalated_at",
            "reporter_name", "reporter_email",
            "verified_by_name", "verified_at", "rejection_reason",
            "images", "status_updates", "assignment",
            "ngo_assistances", "feedback", "can_submit_feedback",
            "ai_status", "ai_priority_score",
            "created_at", "updated_at"
        ]


# ─── Issue Submit ─────────────────────────────────────────────────────────────

class IssueSubmitSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=IssueCategory.objects.filter(is_active=True),
        source="category"
    )

    class Meta:
        model = CivicIssue
        fields = [
            "category_id", "title", "description",
            "location_address", "latitude", "longitude", "severity"
        ]

    def validate_title(self, v):
        if len(v.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters.")
        return v.strip()

    def validate_description(self, v):
        if len(v.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters.")
        return v.strip()
