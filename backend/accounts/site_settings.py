"""
SiteSettings — singleton model for global platform configuration.
Only one row exists (pk=1). Use SiteSettings.get() to read it.
"""
from django.db import models


class SiteSettings(models.Model):
    # ── Site Identity ─────────────────────────────────────────────────────────
    site_name = models.CharField(max_length=100, default="SmartCivic")
    support_email = models.EmailField(default="support@smartcivic.in")

    # ── Email Notifications ───────────────────────────────────────────────────
    email_notifications_enabled = models.BooleanField(
        default=True,
        help_text="Global switch — disables all outbound emails when False"
    )

    # ── Auth & Registration ───────────────────────────────────────────────────
    email_verification_required = models.BooleanField(default=True)
    public_registration_enabled = models.BooleanField(default=True)
    mobile_bonus_enabled = models.BooleanField(default=True)
    default_role = models.CharField(max_length=20, default="citizen")

    # ── OTP Configuration ─────────────────────────────────────────────────────
    otp_expiry_minutes = models.PositiveIntegerField(default=10)
    otp_max_attempts = models.PositiveIntegerField(default=5)
    otp_session_duration = models.PositiveIntegerField(default=30)

    # ── SLA Defaults (customizable per category) ──────────────────────────────
    sla_critical_hours = models.PositiveIntegerField(default=6)
    sla_high_hours = models.PositiveIntegerField(default=24)
    sla_medium_hours = models.PositiveIntegerField(default=48)
    sla_low_hours = models.PositiveIntegerField(default=72)

    # ── Maintenance ───────────────────────────────────────────────────────────
    maintenance_mode = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "accounts.User", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="settings_updates"
    )

    class Meta:
        db_table = "site_settings"
        verbose_name = "Site Settings"

    def __str__(self):
        return f"SiteSettings (updated {self.updated_at})"

    @classmethod
    def get(cls):
        """Always returns the singleton settings row, creating it if needed."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class UserPermission(models.Model):
    """
    Granular permission flags granted by super_admin to specific users.
    """
    PERM_VIEW_REPORTS    = "view_reports"
    PERM_APPROVE_REPORTS = "approve_reports"
    PERM_REJECT_REPORTS  = "reject_reports"
    PERM_ASSIGN_ISSUES   = "assign_issues"
    PERM_MANAGE_USERS    = "manage_users"
    PERM_MANAGE_NGO      = "manage_ngo"
    PERM_CREATE_ACCOUNTS = "create_accounts"
    PERM_VIEW_AI_DATA    = "view_ai_data"
    PERM_EXPORT_DATA     = "export_data"
    PERM_SEND_NOTIFICATIONS = "send_notifications"
    PERM_MANAGE_SETTINGS = "manage_settings"
    PERM_ADD_PAGES       = "add_pages"

    PERM_CHOICES = [
        (PERM_VIEW_REPORTS,       "View Reports"),
        (PERM_APPROVE_REPORTS,    "Approve Reports"),
        (PERM_REJECT_REPORTS,     "Reject Reports"),
        (PERM_ASSIGN_ISSUES,      "Assign Issues"),
        (PERM_MANAGE_USERS,       "Manage Users"),
        (PERM_MANAGE_NGO,         "Manage NGO Approvals"),
        (PERM_CREATE_ACCOUNTS,    "Create Accounts"),
        (PERM_VIEW_AI_DATA,       "View AI Analysis Data"),
        (PERM_EXPORT_DATA,        "Export Data"),
        (PERM_SEND_NOTIFICATIONS, "Send Notifications"),
        (PERM_MANAGE_SETTINGS,    "Manage Settings"),
        (PERM_ADD_PAGES,          "Add/Edit Pages"),
    ]

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE,
        related_name="custom_permissions"
    )
    permission = models.CharField(max_length=50, choices=PERM_CHOICES)
    granted_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL,
        null=True, related_name="permissions_granted"
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_permissions_custom"
        unique_together = ("user", "permission")
        verbose_name = "User Permission"

    def __str__(self):
        return f"{self.user.email} — {self.permission}"
