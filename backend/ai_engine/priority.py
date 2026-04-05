"""
Weighted priority score calculator for SmartCivic civic issues.

Formula:
    Priority Score (0–10) =
        visual_score  × 0.4   (damage seen in image — from ResNet50 on HF)
      + nlp_score     × 0.3   (text urgency — from BERT on HF)
      + history_score × 0.2   (repeat complaint weight — server-side)
      + env_score     × 0.1   (seasonal/area risk factor — server-side)

Score > 8  → Critical  (auto-alert Authority + schedule escalation at 6 h)
Score 6–8  → High      (route to Government, SLA 24 h)
Score 4–6  → Medium    (route to Government/NGO, SLA 48 h)
Score < 4  → Low       (standard queue, SLA 72–96 h)
"""
import math

# ── Score weights ─────────────────────────────────────────────────────────────
WEIGHTS = {
    "visual":  0.4,
    "nlp":     0.3,
    "history": 0.2,
    "env":     0.1,
}

# Map urgency string → normalised 0–10 score
URGENCY_TO_SCORE = {
    "low":      2.5,
    "medium":   5.0,
    "high":     7.5,
    "critical": 10.0,
}

# Monsoon months (India) — higher water/sanitation risk
MONSOON_MONTHS = {6, 7, 8, 9}
# Summer months — higher electricity stress
SUMMER_MONTHS = {4, 5}


def compute_history_score(issue) -> float:
    """
    Score 0–10 based on number of repeat complaints at the same location
    and same category.  Uses log₂ scaling so a single complaint = 0,
    two complaints ≈ 3.3, ten complaints ≈ 9.6.
    """
    from issues.models import CivicIssue

    if not issue.location_address:
        return 0.0

    nearby_count = (
        CivicIssue.objects.filter(
            location_address__icontains=issue.location_address[:30],
            category=issue.category,
        )
        .exclude(pk=issue.pk)
        .count()
    )
    # log1p(n) * (10 / log1p(10)) ≈ scales 0→0, 1→3.3, 9→7.6, 99→10
    return min(10.0, math.log1p(nearby_count) * 3.32)


def compute_env_score(issue) -> float:
    """
    Score 0–10: risk boost driven by season and issue category.
    Extend this with a live weather API (e.g. OpenWeatherMap) later.
    """
    from django.utils import timezone

    month = timezone.now().month
    category_name = (issue.category.name if issue.category else "").lower()
    score = 3.0  # baseline environmental risk

    # Water-related issues spike in monsoon
    if any(k in category_name for k in ("water", "flood", "sewage", "sanitation")):
        if month in MONSOON_MONTHS:
            score += 4.0

    # Electricity stress in summer
    if "electricity" in category_name and month in SUMMER_MONTHS:
        score += 2.0

    # Road damage worsens in monsoon
    if "road" in category_name and month in MONSOON_MONTHS:
        score += 2.0

    return min(10.0, score)


def compute_priority_score(
    visual_score: float,
    nlp_urgency: str,
    history_score: float,
    env_score: float,
) -> float:
    """
    Compute the final weighted priority score.

    Args:
        visual_score:   0–10  from ResNet50 regression head (HF Space)
        nlp_urgency:    "low" | "medium" | "high" | "critical"  (from BERT)
        history_score:  0–10  from compute_history_score()
        env_score:      0–10  from compute_env_score()

    Returns:
        float 0–10 (2 decimal places)
    """
    nlp_score = URGENCY_TO_SCORE.get(nlp_urgency, 5.0)
    raw = (
        visual_score  * WEIGHTS["visual"]
        + nlp_score   * WEIGHTS["nlp"]
        + history_score * WEIGHTS["history"]
        + env_score   * WEIGHTS["env"]
    )
    return round(min(10.0, max(0.0, raw)), 2)
