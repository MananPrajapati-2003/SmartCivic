"""
Role-gated API views for the issues lifecycle.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from django.db.models import Q, Count
from django.utils import timezone

from accounts.models import User
from .models import (
    IssueCategory, CivicIssue, IssueImage,
    Assignment, StatusUpdate, NGOAssistance, IssueFeedback, AuditLog
)
from .serializers import (
    CategorySerializer, IssueListSerializer, IssueDetailSerializer,
    IssueSubmitSerializer, StatusUpdateSerializer, FeedbackSerializer,
    NGOAssistanceSerializer, AssignmentSerializer
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def log_action(actor, action, target_type="", target_id=None, detail=""):
    AuditLog.objects.create(
        actor=actor, action=action,
        target_type=target_type, target_id=target_id, detail=detail
    )


def is_citizen(user):
    return user.role == User.ROLE_CITIZEN

def is_authority(user):
    return user.role == User.ROLE_AUTHORITY

def is_ngo(user):
    return user.role == User.ROLE_NGO_CSR

def is_admin(user):
    return user.role in (User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN) or user.is_staff


# ─── Categories ───────────────────────────────────────────────────────────────

class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cats = IssueCategory.objects.filter(is_active=True)
        return Response(CategorySerializer(cats, many=True).data)


# ─── Citizen: Submit + My Issues ─────────────────────────────────────────────

class CitizenIssueListView(APIView):
    """GET /api/issues/  — citizen's own issues (paginated + filtered)
       POST /api/issues/ — submit a new issue"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = CivicIssue.objects.filter(reported_by=request.user).select_related(
            "category", "reported_by"
        ).prefetch_related("images")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))
        total = qs.count()
        qs = qs[(page - 1) * page_size: page * page_size]
        return Response({
            "results": IssueListSerializer(qs, many=True, context={"request": request}).data,
            "total": total,
            "page": page,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        })

    def post(self, request):
        if not is_citizen(request.user):
            return Response({"detail": "Only citizens can submit issues."}, status=403)
        serializer = IssueSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        issue = serializer.save(reported_by=request.user)

        # Handle multiple image uploads
        images = request.FILES.getlist("images")
        for img in images[:5]:  # max 5 images
            IssueImage.objects.create(issue=issue, image=img, uploaded_by=request.user)

        # ── Kick off async AI analysis ─────────────────────────────────────────────────────
        # Django returns 201 immediately; AI runs in the background.
        # React polls GET /api/ai/status/<id>/ every 3s for updates.
        from ai_engine.tasks import analyze_issue
        analyze_issue.delay(issue.id)

        log_action(request.user, "issue_submitted", "CivicIssue", issue.id, issue.title)
        return Response(
            IssueDetailSerializer(issue, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


# ─── Issue Detail ─────────────────────────────────────────────────────────────

class IssueDetailView(APIView):
    """GET /api/issues/<id>/  — full detail visible to reporter and authority/admin"""
    permission_classes = [IsAuthenticated]

    def get_issue(self, pk, user):
        try:
            issue = CivicIssue.objects.select_related(
                "category", "reported_by", "verified_by"
            ).prefetch_related(
                "images", "status_updates__changed_by",
                "ngo_assistances__ngo_user", "assignment__assigned_to"
            ).get(pk=pk)
        except CivicIssue.DoesNotExist:
            return None
        # Citizens can only see their own issues
        if is_citizen(user) and issue.reported_by != user:
            return None
        return issue

    def get(self, request, pk):
        issue = self.get_issue(pk, request.user)
        if not issue:
            return Response({"detail": "Not found."}, status=404)
        return Response(IssueDetailSerializer(issue, context={"request": request}).data)


# ─── Authority: Verification Queue ────────────────────────────────────────────

class AuthorityQueueView(APIView):
    """GET /api/issues/queue/ — issues pending verification for authority"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_authority(request.user) and not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        qs = CivicIssue.objects.filter(
            status=CivicIssue.STATUS_PENDING_VERIFICATION
        ).select_related("category", "reported_by").prefetch_related("images")

        # Filters
        severity = request.query_params.get("severity")
        search = request.query_params.get("search")
        if severity:
            qs = qs.filter(severity=severity)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(location_address__icontains=search))

        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 15))
        total = qs.count()
        qs = qs[(page - 1) * page_size: page * page_size]
        return Response({
            "results": IssueListSerializer(qs, many=True, context={"request": request}).data,
            "total": total,
            "page": page,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        })


class AuthorityVerifyView(APIView):
    """POST /api/issues/<id>/verify/ — approve / reject / mark fake"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_authority(request.user) and not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        try:
            issue = CivicIssue.objects.get(pk=pk)
        except CivicIssue.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        action = request.data.get("action")  # "approve" | "reject" | "fake"
        reason = request.data.get("reason", "").strip()

        if action not in ("approve", "reject", "fake"):
            return Response({"detail": "action must be approve | reject | fake."}, status=400)
        if action in ("reject", "fake") and not reason:
            return Response({"detail": "reason is required for rejection/fake."}, status=400)

        old_status = issue.status
        if action == "approve":
            issue.status = CivicIssue.STATUS_VERIFIED
            issue.verified_by = request.user
            issue.verified_at = timezone.now()
        elif action == "reject":
            issue.status = CivicIssue.STATUS_REJECTED
            issue.rejection_reason = reason
        else:
            issue.status = CivicIssue.STATUS_FAKE
            issue.rejection_reason = reason

        issue.save()
        StatusUpdate.objects.create(
            issue=issue, changed_by=request.user,
            from_status=old_status, to_status=issue.status,
            note=reason
        )
        log_action(request.user, f"issue_{action}d", "CivicIssue", issue.id, reason)

        # Credibility adjustment for verified/fake
        if action == "approve":
            issue.reported_by.civic_score = max(0, issue.reported_by.civic_score + 5)
            issue.reported_by.save(update_fields=["civic_score"])
        elif action == "fake":
            issue.reported_by.civic_score = max(0, issue.reported_by.civic_score - 10)
            issue.reported_by.save(update_fields=["civic_score"])

        return Response({"message": f"Issue {action}d.", "status": issue.status})


class AuthorityAssignView(APIView):
    """POST /api/issues/<id>/assign/ — authority self-assigns an issue"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not is_authority(request.user) and not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        try:
            issue = CivicIssue.objects.get(pk=pk)
        except CivicIssue.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        if issue.status != CivicIssue.STATUS_VERIFIED:
            return Response({"detail": "Issue must be verified before assignment."}, status=400)
        if hasattr(issue, "assignment"):
            return Response({"detail": "Already assigned."}, status=400)

        sla_hours = int(request.data.get("sla_hours", 72))
        note = request.data.get("note", "")
        Assignment.objects.create(
            issue=issue, assigned_to=request.user,
            assigned_by=request.user, sla_hours=sla_hours, note=note
        )
        old_status = issue.status
        issue.status = CivicIssue.STATUS_ASSIGNED
        issue.save()
        StatusUpdate.objects.create(
            issue=issue, changed_by=request.user,
            from_status=old_status, to_status=issue.status,
            note=f"Assigned to {request.user.full_name}"
        )
        log_action(request.user, "issue_assigned", "CivicIssue", pk)
        return Response({"message": "Issue assigned successfully."})


class AuthorityStatusUpdateView(APIView):
    """POST /api/issues/<id>/status/  — update status + optional proof image"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Valid transitions for authority
    VALID_TRANSITIONS = {
        CivicIssue.STATUS_ASSIGNED: [CivicIssue.STATUS_IN_PROGRESS],
        CivicIssue.STATUS_IN_PROGRESS: [
            CivicIssue.STATUS_RESOLVED, CivicIssue.STATUS_ESCALATED
        ],
        CivicIssue.STATUS_RESOLVED: [CivicIssue.STATUS_CLOSED],
    }

    def post(self, request, pk):
        if not is_authority(request.user) and not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        try:
            issue = CivicIssue.objects.get(pk=pk)
        except CivicIssue.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        new_status = request.data.get("status")
        note = request.data.get("note", "").strip()
        proof = request.FILES.get("proof_image")

        allowed = self.VALID_TRANSITIONS.get(issue.status, [])
        if new_status not in allowed:
            return Response(
                {"detail": f"Cannot move from '{issue.status}' to '{new_status}'."},
                status=400
            )

        old_status = issue.status
        issue.status = new_status
        if new_status == CivicIssue.STATUS_ESCALATED:
            issue.is_escalated = True
            issue.escalated_at = timezone.now()
        issue.save()

        update = StatusUpdate(
            issue=issue, changed_by=request.user,
            from_status=old_status, to_status=new_status, note=note
        )
        if proof:
            update.proof_image = proof
        update.save()

        # Grant credibility on resolve
        if new_status == CivicIssue.STATUS_RESOLVED:
            issue.reported_by.civic_score = issue.reported_by.civic_score + 10
            issue.reported_by.save(update_fields=["civic_score"])

        log_action(request.user, "status_updated", "CivicIssue", pk, f"{old_status}→{new_status}")
        return Response({"message": f"Status updated to '{new_status}'.", "status": new_status})


class AuthorityMyIssuesView(APIView):
    """GET /api/issues/assigned/ — issues assigned to this authority"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_authority(request.user) and not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        qs = CivicIssue.objects.filter(
            assignment__assigned_to=request.user
        ).exclude(
            status__in=[CivicIssue.STATUS_CLOSED, CivicIssue.STATUS_REJECTED, CivicIssue.STATUS_FAKE]
        ).select_related("category", "reported_by", "assignment").prefetch_related("images")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(
            IssueListSerializer(qs, many=True, context={"request": request}).data
        )


# ─── NGO/CSR views ───────────────────────────────────────────────────────────

class NGOEscalatedIssuesView(APIView):
    """GET /api/issues/escalated/ — escalated issues visible to NGOs"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_ngo(request.user) and not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        qs = CivicIssue.objects.filter(
            is_escalated=True
        ).exclude(
            status__in=[CivicIssue.STATUS_CLOSED, CivicIssue.STATUS_REJECTED]
        ).select_related("category", "reported_by").prefetch_related("images", "ngo_assistances")
        return Response(
            IssueListSerializer(qs, many=True, context={"request": request}).data
        )


class NGOAssistView(APIView):
    """POST /api/issues/<id>/ngo-assist/  — NGO accepts/declines assistance"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        if not is_ngo(request.user):
            return Response({"detail": "Only NGO/CSR users can assist."}, status=403)
        try:
            issue = CivicIssue.objects.get(pk=pk, is_escalated=True)
        except CivicIssue.DoesNotExist:
            return Response({"detail": "Escalated issue not found."}, status=404)

        action = request.data.get("action")  # "accept" | "decline"
        note = request.data.get("note", "").strip()
        decline_reason = request.data.get("decline_reason", "").strip()
        proof = request.FILES.get("proof_image")
        bonus = int(request.data.get("bonus_credibility", 0))

        assistance, _ = NGOAssistance.objects.get_or_create(
            issue=issue, ngo_user=request.user
        )
        if action == "accept":
            assistance.accepted = True
            assistance.note = note
            assistance.bonus_credibility = bonus
            if proof:
                assistance.proof_image = proof
        else:
            assistance.accepted = False
            assistance.decline_reason = decline_reason
        assistance.save()

        # Grant optional bonus credibility to citizen
        if action == "accept" and bonus > 0:
            issue.reported_by.civic_score = issue.reported_by.civic_score + bonus
            issue.reported_by.save(update_fields=["civic_score"])

        log_action(request.user, f"ngo_{action}d", "CivicIssue", pk)
        return Response({"message": f"Assistance {action}ed.", "accepted": assistance.accepted})


# ─── Citizen Feedback ─────────────────────────────────────────────────────────

class SubmitFeedbackView(APIView):
    """POST /api/issues/<id>/feedback/ — citizen submits feedback after resolution"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            issue = CivicIssue.objects.get(pk=pk)
        except CivicIssue.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if issue.reported_by != request.user:
            return Response({"detail": "You can only submit feedback for your own issues."}, status=403)
        if not issue.can_submit_feedback:
            return Response({"detail": "Feedback can only be submitted after resolution."}, status=400)
        if hasattr(issue, "feedback"):
            return Response({"detail": "Feedback already submitted."}, status=400)

        serializer = FeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        rating = serializer.validated_data.get("rating", 3)
        IssueFeedback.objects.create(
            issue=issue, submitted_by=request.user, **serializer.validated_data
        )
        # Credibility bonus for submitting feedback
        request.user.civic_score = request.user.civic_score + 2
        request.user.save(update_fields=["civic_score"])

        # Mark as closed after feedback
        old_status = issue.status
        issue.status = CivicIssue.STATUS_CLOSED
        issue.save()
        StatusUpdate.objects.create(
            issue=issue, changed_by=request.user,
            from_status=old_status, to_status=CivicIssue.STATUS_CLOSED,
            note="Citizen submitted feedback. Issue closed."
        )
        log_action(request.user, "feedback_submitted", "CivicIssue", pk)
        return Response({"message": "Feedback submitted. Issue closed.", "civic_score": request.user.civic_score})


# ─── Platform Stats (Admin) ───────────────────────────────────────────────────

class IssueStatsView(APIView):
    """GET /api/issues/stats/ — platform-wide stats for admin dashboard"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)

        total = CivicIssue.objects.count()
        by_status = dict(
            CivicIssue.objects.values_list("status")
            .annotate(c=Count("id"))
            .values_list("status", "c")
        )
        by_severity = dict(
            CivicIssue.objects.values_list("severity")
            .annotate(c=Count("id"))
            .values_list("severity", "c")
        )
        by_category = list(
            CivicIssue.objects.values("category__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:8]
        )
        pending_queue = CivicIssue.objects.filter(
            status=CivicIssue.STATUS_PENDING_VERIFICATION
        ).count()
        escalated = CivicIssue.objects.filter(is_escalated=True).count()
        resolved = by_status.get(CivicIssue.STATUS_RESOLVED, 0) + by_status.get(CivicIssue.STATUS_CLOSED, 0)

        return Response({
            "total": total,
            "pending_queue": pending_queue,
            "escalated": escalated,
            "resolved": resolved,
            "by_status": by_status,
            "by_severity": by_severity,
            "by_category": by_category,
        })


# ─── All Issues (Admin) ────────────────────────────────────────────────────────

class AdminAllIssuesView(APIView):
    """GET /api/issues/all/  — paginated list of all issues for admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        qs = CivicIssue.objects.select_related("category", "reported_by").prefetch_related("images")

        status_f = request.query_params.get("status")
        severity_f = request.query_params.get("severity")
        search = request.query_params.get("search")
        escalated = request.query_params.get("escalated")
        if status_f:
            qs = qs.filter(status=status_f)
        if severity_f:
            qs = qs.filter(severity=severity_f)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(location_address__icontains=search))
        if escalated == "true":
            qs = qs.filter(is_escalated=True)

        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = qs.count()
        qs = qs[(page - 1) * page_size: page * page_size]
        return Response({
            "results": IssueListSerializer(qs, many=True, context={"request": request}).data,
            "total": total,
            "page": page,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        })
