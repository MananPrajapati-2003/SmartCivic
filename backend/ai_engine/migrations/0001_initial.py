import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("issues", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIAnalysisResult",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("issue", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="ai_result",
                    to="issues.civicissue",
                )),
                # NLP outputs
                ("predicted_category", models.CharField(blank=True, max_length=100)),
                ("category_confidence", models.FloatField(default=0.0)),
                ("nlp_summary", models.TextField(blank=True, default="")),
                ("sentiment", models.CharField(
                    choices=[("positive", "Positive"), ("negative", "Negative"), ("neutral", "Neutral")],
                    default="neutral",
                    max_length=20,
                )),
                ("urgency_level", models.CharField(
                    choices=[("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")],
                    default="medium",
                    max_length=20,
                )),
                ("nlp_score", models.FloatField(default=0.0)),
                # Image outputs
                ("damage_type", models.CharField(blank=True, default="", max_length=100)),
                ("visual_score", models.FloatField(blank=True, null=True)),
                ("image_confidence", models.FloatField(blank=True, null=True)),
                ("is_fake_likely", models.BooleanField(default=False)),
                # Server-side scores
                ("history_score", models.FloatField(default=0.0)),
                ("env_score", models.FloatField(default=0.0)),
                # Final priority
                ("priority_score", models.FloatField(default=0.0)),
                # Routing
                ("routing_target", models.CharField(
                    choices=[("government", "Government"), ("ngo", "NGO / CSR")],
                    default="government",
                    max_length=20,
                )),
                ("sla_hours", models.IntegerField(default=72)),
                ("alert_admin", models.BooleanField(default=False)),
                # Performance
                ("hf_nlp_latency_ms", models.IntegerField(blank=True, null=True)),
                ("hf_image_latency_ms", models.IntegerField(blank=True, null=True)),
                ("ai_version", models.CharField(default="v1.0", max_length=20)),
                ("processed_at", models.DateTimeField(auto_now_add=True)),
                ("error_message", models.TextField(blank=True, default="")),
            ],
            options={
                "db_table": "ai_analysis_results",
                "ordering": ["-processed_at"],
            },
        ),
        migrations.CreateModel(
            name="EscalationLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("issue", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="escalation_logs",
                    to="issues.civicissue",
                )),
                ("escalated_to", models.CharField(max_length=50)),
                ("reason", models.CharField(max_length=300)),
                ("sla_deadline", models.DateTimeField()),
                ("escalated_at", models.DateTimeField(auto_now_add=True)),
                ("resolved", models.BooleanField(default=False)),
                ("notified_emails", models.TextField(blank=True, default="")),
            ],
            options={
                "db_table": "ai_escalation_logs",
                "ordering": ["-escalated_at"],
            },
        ),
    ]
