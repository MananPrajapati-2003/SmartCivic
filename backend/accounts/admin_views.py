"""
Admin-only API views for SmartCivic dashboard.
All endpoints require is_super_admin or is_staff.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from datetime import timedelta

from .models import User


# ─── Permission ───────────────────────────────────────────────────────────────

class IsSuperAdmin(BasePermission):
    """Allow only super_admin role or Django staff."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == User.ROLE_SUPER_ADMIN or request.user.is_staff)
        )


# ─── Stats Overview ───────────────────────────────────────────────────────────

class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

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

        # Role breakdown
        role_data = (
            User.objects.values("role")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Registrations per month (last 12 months)
        monthly = (
            User.objects.filter(date_joined__gte=now - timedelta(days=365))
            .annotate(month=TruncMonth("date_joined"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        # Registrations per day (last 30 days)
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
                "verification_rate": round((verified_users / total_users * 100) if total_users else 0, 1),
            },
            "role_breakdown": list(role_data),
            "monthly_registrations": [
                {"month": r["month"].strftime("%b %Y"), "count": r["count"]}
                for r in monthly
            ],
            "daily_registrations": [
                {"day": r["day"].strftime("%d %b"), "count": r["count"]}
                for r in daily
            ],
        })


# ─── User Management ──────────────────────────────────────────────────────────

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        qs = User.objects.all()

        # Filters
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

        # Allowed sort fields
        allowed_sorts = {
            "date_joined", "-date_joined",
            "full_name", "-full_name",
            "civic_score", "-civic_score",
            "email", "-email",
        }
        if sort not in allowed_sorts:
            sort = "-date_joined"
        qs = qs.order_by(sort)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        users = qs[start:end]

        data = []
        for u in users:
            data.append({
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
                "profile_image": request.build_absolute_uri(u.profile_image.url) if u.profile_image else None,
            })

        return Response({
            "results": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        })


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({
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
        })

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
        return Response({"message": "User deleted."}, status=status.HTTP_204_NO_CONTENT)
