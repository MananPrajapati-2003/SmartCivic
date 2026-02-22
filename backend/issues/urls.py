from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path("categories/", views.CategoryListView.as_view(), name="issue-categories"),

    # Citizen
    path("", views.CitizenIssueListView.as_view(), name="issue-list-submit"),
    path("<int:pk>/", views.IssueDetailView.as_view(), name="issue-detail"),
    path("<int:pk>/feedback/", views.SubmitFeedbackView.as_view(), name="issue-feedback"),

    # Authority
    path("queue/", views.AuthorityQueueView.as_view(), name="authority-queue"),
    path("assigned/", views.AuthorityMyIssuesView.as_view(), name="authority-assigned"),
    path("<int:pk>/verify/", views.AuthorityVerifyView.as_view(), name="issue-verify"),
    path("<int:pk>/assign/", views.AuthorityAssignView.as_view(), name="issue-assign"),
    path("<int:pk>/status/", views.AuthorityStatusUpdateView.as_view(), name="issue-status"),

    # NGO
    path("escalated/", views.NGOEscalatedIssuesView.as_view(), name="escalated-issues"),
    path("<int:pk>/ngo-assist/", views.NGOAssistView.as_view(), name="ngo-assist"),

    # Admin
    path("stats/", views.IssueStatsView.as_view(), name="issue-stats"),
    path("all/", views.AdminAllIssuesView.as_view(), name="admin-all-issues"),
]
