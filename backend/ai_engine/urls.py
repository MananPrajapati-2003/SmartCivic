"""
ai_engine URL configuration.
"""
from django.urls import path
from .views import AIPreviewView, AIStatusView, AIStatsView

urlpatterns = [
    # Form-time AI preview — called while user is filling the report form
    path("preview/", AIPreviewView.as_view(), name="ai-preview"),

    # React polls this every 3 seconds after issue submission
    path("status/<int:pk>/", AIStatusView.as_view(), name="ai-status"),

    # Admin dashboard aggregates
    path("stats/", AIStatsView.as_view(), name="ai-stats"),
]
