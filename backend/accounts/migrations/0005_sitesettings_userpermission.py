import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_department'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('site_name', models.CharField(default='SmartCivic', max_length=100)),
                ('support_email', models.EmailField(default='support@smartcivic.in')),
                ('email_notifications_enabled', models.BooleanField(default=True, help_text='Global switch — disables all outbound emails when False')),
                ('email_verification_required', models.BooleanField(default=True)),
                ('public_registration_enabled', models.BooleanField(default=True)),
                ('mobile_bonus_enabled', models.BooleanField(default=True)),
                ('default_role', models.CharField(default='citizen', max_length=20)),
                ('otp_expiry_minutes', models.PositiveIntegerField(default=10)),
                ('otp_max_attempts', models.PositiveIntegerField(default=5)),
                ('otp_session_duration', models.PositiveIntegerField(default=30)),
                ('sla_critical_hours', models.PositiveIntegerField(default=6)),
                ('sla_high_hours', models.PositiveIntegerField(default=24)),
                ('sla_medium_hours', models.PositiveIntegerField(default=48)),
                ('sla_low_hours', models.PositiveIntegerField(default=72)),
                ('maintenance_mode', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='settings_updates', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'site_settings', 'verbose_name': 'Site Settings'},
        ),
        migrations.CreateModel(
            name='UserPermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('permission', models.CharField(choices=[
                    ('view_reports', 'View Reports'),
                    ('approve_reports', 'Approve Reports'),
                    ('reject_reports', 'Reject Reports'),
                    ('assign_issues', 'Assign Issues'),
                    ('manage_users', 'Manage Users'),
                    ('manage_ngo', 'Manage NGO Approvals'),
                    ('create_accounts', 'Create Accounts'),
                    ('view_ai_data', 'View AI Analysis Data'),
                    ('export_data', 'Export Data'),
                    ('send_notifications', 'Send Notifications'),
                    ('manage_settings', 'Manage Settings'),
                    ('add_pages', 'Add/Edit Pages'),
                ], max_length=50)),
                ('granted_at', models.DateTimeField(auto_now_add=True)),
                ('granted_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='permissions_granted', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='custom_permissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'user_permissions_custom', 'verbose_name': 'User Permission', 'unique_together': {('user', 'permission')}},
        ),
    ]
