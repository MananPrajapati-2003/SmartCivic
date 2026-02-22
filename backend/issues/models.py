"""
Issues app for SmartCivic — civic issue lifecycle management.
"""
from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta

AUTH_USER_MODEL = settings.AUTH_USER_MODEL


class IssueCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default="AlertTriangle")  # lucide icon name
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "issue_categories"
        verbose_name_plural = "Issue Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class CivicIssue(models.Model):
    # ── Status choices ────────────────────────────────────────────────────────
    STATUS_PENDING_VERIFICATION = "pending_verification"
    STATUS_VERIFIED = "verified"
    STATUS_ASSIGNED = "assigned"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_ESCALATED = "escalated"
    STATUS_RESOLVED = "resolved"
    STATUS_CLOSED = "closed"
    STATUS_REJECTED = "rejected"
    STATUS_FAKE = "fake"

    STATUS_CHOICES = [
        (STATUS_PENDING_VERIFICATION, "Pending Verification"),
        (STATUS_VERIFIED, "Verified"),
        (STATUS_ASSIGNED, "Assigned"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_ESCALATED, "Escalated"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_CLOSED, "Closed"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_FAKE, "Fake / Spam"),
    ]

    # ── Severity choices ──────────────────────────────────────────────────────
    SEVERITY_LOW = "low"
    SEVERITY_MEDIUM = "medium"
    SEVERITY_HIGH = "high"
    SEVERITY_CRITICAL = "critical"

    SEVERITY_CHOICES = [
        (SEVERITY_LOW, "Low"),
        (SEVERITY_MEDIUM, "Medium"),
        (SEVERITY_HIGH, "High"),
        (SEVERITY_CRITICAL, "Critical"),
    ]

    # ── Core fields ───────────────────────────────────────────────────────────
    reported_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="reported_issues", db_index=True
    )
    category = models.ForeignKey(
        IssueCategory, on_delete=models.SET_NULL, null=True, related_name="issues"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()

    # ── Location ──────────────────────────────────────────────────────────────
    location_address = models.CharField(max_length=400)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # ── Status & severity ─────────────────────────────────────────────────────
    severity = models.CharField(
        max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_MEDIUM, db_index=True
    )
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES,
        default=STATUS_PENDING_VERIFICATION, db_index=True
    )

    # ── Escalation ────────────────────────────────────────────────────────────
    is_escalated = models.BooleanField(default=False, db_index=True)
    escalated_at = models.DateTimeField(null=True, blank=True)

    # ── Authority verification ─────────────────────────────────────────────────
    verified_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="verified_issues"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "civic_issues"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.status}] {self.title} by {self.reported_by.email}"

    @property
    def is_terminal(self):
        return self.status in (
            self.STATUS_RESOLVED, self.STATUS_CLOSED,
            self.STATUS_REJECTED, self.STATUS_FAKE
        )

    @property
    def can_submit_feedback(self):
        return self.status in (self.STATUS_RESOLVED, self.STATUS_CLOSED)


class IssueImage(models.Model):
    issue = models.ForeignKey(CivicIssue, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="issues/")
    caption = models.CharField(max_length=200, blank=True, default="")
    uploaded_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="uploaded_images"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "issue_images"
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Image for issue #{self.issue_id}"


class Assignment(models.Model):
    issue = models.OneToOneField(CivicIssue, on_delete=models.CASCADE, related_name="assignment")
    assigned_to = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="assignments", db_index=True
    )
    assigned_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_assignments"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    sla_hours = models.PositiveIntegerField(default=72)  # default 3-day SLA
    sla_deadline = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "issue_assignments"

    def save(self, *args, **kwargs):
        if not self.sla_deadline:
            self.sla_deadline = timezone.now() + timedelta(hours=self.sla_hours)
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        return self.sla_deadline and timezone.now() > self.sla_deadline

    def __str__(self):
        return f"Assignment: issue #{self.issue_id} → {self.assigned_to.email}"


class StatusUpdate(models.Model):
    issue = models.ForeignKey(CivicIssue, on_delete=models.CASCADE, related_name="status_updates")
    changed_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="status_changes"
    )
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    note = models.TextField(blank=True, default="")
    proof_image = models.ImageField(upload_to="proofs/", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "issue_status_updates"
        ordering = ["updated_at"]

    def __str__(self):
        return f"#{self.issue_id}: {self.from_status} → {self.to_status}"


class NGOAssistance(models.Model):
    issue = models.ForeignKey(CivicIssue, on_delete=models.CASCADE, related_name="ngo_assistances")
    ngo_user = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assisted_issues"
    )
    accepted = models.BooleanField(default=False)
    decline_reason = models.TextField(blank=True, default="")
    note = models.TextField(blank=True, default="")
    proof_image = models.ImageField(upload_to="ngo_proofs/", null=True, blank=True)
    bonus_credibility = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ngo_assistances"
        unique_together = ("issue", "ngo_user")

    def __str__(self):
        return f"NGO {self.ngo_user.email} → issue #{self.issue_id}"


class IssueFeedback(models.Model):
    issue = models.OneToOneField(CivicIssue, on_delete=models.CASCADE, related_name="feedback")
    submitted_by = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedbacks"
    )
    rating = models.PositiveSmallIntegerField(default=3)  # 1–5
    comment = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "issue_feedback"

    def __str__(self):
        return f"Feedback for issue #{self.issue_id} — {self.rating}★"


class AuditLog(models.Model):
    actor = models.ForeignKey(
        AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50, blank=True, default="")
    target_id = models.PositiveIntegerField(null=True, blank=True)
    detail = models.TextField(blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.actor} — {self.action}"
