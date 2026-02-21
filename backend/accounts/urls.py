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

    # ── Admin API (super_admin only) ──────────────────────────────────────────
    path("admin/stats/", admin_views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/users/", admin_views.AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/", admin_views.AdminUserDetailView.as_view(), name="admin-user-detail"),
]
