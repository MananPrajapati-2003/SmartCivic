"""
Notifications API — returns role-appropriate recent activity for each user.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from issues.models import CivicIssue, StatusUpdate, Assignment, NGOAssistance, IssueFeedback


class NotificationsView(APIView):
    """
    GET /api/auth/notifications/
    Returns last 15 role-appropriate notifications for the logged-in user.
    Each notification: { id, type, message, detail, time, read: false, link }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = []

        if user.role == User.ROLE_CITIZEN:
            # Citizen: status updates on their issues, NGO assistance, assignments
            updates = StatusUpdate.objects.filter(
                issue__reported_by=user
            ).select_related("issue", "changed_by").order_by("-updated_at")[:15]
            for u in updates:
                icon_map = {
                    "verified": "check",
                    "rejected": "x",
                    "assigned": "user",
                    "in_progress": "clock",
                    "resolved": "star",
                    "escalated": "flame",
                    "closed": "lock",
                    "fake": "alert",
                }
                label_map = {
                    "pending_verification": "Pending",
                    "verified": "Verified",
                    "rejected": "Rejected",
                    "assigned": "Assigned",
                    "in_progress": "In Progress",
                    "resolved": "Resolved",
                    "escalated": "Escalated",
                    "closed": "Closed",
                    "fake": "Marked Fake",
                }
                notifications.append({
                    "id": f"su_{u.id}",
                    "type": "status_update",
                    "icon": icon_map.get(u.to_status, "info"),
                    "message": f'Your issue "{u.issue.title[:40]}" status changed',
                    "detail": f'→ {label_map.get(u.to_status, u.to_status)}' + (f': {u.note[:60]}' if u.note else ''),
                    "time": u.updated_at.isoformat(),
                    "link": f"/issue/{u.issue.id}",
                })

        elif user.role == User.ROLE_AUTHORITY:
            # Authority: new assignments, SLA warnings
            assignments = Assignment.objects.filter(
                assigned_to=user
            ).select_related("issue", "issue__category").order_by("-assigned_at")[:10]
            for a in assignments:
                notifications.append({
                    "id": f"asgn_{a.id}",
                    "type": "assignment",
                    "icon": "clipboard",
                    "message": f'Issue assigned: "{a.issue.title[:40]}"',
                    "detail": a.issue.category.name if a.issue.category else a.issue.location_address[:50],
                    "time": a.assigned_at.isoformat(),
                    "link": "/authority/my-issues",
                })
            # SLA overdue
            overdue = CivicIssue.objects.filter(
                assignment__assigned_to=user,
                assignment__sla_deadline__lt=timezone.now(),
                status__in=["assigned", "in_progress"]
            ).select_related("assignment")[:5]
            for issue in overdue:
                notifications.append({
                    "id": f"sla_{issue.id}",
                    "type": "sla_overdue",
                    "icon": "alert",
                    "message": f'SLA overdue: "{issue.title[:40]}"',
                    "detail": "Immediate action required",
                    "time": issue.assignment.sla_deadline.isoformat() if issue.assignment.sla_deadline else timezone.now().isoformat(),
                    "link": "/authority/my-issues",
                })

        elif user.role == User.ROLE_NGO_CSR:
            # NGO: new escalated issues, accepted assistances
            escalated = CivicIssue.objects.filter(
                is_escalated=True
            ).exclude(
                status__in=["closed", "rejected"]
            ).order_by("-escalated_at")[:8]
            for issue in escalated:
                notifications.append({
                    "id": f"esc_{issue.id}",
                    "type": "escalated",
                    "icon": "flame",
                    "message": f'Escalated: "{issue.title[:40]}"',
                    "detail": issue.location_address[:60] if issue.location_address else "",
                    "time": (issue.escalated_at or issue.created_at).isoformat(),
                    "link": "/ngo/escalated",
                })

        elif user.role in (User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN) or user.is_staff:
            # Admin: new issues, new users, feedback, NGO approvals
            from accounts.models import NGOProfile
            # Recent issues submitted
            recent_issues = CivicIssue.objects.order_by("-created_at")[:5]
            for issue in recent_issues:
                notifications.append({
                    "id": f"new_{issue.id}",
                    "type": "new_issue",
                    "icon": "map-pin",
                    "message": f'New issue: "{issue.title[:40]}"',
                    "detail": issue.severity.capitalize() + " · " + (issue.category.name if issue.category else ""),
                    "time": issue.created_at.isoformat(),
                    "link": "/admin/issues",
                })
            # Pending NGO approvals
            pending_ngos = NGOProfile.objects.filter(
                approval_status="pending"
            ).select_related("user").order_by("-registered_at")[:3]
            for ngo in pending_ngos:
                notifications.append({
                    "id": f"ngo_{ngo.id}",
                    "type": "ngo_pending",
                    "icon": "building",
                    "message": f'NGO pending: {ngo.org_name[:40]}',
                    "detail": f'Submitted by {ngo.user.full_name}',
                    "time": ngo.registered_at.isoformat(),
                    "link": "/admin/ngo-approvals",
                })
            # Recent feedback
            feedbacks = IssueFeedback.objects.select_related("issue", "submitted_by").order_by("-submitted_at")[:3]
            for fb in feedbacks:
                notifications.append({
                    "id": f"fb_{fb.id}",
                    "type": "feedback",
                    "icon": "star",
                    "message": f'Feedback: "{fb.issue.title[:35]}"',
                    "detail": f'Rating {fb.rating}/5 by {fb.submitted_by.full_name}',
                    "time": fb.submitted_at.isoformat(),
                    "link": "/admin/issues",
                })

        # Sort all by time desc, limit 15
        notifications.sort(key=lambda x: x["time"], reverse=True)
        return Response(notifications[:15])
