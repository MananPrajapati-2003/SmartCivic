"""
Celery tasks for SmartCivic AI Engine.

analyze_issue       — main task: calls HF Spaces → stores result → routes
check_sla_and_escalate — fired after SLA window, auto-escalates if unresolved
send_admin_alert    — emails Authority dashboard when score > 8
"""
import time
import base64

import requests
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from gradio_client import Client, handle_file
from django.conf import settings
import os

# ── HuggingFace API helpers ───────────────────────────────────────────────────

def _hf_headers() -> dict:
    return {"Authorization": f"Bearer {settings.HF_API_TOKEN}"}


def _call_hf_nlp(text: str) -> dict:
    """
    Calls the Hugging Face NLP Space using the official Gradio Client.
    Bypasses the '405 Method Not Allowed' error by using the correct API protocol.
    """
    t0 = time.time()
    
    try:
        # 1. Initialize the client (Uses the space name directly)
        # Note: You can also use settings.HF_NLP_API_URL if it's the base URL
        client = Client("smartCivic/smartcivic-ai", token=settings.HF_NLP_TOKEN)
        
        # 2. Call the prediction
        # Gradio Client automatically handles the 'data' wrapping
        # If your Gradio function takes multiple inputs, add them here
        
        result = client.predict(
            text_input=text,      # Matches 'text_input' from your logs
            image_input=None,     # Matches 'image_input' (required but can be None)
            api_name="/predict_all" 
        )
            # text_input=text,
            # image_input=None, # Providing None for image as this is the NLP-only call
            # api_name="/predict"
    
        
        # 3. Process the result
        # The client usually returns the contents of the 'data' list directly
        # If result is a list, we take the first item. If it's already a dict, use it.
        data = result[0] if isinstance(result, list) else result

        return {
            "category":   data.get("category", "Road & Infrastructure"),
            "urgency":    data.get("urgency", "medium"),
            "sentiment":  data.get("sentiment", "neutral"),
            "nlp_score":  float(data.get("urgency_score", 5.0)),
            "summary":    data.get("summary", ""),
            "confidence": float(data.get("confidence", 0.0)),
            "latency_ms": int((time.time() - t0) * 1000),
        }

    except Exception as e:
        # Log the error so you can see it in Celery
        print(f"AI Engine Error: {str(e)}")
        raise e

    # """
    # POST text to the Hugging Face NLP Space (DistilBERT).

    # Expected HF Gradio response shape:
    #     { "data": [{ "category": "...", "urgency": "...",
    #                  "sentiment": "...", "urgency_score": 7.5,
    #                  "summary": "..." }] }
    # """
    # t0 = time.time()
    # resp = requests.post(
    #     settings.HF_NLP_API_URL,
    #     json={"data": [text]},
    #     headers=_hf_headers(),
    #     timeout=30,
    # )
    # resp.raise_for_status()
    # result = resp.json()["data"][0]
    # return {
    #     "category":  result.get("category", "Road & Infrastructure"),
    #     "urgency":   result.get("urgency", "medium"),
    #     "sentiment": result.get("sentiment", "neutral"),
    #     "nlp_score": float(result.get("urgency_score", 5.0)),
    #     "summary":   result.get("summary", ""),
    #     "confidence":float(result.get("confidence", 0.0)),
    #     "latency_ms": int((time.time() - t0) * 1000),
    # }


def _call_hf_image(image_path: str) -> dict:
    """
    Encode the first issue image to base64 and POST to the HF Image Space (ResNet50).

    Expected HF Gradio response shape:
        { "data": [{ "damage_type": "...", "visual_score": 8.2,
                     "confidence": 0.87, "is_fake": false }] }
    """
    t0 = time.time()
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    resp = requests.post(
        settings.HF_IMAGE_API_URL,
        json={"data": [b64]},
        headers=_hf_headers(),
        timeout=45,
    )
    resp.raise_for_status()
    result = resp.json()["data"][0]
    return {
        "damage_type":     result.get("damage_type", ""),
        "visual_score":    float(result.get("visual_score", 5.0)),
        "image_confidence":float(result.get("confidence", 0.0)),
        "is_fake_likely":  bool(result.get("is_fake", False)),
        "latency_ms":      int((time.time() - t0) * 1000),
    }


# ── Main AI task ──────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def analyze_issue(self, issue_id: int):
    """
    The full AI pipeline for a single civic issue:

    1. Mark issue as "processing"
    2. Call HF NLP Space  → category, urgency, sentiment, summary
    3. Call HF Image Space (if image exists) → damage_type, visual_score
    4. Compute history_score + env_score (server-side, free)
    5. Compute final weighted priority score (0–10)
    6. Determine routing (government / ngo) + SLA hours
    7. Persist AIAnalysisResult
    8. Update CivicIssue (category, severity, ai_status, ai_priority_score)
    9. Alert admin if priority > 8
   10. Schedule SLA check countdown
    """
    from issues.models import CivicIssue, IssueCategory
    from ai_engine.models import AIAnalysisResult
    from ai_engine.priority import (
        compute_priority_score,
        compute_history_score,
        compute_env_score,
    )
    from ai_engine.routing import determine_routing

    # ── Fetch issue ────────────────────────────────────────────────────────────
    try:
        issue = CivicIssue.objects.select_related("category", "reported_by").get(
            pk=issue_id
        )
    except CivicIssue.DoesNotExist:
        return  # issue was deleted while queued

    # Mark as processing (React polls this)
    issue.ai_status = "processing"
    issue.save(update_fields=["ai_status"])

    try:
        # ── 1. NLP call ───────────────────────────────────────────────────────
        full_text = f"{issue.title}. {issue.description}"
        nlp = _call_hf_nlp(full_text)

        # ── 2. Image call (first image only to keep latency acceptable) ───────
        image_data: dict = {}
        first_image = issue.images.first()
        if first_image and first_image.image:
            try:
                image_data = _call_hf_image(first_image.image.path)
            except Exception:
                # Image call failed — degrade gracefully, still use NLP
                image_data = {}

        # ── 3 & 4. Server-side scores ─────────────────────────────────────────
        history = compute_history_score(issue)
        env = compute_env_score(issue)

        # ── 5. Weighted priority score ────────────────────────────────────────
        # Use image visual_score if we got one, else fall back to NLP score
        visual = image_data.get("visual_score", nlp["nlp_score"])
        priority = compute_priority_score(
            visual_score=visual,
            nlp_urgency=nlp["urgency"],
            history_score=history,
            env_score=env,
        )

        # ── 6. Routing decision ───────────────────────────────────────────────
        routing = determine_routing(
            category=nlp["category"],
            urgency=nlp["urgency"],
            sentiment=nlp["sentiment"],
            priority_score=priority,
        )

        # ── 7. Persist AIAnalysisResult ───────────────────────────────────────
        AIAnalysisResult.objects.update_or_create(
            issue=issue,
            defaults={
                "predicted_category":  nlp["category"],
                "category_confidence": nlp["confidence"],
                "nlp_summary":         nlp["summary"],
                "sentiment":           nlp["sentiment"],
                "urgency_level":       nlp["urgency"],
                "nlp_score":           nlp["nlp_score"],
                "damage_type":         image_data.get("damage_type", ""),
                "visual_score":        image_data.get("visual_score"),
                "image_confidence":    image_data.get("image_confidence"),
                "is_fake_likely":      image_data.get("is_fake_likely", False),
                "history_score":       history,
                "env_score":           env,
                "priority_score":      priority,
                "routing_target":      routing["target"],
                "sla_hours":           routing["sla_hours"],
                "alert_admin":         routing["alert_admin"],
                "hf_nlp_latency_ms":   nlp["latency_ms"],
                "hf_image_latency_ms": image_data.get("latency_ms"),
                "error_message":       "",
            },
        )

        # ── 8. Update CivicIssue ──────────────────────────────────────────────
        issue.ai_priority_score = priority
        issue.ai_status = "done"

        # Auto-set category only if citizen left it blank
        if not issue.category:
            matched_cat = IssueCategory.objects.filter(
                name=nlp["category"]
            ).first()
            if matched_cat:
                issue.category = matched_cat

        # Auto-set severity only if still at default "medium"
        urgency_to_severity = {
            "low":      "low",
            "medium":   "medium",
            "high":     "high",
            "critical": "critical",
        }
        if issue.severity == "medium":  # only override the default
            issue.severity = urgency_to_severity.get(nlp["urgency"], "medium")

        issue.save()

        # ── 9. Admin alert for high-priority issues ───────────────────────────
        if routing["alert_admin"]:
            send_admin_alert.delay(issue_id, priority, nlp["category"])

        # ── 10. Schedule SLA escalation countdown ─────────────────────────────
        check_sla_and_escalate.apply_async(
            args=[issue_id],
            countdown=routing["sla_hours"] * 3600,   # seconds
        )

    except Exception as exc:
        # On failure, mark the issue so the UI can show an error state
        issue.ai_status = "failed"
        issue.save(update_fields=["ai_status"])
        # Store error message
        AIAnalysisResult.objects.update_or_create(
            issue=issue,
            defaults={"error_message": str(exc), "priority_score": 0.0},
        )
        raise self.retry(exc=exc)


# ── SLA escalation task ───────────────────────────────────────────────────────

@shared_task
def check_sla_and_escalate(issue_id: int):
    """
    Fired by Celery countdown after the SLA window expires.
    If the issue is still unresolved → auto-escalate to NGO and log it.
    """
    from issues.models import CivicIssue
    from ai_engine.models import EscalationLog

    TERMINAL_STATUSES = {"resolved", "closed", "rejected", "fake"}

    try:
        issue = CivicIssue.objects.select_related("ai_result").get(pk=issue_id)
    except CivicIssue.DoesNotExist:
        return

    if issue.status in TERMINAL_STATUSES:
        return  # already resolved — nothing to do

    # Escalate
    old_status = issue.status
    issue.is_escalated = True
    issue.escalated_at = timezone.now()
    issue.status = "escalated"
    issue.save()

    sla_hours = getattr(getattr(issue, "ai_result", None), "sla_hours", 72)
    EscalationLog.objects.create(
        issue=issue,
        escalated_to="ngo",
        reason=f"SLA breached ({sla_hours}h) — status was '{old_status}'",
        sla_deadline=timezone.now(),
    )


# ── Admin email alert ─────────────────────────────────────────────────────────

@shared_task
def send_admin_alert(issue_id: int, priority_score: float, category: str):
    """
    Sends a high-priority alert email to Authority users when
    a new issue scores above the ADMIN_ALERT_THRESHOLD (≥ 8/10).
    """
    from accounts.models import User

    issue_url = f"{settings.FRONTEND_URL}/authority/issues/{issue_id}"

    # Fetch all Authority + Admin emails
    authority_emails = list(
        User.objects.filter(
            role__in=["authority", "org_admin", "super_admin"], is_active=True
        ).values_list("email", flat=True)
    )

    if not authority_emails:
        return

    send_mail(
        subject=f"🚨 SmartCivic ALERT — High Priority Issue #{issue_id} [{category}]",
        message=(
            f"A new civic issue has been flagged as HIGH PRIORITY.\n\n"
            f"Issue ID:      #{issue_id}\n"
            f"Category:      {category}\n"
            f"Priority Score:{priority_score}/10\n\n"
            f"Please review immediately:\n{issue_url}\n\n"
            f"— SmartCivic AI Engine"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=authority_emails,
        fail_silently=True,
    )
