from rest_framework.permissions import BasePermission
from .models import User


class IsSuperAdmin(BasePermission):
    """Allow access only to super admins (platform-wide admins)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_SUPER_ADMIN
        )


class IsOrgAdmin(BasePermission):
    """Allow access to org admins and super admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN)
        )


class IsAuthority(BasePermission):
    """Allow access to authority users, org admins, and super admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.ROLE_AUTHORITY, User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN)
        )


class IsNGOorCSR(BasePermission):
    """Allow access to NGO/CSR users, org admins, and super admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.ROLE_NGO_CSR, User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN)
        )


class IsCitizen(BasePermission):
    """Allow access only to citizen users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_CITIZEN
        )


class IsStaffRole(BasePermission):
    """Allow access to any non-citizen role (staff-level users)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role != User.ROLE_CITIZEN
        )
