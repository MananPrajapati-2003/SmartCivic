from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_ngoprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='department',
            field=models.CharField(
                blank=True, db_index=True, default='general',
                help_text='Only relevant for authority users — determines which issue categories they see',
                max_length=30,
                choices=[
                    ('roads', 'Roads & Infrastructure'),
                    ('water', 'Water Supply'),
                    ('electricity', 'Electricity'),
                    ('sanitation', 'Sanitation & Waste'),
                    ('safety', 'Public Safety'),
                    ('environment', 'Environment'),
                    ('general', 'General'),
                ]
            ),
        ),
    ]
