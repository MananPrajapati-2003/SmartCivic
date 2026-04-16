"""
AI Engine API views.

AIStatusView   — GET /api/ai/status/<issue_id>/  (React polling endpoint)
AIStatsView    — GET /api/ai/stats/              (Admin dashboard metrics)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.models import User


class AIStatusView(APIView):
    """
    Polled by the React frontend every 3 seconds after issue submission.
    Returns the AI processing state and result once done.

    GET /api/ai/status/<issue_id>/
    Response:
        {
            "issue_id":  1,
            "ai_status": "pending" | "processing" | "done" | "failed",
            "ai_result": { ... } | null
        }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from issues.models import CivicIssue
        from ai_engine.serializers import AIAnalysisResultSerializer

        try:
            issue = CivicIssue.objects.select_related(
                "ai_result", "reported_by"
            ).get(pk=pk)
        except CivicIssue.DoesNotExist:
            return Response({"detail": "Issue not found."}, status=404)

        # Citizens can only poll their own issues
        if request.user.role == User.ROLE_CITIZEN and issue.reported_by != request.user:
            return Response({"detail": "Forbidden."}, status=403)

        result_data = None
        if issue.ai_status == "done" and hasattr(issue, "ai_result"):
            result_data = AIAnalysisResultSerializer(issue.ai_result).data

        return Response(
            {
                "issue_id":  issue.id,
                "ai_status": issue.ai_status,
                "ai_result": result_data,
            }
        )


class AIStatsView(APIView):
    """
    Admin view — platform-wide AI analysis metrics.
    GET /api/ai/stats/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in (
            User.ROLE_ORG_ADMIN, User.ROLE_SUPER_ADMIN
        ) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=403)

        from ai_engine.models import AIAnalysisResult, EscalationLog
        from django.db.models import Avg, Count

        total_analyzed = AIAnalysisResult.objects.count()
        avg_priority   = AIAnalysisResult.objects.aggregate(
            avg=Avg("priority_score")
        )["avg"] or 0

        by_routing = dict(
            AIAnalysisResult.objects.values_list("routing_target")
            .annotate(c=Count("id"))
            .values_list("routing_target", "c")
        )

        by_sentiment = dict(
            AIAnalysisResult.objects.values_list("sentiment")
            .annotate(c=Count("id"))
            .values_list("sentiment", "c")
        )

        by_urgency = dict(
            AIAnalysisResult.objects.values_list("urgency_level")
            .annotate(c=Count("id"))
            .values_list("urgency_level", "c")
        )

        top_categories = list(
            AIAnalysisResult.objects.values("predicted_category")
            .annotate(count=Count("id"))
            .order_by("-count")[:8]
        )

        escalations_total = EscalationLog.objects.count()
        escalations_unresolved = EscalationLog.objects.filter(resolved=False).count()

        high_priority = AIAnalysisResult.objects.filter(
            priority_score__gte=8
        ).count()

        return Response(
            {
                "total_analyzed":        total_analyzed,
                "avg_priority_score":    round(avg_priority, 2),
                "high_priority_count":   high_priority,
                "by_routing_target":     by_routing,
                "by_sentiment":          by_sentiment,
                "by_urgency":            by_urgency,
                "top_predicted_categories": top_categories,
                "escalations_total":     escalations_total,
                "escalations_unresolved":escalations_unresolved,
            }
        )
