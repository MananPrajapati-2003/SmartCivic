from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="civicissue",
            name="ai_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("processing", "Processing"),
                    ("done", "Done"),
                    ("failed", "Failed"),
                ],
                db_index=True,
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="civicissue",
            name="ai_priority_score",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
