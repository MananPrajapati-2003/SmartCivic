"""
AI Engine API views.

AIPreviewView  — POST /api/ai/preview/           (form-time AI analysis, returns category/urgency)
AIStatusView   — GET  /api/ai/status/<issue_id>/ (React polling endpoint after submission)
AIStatsView    — GET  /api/ai/stats/             (Admin dashboard metrics)
"""
import tempfile
import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from accounts.models import User


# ── Map HF category names → our DB IssueCategory names ──────────────────────
HF_TO_DB_CATEGORY = {
    "Road_Issues_Pothole":            "Roads & Potholes",
    "Road_Issues_Damaged_Sign":       "Roads & Potholes",
    "Infrastructure_Damage_Concrete": "Road & Infrastructure",
    "Domestic_trash":                 "Sanitation & Garbage",
    "Vandalism_Graffiti":             "Environment & Trees",
    "Parking_Issues_Illegal_Parking": "Roads & Potholes",
    # pass-through for names that already match DB
}


class AIPreviewView(APIView):
    """
    POST /api/ai/preview/
    Called by the form wizard after the user fills title, description, and attaches a photo.
    Runs the HuggingFace model synchronously and returns the predicted category,
    urgency, and confidence so the form can display them as read-only AI results.

    multipart/form-data:
        text  — "{title}. {description}"
        image — first uploaded image file (optional but strongly recommended)

    Response:
        {
            "category":    "Roads & Potholes",
            "hf_category": "Road_Issues_Pothole",
            "urgency":     "high",
            "confidence":  0.91,
            "summary":     "AI identified Road_Issues_Pothole with 91% confidence."
        }
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        from ai_engine.tasks import _call_hf_space
        from issues.models import IssueCategory

        text  = request.data.get("text", "").strip()
        image = request.FILES.get("image")

        if not text:
            return Response({"detail": "text is required."}, status=400)

        # The HF model (ResNet50) requires an image — text-only calls return null
        # so the frontend placeholder stays visible until the user adds a photo.
        if not image:
            return Response({"needs_image": True}, status=200)

        # Write image to a temp file so _call_hf_space can read it via path
        tmp_path = None
        try:
            suffix = os.path.splitext(image.name)[1] or ".jpg"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in image.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            result = _call_hf_space(text, tmp_path)

            hf_cat  = result.get("category", "")
            db_name = HF_TO_DB_CATEGORY.get(hf_cat, hf_cat)

            # Resolve to DB category id so the frontend can pass category_id on submit
            cat_obj = IssueCategory.objects.filter(name__iexact=db_name, is_active=True).first()
            # Fallback: partial match
            if not cat_obj:
                cat_obj = IssueCategory.objects.filter(name__icontains=db_name.split("&")[0].strip(), is_active=True).first()

            return Response({
                "category":    cat_obj.name if cat_obj else db_name,
                "category_id": cat_obj.id   if cat_obj else None,
                "hf_category": hf_cat,
                "urgency":     result.get("urgency",    "medium"),
                "confidence":  result.get("confidence", 0.0),
                "summary":     result.get("summary",    ""),
            })

        except Exception as exc:
            return Response({"detail": f"AI preview failed: {exc}"}, status=502)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)


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
