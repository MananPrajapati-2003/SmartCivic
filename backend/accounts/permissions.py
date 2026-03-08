from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allow access only to super admins (platform-wide admins)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "super_admin"
        )


class IsOrgAdmin(BasePermission):
    """Allow access to org admins and super admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("org_admin", "super_admin")
        )


class IsAuthority(BasePermission):
    """Allow access to authority users, org admins, and super admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("authority", "org_admin", "super_admin")
        )


class IsNGOorCSR(BasePermission):
    """Allow access to NGO/CSR users, org admins, and super admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("ngo_csr", "org_admin", "super_admin")
        )


class IsCitizen(BasePermission):
    """Allow access only to citizen users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "citizen"
        )


class IsStaffRole(BasePermission):
    """Allow access to any non-citizen role (staff-level users)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != "citizen"
        )
