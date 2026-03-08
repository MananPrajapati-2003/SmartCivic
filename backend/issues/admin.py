from django.contrib import admin
from .models import (
    IssueCategory, CivicIssue, IssueImage,
    Assignment, StatusUpdate, NGOAssistance, IssueFeedback, AuditLog
)


@admin.register(IssueCategory)
class IssueCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "is_active"]
    list_editable = ["is_active"]


class IssueImageInline(admin.TabularInline):
    model = IssueImage
    extra = 0
    readonly_fields = ["uploaded_at"]


class StatusUpdateInline(admin.TabularInline):
    model = StatusUpdate
    extra = 0
    readonly_fields = ["updated_at"]


@admin.register(CivicIssue)
class CivicIssueAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "status", "severity", "is_escalated", "reported_by", "created_at"]
    list_filter = ["status", "severity", "is_escalated", "category"]
    search_fields = ["title", "description", "location_address", "reported_by__email"]
    readonly_fields = ["created_at", "updated_at", "verified_at", "escalated_at"]
    inlines = [IssueImageInline, StatusUpdateInline]


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ["issue", "assigned_to", "sla_deadline", "is_overdue"]
    readonly_fields = ["assigned_at"]


@admin.register(NGOAssistance)
class NGOAssistanceAdmin(admin.ModelAdmin):
    list_display = ["issue", "ngo_user", "accepted", "bonus_credibility", "created_at"]


@admin.register(IssueFeedback)
class IssueFeedbackAdmin(admin.ModelAdmin):
    list_display = ["issue", "submitted_by", "rating", "submitted_at"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "actor", "action", "target_type", "target_id"]
    readonly_fields = ["timestamp"]
