"""
Routing Engine for SmartCivic.

Determines:
  - routing_target: "government" or "ngo"
  - sla_hours:      integer — deadline for resolution
  - alert_admin:    bool   — fire an immediate admin alert

Rules:
  Score > 8         → always alert admin regardless of route
  Government cats   → Road, Sanitation, Water, Electricity, Safety
  NGO/CSR cats      → Environment, Animal Welfare, Community
"""

# ── Category → routing group ──────────────────────────────────────────────────
CATEGORY_GROUP: dict[str, str] = {
    # ── Actual class names returned by the trained ResNet50 HF Space ──────────
    # (from class_mapping.json: Domestic_trash, Infrastructure_Damage_Concrete,
    #  Parking_Issues_Illegal_Parking, Road_Issues_Damaged_Sign,
    #  Road_Issues_Pothole, Vandalism_Graffiti)
    "Road_Issues_Pothole":               "government",
    "Road_Issues_Damaged_Sign":          "government",
    "Infrastructure_Damage_Concrete":    "government",
    "Parking_Issues_Illegal_Parking":    "government",
    "Domestic_trash":                    "government",
    "Vandalism_Graffiti":                "ngo",

    # ── Display / legacy names (kept for backward compat) ─────────────────────
    "Road & Infrastructure":             "government",
    "Water Supply":                      "government",
    "Sanitation & Garbage":              "government",
    "Public Safety & Lighting":          "government",
    "Sanitation & Waste":                "government",
    "Electricity":                       "government",
    "Public Safety":                     "government",
    "Other":                             "government",
    "Environment & Trees":               "ngo",
    "Animal Welfare":                    "ngo",
    "Community & Social":                "ngo",
}

# ── (routing_group, urgency_level) → SLA hours ───────────────────────────────
SLA_TABLE: dict[tuple[str, str], int] = {
    # Government — faster SLAs (official mandate)
    ("government", "critical"):  6,
    ("government", "high"):     24,
    ("government", "medium"):   48,
    ("government", "low"):      72,
    # NGO/CSR — slightly more lead time
    ("ngo", "critical"):        12,
    ("ngo", "high"):            24,
    ("ngo", "medium"):          48,
    ("ngo", "low"):             96,
}

# Score threshold above which admin gets an immediate alert
ADMIN_ALERT_THRESHOLD = 8.0


def determine_routing(
    category: str,
    urgency: str,
    sentiment: str,
    priority_score: float = 0.0,
) -> dict:
    """
    Decide routing target and SLA.

    Args:
        category:       Predicted category name from NLP model
        urgency:        "low" | "medium" | "high" | "critical"
        sentiment:      "positive" | "negative" | "neutral"
        priority_score: Weighted 0–10 score (used for admin alert threshold)

    Returns:
        dict with keys: target, sla_hours, alert_admin
    """
    group = CATEGORY_GROUP.get(category, "government")  # default to govt
    sla = SLA_TABLE.get((group, urgency), 72)

    # Alert admin when score is critical OR (high urgency + negative sentiment)
    alert_admin = (
        priority_score >= ADMIN_ALERT_THRESHOLD
        or (urgency == "critical" and sentiment == "negative")
    )

    return {
        "target":      group,
        "sla_hours":   sla,
        "alert_admin": alert_admin,
    }
