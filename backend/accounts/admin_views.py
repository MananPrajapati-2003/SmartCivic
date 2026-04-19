"""
Admin-only API views for SmartCivic dashboard.
All endpoints require is_super_admin or is_staff.
"""
import secrets
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from datetime import timedelta

from .models import User, NGOProfile
from .serializers import AdminCreateUserSerializer
from .email_service import (
    send_ngo_approved_email, send_ngo_rejected_email, send_credentials_email
)


# ─── Permissions ──────────────────────────────────────────────────────────────

class IsSuperAdmin(BasePermission):
    """Allow only super_admin role or Django staff."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == User.ROLE_SUPER_ADMIN or request.user.is_staff)
        )


class IsAdminOrSuperAdmin(BasePermission):
    """Allow org_admin, super_admin, or staff."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in (User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN)
                or request.user.is_staff
            )
        )


def _gen_password(length=12):
    """Generate a secure temporary password."""
    chars = string.ascii_letters + string.digits + "!@#$"
    return "".join(secrets.choice(chars) for _ in range(length))


# ─── Stats Overview ───────────────────────────────────────────────────────────

class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        now = timezone.now()
        last_30 = now - timedelta(days=30)
        last_7 = now - timedelta(days=7)

        total_users = User.objects.count()
        new_this_month = User.objects.filter(date_joined__gte=last_30).count()
        new_this_week = User.objects.filter(date_joined__gte=last_7).count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        mobile_verified = User.objects.filter(is_mobile_verified=True).count()
        active_users = User.objects.filter(is_active=True).count()
        ngo_pending = NGOProfile.objects.filter(approval_status=NGOProfile.STATUS_PENDING).count()

        role_data = (
            User.objects.values("role")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        monthly = (
            User.objects.filter(date_joined__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        daily = (
            User.objects.filter(date_joined__gte=last_30)
            .annotate(day=TruncDate("date_joined"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        return Response({
            "overview": {
                "total_users": total_users,
                "new_this_month": new_this_month,
                "new_this_week": new_this_week,
                "verified_users": verified_users,
                "mobile_verified": mobile_verified,
                "active_users": active_users,
                "ngo_pending": ngo_pending,
                "verification_rate": round((verified_users / total_users * 100) if total_users else 0, 1),
            },
            "role_breakdown": list(role_data),
            "monthly_registrations": [
                {"month": r["month"].strftime("%b %Y"), "count": r["count"]}
                for r in monthly
                if r["month"] is not None
            ],
            "daily_registrations": [
                {"day": r["day"].strftime("%d %b"), "count": r["count"]}
                for r in daily
                if r["day"] is not None
            ],
        })


# ─── User Management ──────────────────────────────────────────────────────────

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        qs = User.objects.all()

        role = request.query_params.get("role")
        is_verified = request.query_params.get("is_verified")
        is_active = request.query_params.get("is_active")
        search = request.query_params.get("search")
        sort = request.query_params.get("sort", "-date_joined")

        if role:
            qs = qs.filter(role=role)
        if is_verified is not None:
            qs = qs.filter(is_email_verified=(is_verified == "true"))
        if is_active is not None:
            qs = qs.filter(is_active=(is_active == "true"))
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(full_name__icontains=search) |
                Q(mobile_number__icontains=search)
            )

        allowed_sorts = {
            "date_joined", "-date_joined", "full_name", "-full_name",
            "civic_score", "-civic_score", "email", "-email",
        }
        if sort not in allowed_sorts:
            sort = "-date_joined"
        qs = qs.order_by(sort)

        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        users = qs[start:end]

        data = []
        for u in users:
            row = {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "mobile_number": u.mobile_number,
                "role": u.role,
                "is_active": u.is_active,
                "is_email_verified": u.is_email_verified,
                "is_mobile_verified": u.is_mobile_verified,
                "civic_score": u.civic_score,
                "date_joined": u.date_joined.strftime("%d %b %Y, %H:%M"),
                "profile_image": u.profile_image.url if u.profile_image else None,
                "department": u.department if u.role == User.ROLE_AUTHORITY else None,
            }
            # Attach NGO info if applicable
            if hasattr(u, "ngo_profile"):
                row["ngo"] = {
                    "org_name": u.ngo_profile.org_name,
                    "approval_status": u.ngo_profile.approval_status,
                }
            data.append(row)

        return Response({
            "results": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_verified": user.is_email_verified,
            "is_mobile_verified": user.is_mobile_verified,
            "civic_score": user.civic_score,
            "date_joined": user.date_joined.isoformat(),
            "is_staff": user.is_staff,
        }
        if hasattr(user, "ngo_profile"):
            p = user.ngo_profile
            data["ngo_profile"] = {
                "org_name": p.org_name, "description": p.description,
                "website": p.website, "address": p.address, "team_size": p.team_size,
                "approval_status": p.approval_status, "rejection_reason": p.rejection_reason,
                "registered_at": p.registered_at.isoformat(),
            }
        return Response(data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if user.is_superuser and not request.user.is_superuser:
            return Response({"detail": "Cannot modify superuser."}, status=status.HTTP_403_FORBIDDEN)

        allowed = {"full_name", "role", "is_active", "is_email_verified", "is_mobile_verified", "civic_score", "mobile_number"}
        for field, value in request.data.items():
            if field in allowed:
                setattr(user, field, value)
        user.save()
        return Response({"message": "User updated.", "id": user.id})

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if user.is_superuser:
            return Response({"detail": "Cannot delete superuser."}, status=status.HTTP_403_FORBIDDEN)
        if user.id == request.user.id:
            return Response({"detail": "Cannot delete your own account."}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({"message": "User deleted."}, status=status.HTTP_200_OK)


# ─── NGO Approvals ────────────────────────────────────────────────────────────

class AdminNGOListView(APIView):
    """GET /api/auth/admin/ngo/ — list NGO registrations with optional status filter."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        approval_status = request.query_params.get("status", "")
        search = request.query_params.get("search", "")

        qs = NGOProfile.objects.select_related("user", "reviewed_by")
        if approval_status in (NGOProfile.STATUS_PENDING, NGOProfile.STATUS_APPROVED, NGOProfile.STATUS_REJECTED):
            qs = qs.filter(approval_status=approval_status)
        if search:
            qs = qs.filter(
                Q(org_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__full_name__icontains=search)
            )

        data = []
        for p in qs:
            data.append({
                "id": p.id,
                "user_id": p.user.id,
                "contact_name": p.user.full_name,
                "email": p.user.email,
                "mobile": p.user.mobile_number,
                "org_name": p.org_name,
                "description": p.description,
                "website": p.website,
                "address": p.address,
                "team_size": p.team_size,
                "approval_status": p.approval_status,
                "rejection_reason": p.rejection_reason,
                "registered_at": p.registered_at.strftime("%d %b %Y, %H:%M"),
                "reviewed_by": p.reviewed_by.full_name if p.reviewed_by else None,
                "reviewed_at": p.reviewed_at.strftime("%d %b %Y, %H:%M") if p.reviewed_at else None,
            })

        counts = {s: NGOProfile.objects.filter(approval_status=s).count()
                  for s in (NGOProfile.STATUS_PENDING, NGOProfile.STATUS_APPROVED, NGOProfile.STATUS_REJECTED)}

        return Response({"results": data, "counts": counts})


class AdminNGOActionView(APIView):
    """PATCH /api/auth/admin/ngo/<id>/action/ — approve or reject an NGO."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def patch(self, request, pk):
        try:
            profile = NGOProfile.objects.select_related("user").get(pk=pk)
        except NGOProfile.DoesNotExist:
            return Response({"detail": "NGO profile not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")  # 'approve' | 'reject'
        reason = request.data.get("reason", "").strip()

        if action not in ("approve", "reject"):
            return Response({"detail": "action must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        if action == "reject" and not reason:
            return Response({"detail": "A rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = profile.user

        if action == "approve":
            profile.approval_status = NGOProfile.STATUS_APPROVED
            profile.rejection_reason = ""
            profile.reviewed_by = request.user
            profile.reviewed_at = timezone.now()
            profile.save()
            user.is_active = True
            user.is_email_verified = True   # Pre-verify email since admin has vetted them
            user.save(update_fields=["is_active", "is_email_verified"])
            send_ngo_approved_email(user, profile.org_name)
            return Response({"message": "NGO approved. User can now login."})

        else:  # reject
            profile.approval_status = NGOProfile.STATUS_REJECTED
            profile.rejection_reason = reason
            profile.reviewed_by = request.user
            profile.reviewed_at = timezone.now()
            profile.save()
            # Keep user inactive
            send_ngo_rejected_email(user, profile.org_name, reason)
            return Response({"message": "NGO rejected. Notification sent."})


# ─── Admin Account Creation ───────────────────────────────────────────────────

class AdminCreateAuthorityView(APIView):
    """POST /api/auth/admin/create-authority/ — admin creates an authority account."""
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        temp_password = _gen_password()
        user = User.objects.create_user(
            email=serializer.validated_data["email"],
            full_name=serializer.validated_data["full_name"],
            mobile_number=serializer.validated_data.get("mobile_number", ""),
            password=temp_password,
            role=User.ROLE_AUTHORITY,
            department=serializer.validated_data.get("department", "general"),
            is_active=True,
            is_email_verified=True,   # Admin has verified identity
        )
        send_credentials_email(user, temp_password, "Authority")
        return Response(
            {"message": "Authority account created. Credentials sent via email.", "id": user.id, "email": user.email},
            status=status.HTTP_201_CREATED,
        )


class AdminCreateAdminView(APIView):
    """POST /api/auth/admin/create-admin/ — super_admin creates an org_admin account."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        temp_password = _gen_password()
        user = User.objects.create_user(
            email=serializer.validated_data["email"],
            full_name=serializer.validated_data["full_name"],
            mobile_number=serializer.validated_data.get("mobile_number", ""),
            password=temp_password,
            role=User.ROLE_ORG_ADMIN,
            is_active=True,
            is_email_verified=True,
            is_staff=True,
        )
        send_credentials_email(user, temp_password, "Admin")
        return Response(
            {"message": "Admin account created. Credentials sent via email.", "id": user.id, "email": user.email},
            status=status.HTTP_201_CREATED,
        )



class AdminAuthorityUsersView(APIView):
    """GET /api/auth/admin/authority-users/ — list active authority accounts for assignment."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in (User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)
        users = (
            User.objects.filter(role=User.ROLE_AUTHORITY, is_active=True)
            .values("id", "full_name", "email", "department")
            .order_by("full_name")
        )
        return Response(list(users))
