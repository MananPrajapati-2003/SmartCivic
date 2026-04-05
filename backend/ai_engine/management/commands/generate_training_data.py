"""
Management command: generate_training_data

Generates 500+ synthetic civic issue training samples for NLP model training.
Saves two files to ai_engine/training_data/:
  - nlp_dataset.csv        (text + labels for DistilBERT fine-tuning)
  - image_dataset.csv      (image path + labels for ResNet50 fine-tuning)

Usage:
    python manage.py generate_training_data
    python manage.py generate_training_data --nlp-only
    python manage.py generate_training_data --count 1000
"""
import csv
import random
from pathlib import Path
from django.core.management.base import BaseCommand

# ── Issue category templates ──────────────────────────────────────────────────
CATEGORIES = {
    "Road & Infrastructure": {
        "group": "government",
        "templates": [
            "Large {adj} pothole on {loc} causing accidents and damage to vehicles.",
            "Road cave-in near {loc}, one lane completely blocked.",
            "Broken footpath at {loc} making walking dangerous for pedestrians.",
            "Missing manhole cover on {loc} road, accident risk at night.",
            "Street light burned out near {loc}, the entire street is dark.",
            "Severe road damage after rains near {loc} bridge.",
            "Construction debris blocking the main road at {loc}.",
            "Flyover railing broken near {loc}, serious safety hazard.",
        ],
        "damage_types": ["pothole", "road_damage", "construction_hazard"],
    },
    "Sanitation & Waste": {
        "group": "government",
        "templates": [
            "Overflowing garbage bin near {loc} market, not collected for days.",
            "Sewage overflow on {loc} street, strong smell affecting residents.",
            "Open garbage dump near {loc} school breeding mosquitoes.",
            "Drain clogged at {loc} junction, stagnant water accumulating.",
            "Municipal waste not picked up for {days} days in {loc} area.",
            "Garbage strewn across {loc} park after weekend, no cleanup.",
        ],
        "damage_types": ["garbage", "sewage_overflow", "blocked_drain"],
    },
    "Water Supply": {
        "group": "government",
        "templates": [
            "Water pipeline burst near {loc}, flooding the street.",
            "No water supply in {loc} area for the past {days} days.",
            "Contaminated water coming from taps in {loc} colony.",
            "Water supply pipe leaking at {loc} for a week.",
            "Water tanker not supplied to {loc} despite repeated requests.",
        ],
        "damage_types": ["water_leak", "pipe_burst"],
    },
    "Electricity": {
        "group": "government",
        "templates": [
            "Exposed live wire hanging near {loc} building, dangerous.",
            "Power cuts in {loc} for {hours} hours without notice.",
            "Transformer sparking near {loc} colony, fire risk.",
            "Broken electric pole near {loc} market after last night's storm.",
            "Electricity meter box damaged and open at {loc}.",
        ],
        "damage_types": ["exposed_wire", "broken_pole"],
    },
    "Public Safety": {
        "group": "government",
        "templates": [
            "Stray dogs attacking children near {loc} school.",
            "Illegal alcohol being sold near {loc} area.",
            "Suspicious abandoned vehicle parked near {loc} for {days} days.",
            "Street fight and disturbance near {loc} every night.",
            "No CCTV cameras near {loc} — frequent thefts reported.",
        ],
        "damage_types": ["safety_hazard"],
    },
    "Environment & Trees": {
        "group": "ngo",
        "templates": [
            "Large fallen tree blocking {loc} road after last night's storm.",
            "Industrial unit near {loc} dumping chemicals in the river.",
            "Tree branch about to fall near {loc} school, risk to children.",
            "Factory smoke near {loc} causing breathing problems for residents.",
            "Water body near {loc} filled with plastic waste and algae growth.",
        ],
        "damage_types": ["fallen_tree", "pollution"],
    },
    "Animal Welfare": {
        "group": "ngo",
        "templates": [
            "Injured dog on {loc} road, needs immediate veterinary help.",
            "Cow stuck in open drain near {loc}, cannot get out.",
            "Illegal animal slaughter happening near {loc} area.",
            "Stray cattle blocking {loc} highway, traffic disruption.",
            "Dead animal carcass lying on {loc} road for 3 days.",
        ],
        "damage_types": ["animal_hazard"],
    },
    "Community & Social": {
        "group": "ngo",
        "templates": [
            "Encroachment on public park land near {loc}.",
            "Loud speakers disturbing residents at {loc} every night.",
            "Children begging on {loc} road — need social welfare intervention.",
            "Domestic violence reported repeatedly at {loc} building.",
            "Slum clearance needed near {loc} — unhygienic conditions.",
        ],
        "damage_types": ["community_issue"],
    },
}

LOCATIONS = [
    "MG Road", "Anna Nagar", "Koramangala", "Bandra West",
    "Salt Lake", "CP Road", "Sector 15", "Model Town",
    "Civil Lines", "Lal Bazaar", "Shivaji Park", "Rajiv Chowk",
    "Nehru Nagar", "Gandhi Road", "Ambedkar Colony", "Station Road",
]

ADJECTIVES = ["deep", "large", "dangerous", "severe", "critical", "old", "new"]

URGENCY_CONFIGS = [
    {"urgency": "critical", "sentiment": "negative", "score_range": (8.0, 10.0), "weight": 0.25},
    {"urgency": "high",     "sentiment": "negative", "score_range": (6.0, 8.0),  "weight": 0.30},
    {"urgency": "medium",   "sentiment": "neutral",  "score_range": (4.0, 6.0),  "weight": 0.25},
    {"urgency": "low",      "sentiment": "positive", "score_range": (1.0, 4.0),  "weight": 0.20},
]

SITUATION_HANDLING = {
    # (urgency, sentiment): suggested_action
    ("critical", "negative"): "Escalate immediately to Government authority. SLA: 6h. Alert admin.",
    ("high",     "negative"): "Route to Government. SLA: 24h. Priority queue.",
    ("high",     "neutral"):  "Route to Government. SLA: 24h.",
    ("medium",   "negative"): "Route to Government/NGO. SLA: 48h.",
    ("medium",   "neutral"):  "Route to Government/NGO. SLA: 48h.",
    ("medium",   "positive"): "Acknowledge and queue. SLA: 72h.",
    ("low",      "neutral"):  "Standard queue. SLA: 72h.",
    ("low",      "positive"): "Log and resolve. SLA: 96h.",
}


def _rand_text(category: str) -> str:
    tmpl = random.choice(CATEGORIES[category]["templates"])
    return tmpl.format(
        loc=random.choice(LOCATIONS),
        adj=random.choice(ADJECTIVES),
        days=random.randint(2, 10),
        hours=random.randint(3, 48),
    )


def _rand_urgency_config():
    weights = [c["weight"] for c in URGENCY_CONFIGS]
    return random.choices(URGENCY_CONFIGS, weights=weights, k=1)[0]


class Command(BaseCommand):
    help = "Generate synthetic NLP + image training datasets (500+ rows each)"

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=600,
                            help="Total number of NLP samples to generate (default: 600)")
        parser.add_argument("--nlp-only", action="store_true",
                            help="Only generate the NLP CSV")

    def handle(self, *args, **options):
        count = options["count"]
        out_dir = Path(__file__).resolve().parents[4] / "ai_engine" / "training_data"
        out_dir.mkdir(parents=True, exist_ok=True)

        # ── NLP Dataset ───────────────────────────────────────────────────────
        nlp_path = out_dir / "nlp_dataset.csv"
        nlp_fields = [
            "text", "category", "routing_group", "sentiment",
            "urgency", "nlp_score", "suggested_action",
        ]

        with open(nlp_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=nlp_fields)
            writer.writeheader()

            per_category = count // len(CATEGORIES)
            for category, meta in CATEGORIES.items():
                for _ in range(per_category):
                    cfg = _rand_urgency_config()
                    score = round(random.uniform(*cfg["score_range"]), 1)
                    action = SITUATION_HANDLING.get(
                        (cfg["urgency"], cfg["sentiment"]),
                        "Route to Government. SLA: 72h."
                    )
                    writer.writerow({
                        "text":             _rand_text(category),
                        "category":         category,
                        "routing_group":    meta["group"],
                        "sentiment":        cfg["sentiment"],
                        "urgency":          cfg["urgency"],
                        "nlp_score":        score,
                        "suggested_action": action,
                    })

        total_nlp = per_category * len(CATEGORIES)
        self.stdout.write(self.style.SUCCESS(
            f"✅ NLP dataset: {total_nlp} rows → {nlp_path}"
        ))

        if options["nlp_only"]:
            return

        # ── Image Dataset ─────────────────────────────────────────────────────
        image_path = out_dir / "image_dataset.csv"
        img_fields = [
            "image_filename", "category", "damage_type",
            "damage_severity", "visual_score", "is_fake",
        ]

        severity_map = {
            "critical": (8.0, 10.0),
            "high":     (6.0, 8.0),
            "medium":   (4.0, 6.0),
            "low":      (1.0, 4.0),
        }

        with open(image_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=img_fields)
            writer.writeheader()

            idx = 1
            for category, meta in CATEGORIES.items():
                for damage_type in meta["damage_types"]:
                    for severity in ("critical", "high", "medium", "low"):
                        # ~18 rows per damage_type/severity combo (600+ total)
                        for rep in range(18):
                            score = round(random.uniform(*severity_map[severity]), 1)
                            is_fake = "true" if random.random() < 0.05 else "false"
                            writer.writerow({
                                "image_filename": f"{damage_type}_{severity}_{idx:04d}.jpg",
                                "category":       category,
                                "damage_type":    damage_type,
                                "damage_severity":severity,
                                "visual_score":   score,
                                "is_fake":        is_fake,
                            })
                            idx += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Image dataset: {idx - 1} rows → {image_path}"
        ))
        self.stdout.write(self.style.SUCCESS(
            "\n📌 Next steps:\n"
            "  1. Upload nlp_dataset.csv to Google Colab and run colab_train_nlp.ipynb\n"
            "  2. Replace image_dataset.csv filenames with real civic photos\n"
            "  3. Run colab_train_image.ipynb on collected images\n"
            "  4. Upload .pth files to your Hugging Face Space\n"
        ))
