"""
Site Settings and User Rights API views.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import User
from .site_settings import SiteSettings, UserPermission
from .admin_views import IsSuperAdmin, IsAdminOrSuperAdmin


class PublicSiteSettingsView(APIView):
    """
    GET /api/auth/public-settings/
    Public — returns only the fields needed by the frontend for all visitors:
    site name, support email, and maintenance mode.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        s = SiteSettings.get()
        return Response({
            "site_name": s.site_name,
            "support_email": s.support_email,
            "maintenance_mode": s.maintenance_mode,
        })


class SiteSettingsView(APIView):
    """
    GET  /api/auth/settings/  — fetch current settings (any admin)
    PATCH /api/auth/settings/ — update settings (super_admin only)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated(), IsAdminOrSuperAdmin()]
        return [IsAuthenticated(), IsSuperAdmin()]

    def get(self, request):
        s = SiteSettings.get()
        return Response({
            "site_name": s.site_name,
            "support_email": s.support_email,
            "email_notifications_enabled": s.email_notifications_enabled,
            "email_verification_required": s.email_verification_required,
            "public_registration_enabled": s.public_registration_enabled,
            "mobile_bonus_enabled": s.mobile_bonus_enabled,
            "default_role": s.default_role,
            "otp_expiry_minutes": s.otp_expiry_minutes,
            "otp_max_attempts": s.otp_max_attempts,
            "otp_session_duration": s.otp_session_duration,
            "sla_critical_hours": s.sla_critical_hours,
            "sla_high_hours": s.sla_high_hours,
            "sla_medium_hours": s.sla_medium_hours,
            "sla_low_hours": s.sla_low_hours,
            "maintenance_mode": s.maintenance_mode,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            "updated_by": s.updated_by.full_name if s.updated_by else None,
        })

    def patch(self, request):
        s = SiteSettings.get()
        allowed = {
            "site_name", "support_email", "email_notifications_enabled",
            "email_verification_required", "public_registration_enabled",
            "mobile_bonus_enabled", "default_role",
            "otp_expiry_minutes", "otp_max_attempts", "otp_session_duration",
            "sla_critical_hours", "sla_high_hours", "sla_medium_hours", "sla_low_hours",
            "maintenance_mode",
        }
        for field, value in request.data.items():
            if field in allowed:
                setattr(s, field, value)
        s.updated_by = request.user
        s.save()
        return Response({"message": "Settings saved.", "site_name": s.site_name})


# Permissions each role has by default (built into their role, cannot be removed)
ROLE_DEFAULT_PERMISSIONS = {
    User.ROLE_AUTHORITY: [
        "view_reports",
        "approve_reports",
        "reject_reports",
    ],
    User.ROLE_NGO_CSR: [
        "view_reports",
    ],
    User.ROLE_ORG_ADMIN: [
        "view_reports",
        "approve_reports",
        "reject_reports",
        "assign_issues",
        "manage_users",
        "manage_ngo",
        "create_accounts",
        "view_ai_data",
    ],
    User.ROLE_SUPER_ADMIN: [
        "view_reports",
        "approve_reports",
        "reject_reports",
        "assign_issues",
        "manage_users",
        "manage_ngo",
        "create_accounts",
        "view_ai_data",
        "export_data",
        "send_notifications",
        "manage_settings",
        "add_pages",
    ],
}


class UserPermissionsView(APIView):
    """
    GET  /api/auth/rights/<user_id>/  — get all permissions for a user
    POST /api/auth/rights/<user_id>/  — set permissions for a user (replaces all)
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        # Explicitly granted permissions (stored in DB)
        granted_perms = list(
            UserPermission.objects.filter(user=target).values_list("permission", flat=True)
        )
        # Role-default permissions (implicit, always active for this role)
        role_defaults = ROLE_DEFAULT_PERMISSIONS.get(target.role, [])

        return Response({
            "user_id": target.id,
            "user_name": target.full_name,
            "user_role": target.role,
            "permissions": granted_perms,
            "role_default_permissions": role_defaults,
            "available_permissions": [
                {"key": k, "label": v}
                for k, v in UserPermission.PERM_CHOICES
            ],
        })

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        new_perms = request.data.get("permissions", [])
        if not isinstance(new_perms, list):
            return Response({"detail": "permissions must be a list."}, status=400)

        valid = {k for k, _ in UserPermission.PERM_CHOICES}
        invalid = [p for p in new_perms if p not in valid]
        if invalid:
            return Response({"detail": f"Invalid permissions: {invalid}"}, status=400)

        # Replace all permissions for this user
        UserPermission.objects.filter(user=target).delete()
        UserPermission.objects.bulk_create([
            UserPermission(user=target, permission=p, granted_by=request.user)
            for p in new_perms
        ])

        return Response({"message": f"Permissions updated for {target.full_name}.", "permissions": new_perms})


class UserSearchView(APIView):
    """
    GET /api/auth/user-search/?q=name — search users by name/email for rights assignment
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([])
        from django.db.models import Q
        users = User.objects.filter(
            Q(full_name__icontains=q) | Q(email__icontains=q)
        ).exclude(role=User.ROLE_CITIZEN).values(
            "id", "full_name", "email", "role", "department"
        )[:20]
        return Response(list(users))


class AuthorityDeptUpdateView(APIView):
    """
    PATCH /api/auth/admin/users/<pk>/department/ — update authority user's department
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk, role=User.ROLE_AUTHORITY)
        except User.DoesNotExist:
            return Response({"detail": "Authority user not found."}, status=404)

        dept = request.data.get("department")
        valid_depts = [d[0] for d in User.DEPT_CHOICES]
        if dept not in valid_depts:
            return Response({"detail": f"Invalid department. Choose from: {valid_depts}"}, status=400)

        user.department = dept
        user.save(update_fields=["department"])
        return Response({"message": "Department updated.", "department": dept})
