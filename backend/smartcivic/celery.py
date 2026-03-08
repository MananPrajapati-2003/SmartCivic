"""
Celery application entry-point for SmartCivic.
Uses Upstash Redis (serverless) as broker & result backend.
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smartcivic.settings")

app = Celery("smartcivic")

# Read all CELERY_* settings from Django settings.py
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all INSTALLED_APPS
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
