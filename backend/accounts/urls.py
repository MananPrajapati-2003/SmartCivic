from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import admin_views

urlpatterns = [
    # ── Public: Registration & Login ──────────────────────────────────────────
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),

    # ── Email Verification ────────────────────────────────────────────────────
    path("verify-email/", views.VerifyEmailOTPView.as_view(), name="auth-verify-email"),
    path("resend-otp/", views.ResendOTPView.as_view(), name="auth-resend-otp"),

    # ── Mobile OTP (authenticated) ────────────────────────────────────────────
    path("send-mobile-otp/", views.SendMobileOTPView.as_view(), name="auth-send-mobile-otp"),
    path("verify-mobile/", views.VerifyMobileOTPView.as_view(), name="auth-verify-mobile"),

    # ── Password Reset (public) ───────────────────────────────────────────────
    path("forgot-password/", views.ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password/", views.ResetPasswordView.as_view(), name="auth-reset-password"),

    # ── Authenticated Profile Actions ─────────────────────────────────────────
    path("me/", views.MeView.as_view(), name="auth-me"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("change-password/", views.ChangePasswordView.as_view(), name="auth-change-password"),

    # ── JWT Token Refresh ─────────────────────────────────────────────────────
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # ── Admin: Stats & User Management ────────────────────────────────────────
    path("admin/stats/", admin_views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/users/", admin_views.AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/", admin_views.AdminUserDetailView.as_view(), name="admin-user-detail"),

    # ── Admin: NGO Approvals ──────────────────────────────────────────────────
    path("admin/ngo/", admin_views.AdminNGOListView.as_view(), name="admin-ngo-list"),
    path("admin/ngo/<int:pk>/action/", admin_views.AdminNGOActionView.as_view(), name="admin-ngo-action"),

    # ── Admin: Account Creation ───────────────────────────────────────────────
    path("admin/create-authority/", admin_views.AdminCreateAuthorityView.as_view(), name="admin-create-authority"),
    path("admin/create-admin/", admin_views.AdminCreateAdminView.as_view(), name="admin-create-admin"),

    # ── Admin: Authority users list (for issue assignment) ────────────────────
    path("admin/authority-users/", admin_views.AdminAuthorityUsersView.as_view(), name="admin-authority-users"),
]
