"""
ai_engine URL configuration.
"""
from django.urls import path
from .views import AIStatusView, AIStatsView

urlpatterns = [
    # React polls this every 3 seconds after issue submission
    path("status/<int:pk>/", AIStatusView.as_view(), name="ai-status"),

    # Admin dashboard aggregates
    path("stats/", AIStatsView.as_view(), name="ai-stats"),
]
