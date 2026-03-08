from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings

from .models import User, OTPVerification
from .serializers import (
    CitizenRegisterSerializer, NGORegisterSerializer, LoginSerializer, UserSerializer,
    VerifyOTPSerializer, ResendOTPSerializer,
    SendMobileOTPSerializer, VerifyMobileOTPSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, ChangePasswordSerializer,
)
from .email_service import (
    send_welcome_and_email_otp, send_email_otp,
    send_mobile_otp_email, send_password_reset_email,
    send_ngo_pending_email,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


# ─── Registration & Login ─────────────────────────────────────────────────────

class RegisterView(APIView):
    """
    POST /api/auth/register/
    Accepts { role: 'citizen' | 'ngo_csr', ...fields }
    Citizen → creates active user, sends OTP, redirects to verify-email.
    NGO/CSR  → creates inactive user + NGOProfile, sends pending email.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        role = request.data.get("role", "citizen")

        if role == User.ROLE_NGO_CSR:
            serializer = NGORegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                send_ngo_pending_email(user, user.ngo_profile.org_name)
                return Response(
                    {
                        "message": "NGO registration submitted. Our team will review your application and notify you by email.",
                        "type": "ngo_pending",
                        "org_name": user.ngo_profile.org_name,
                        "email": user.email,
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        else:
            # Default: citizen
            serializer = CitizenRegisterSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                user = serializer.save()
                otp_obj = OTPVerification.generate_otp(user, OTPVerification.TYPE_EMAIL)
                email_sent = send_welcome_and_email_otp(user, otp_obj.otp)
                return Response(
                    {
                        "message": "Registration successful. Please check your email for the OTP to verify your account.",
                        "type": "citizen",
                        "email": user.email,
                        "email_sent": email_sent,
                        "requires_email_verification": True,
                        **({"dev_otp": otp_obj.otp} if settings.DEBUG else {}),
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Validates credentials. Blocks unverified users with a specific error code.
    """
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]

            # Block login if email is not verified (citizen only)
            if not user.is_email_verified and user.role == User.ROLE_CITIZEN:
                return Response(
                    {
                        "detail": "Please verify your email before logging in.",
                        "code": "email_not_verified",
                        "email": user.email,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "Login successful.",
                    "user": UserSerializer(user, context={"request": request}).data,
                    "tokens": tokens,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


# ─── Email Verification ───────────────────────────────────────────────────────

class VerifyEmailOTPView(APIView):
    """
    POST /api/auth/verify-email/
    Accepts { email, otp } and marks is_email_verified = True on success.
    Returns JWT tokens so the user is immediately logged in.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"].lower()
        otp_value = serializer.validated_data["otp"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "No account found with this email."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({"detail": "Email is already verified. Please login."}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = (
            OTPVerification.objects
            .filter(user=user, otp_type=OTPVerification.TYPE_EMAIL, is_used=False, otp=otp_value)
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            return Response({"otp": "Invalid OTP. Please check or request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj.is_expired:
            otp_obj.is_used = True
            otp_obj.save(update_fields=["is_used"])
            return Response({"otp": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP and user as verified
        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "Email verified successfully! You are now logged in.",
                "user": UserSerializer(user, context={"request": request}).data,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )


class ResendOTPView(APIView):
    """
    POST /api/auth/resend-otp/
    Accepts { email, otp_type } and resends the OTP.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"].lower()
        otp_type = serializer.validated_data["otp_type"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "No account found with this email."}, status=status.HTTP_404_NOT_FOUND)

        otp_obj = OTPVerification.generate_otp(user, otp_type)

        if otp_type == OTPVerification.TYPE_EMAIL:
            send_email_otp(user, otp_obj.otp)
            return Response(
                {
                    "message": "OTP sent to your email.",
                    **({"dev_otp": otp_obj.otp} if settings.DEBUG else {}),
                },
                status=status.HTTP_200_OK,
            )

        return Response({"detail": "Invalid OTP type."}, status=status.HTTP_400_BAD_REQUEST)


# ─── Mobile OTP Verification ──────────────────────────────────────────────────

class SendMobileOTPView(APIView):
    """
    POST /api/auth/send-mobile-otp/
    Authenticated. Sends OTP to the user's email for mobile number verification.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.mobile_number:
            return Response(
                {"detail": "No mobile number on your account. Please update your profile first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_mobile_verified:
            return Response({"detail": "Mobile number is already verified."}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = OTPVerification.generate_otp(user, OTPVerification.TYPE_MOBILE)
        send_mobile_otp_email(user, otp_obj.otp)

        response_data = {
            "message": f"OTP sent to your email ({user.email}). Enter it to verify your mobile number.",
            "email": user.email,
        }
        if settings.DEBUG:
            response_data["dev_otp"] = otp_obj.otp

        return Response(response_data, status=status.HTTP_200_OK)


class VerifyMobileOTPView(APIView):
    """
    POST /api/auth/verify-mobile/
    Authenticated. Validates the mobile OTP and marks is_mobile_verified = True.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyMobileOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        otp_value = serializer.validated_data["otp"]

        otp_obj = (
            OTPVerification.objects
            .filter(user=user, otp_type=OTPVerification.TYPE_MOBILE, is_used=False, otp=otp_value)
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            return Response({"otp": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if otp_obj.is_expired:
            otp_obj.is_used = True
            otp_obj.save(update_fields=["is_used"])
            return Response({"otp": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])
        user.is_mobile_verified = True
        user.civic_score += 50  # Reward for mobile verification
        user.save(update_fields=["is_mobile_verified", "civic_score"])

        return Response(
            {
                "message": "Mobile number verified! +50 civic score awarded.",
                "user": UserSerializer(user, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


# ─── Password Reset ───────────────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Sends a password reset link to the user's email.
    Always returns 200 to avoid user enumeration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"].lower()
        SAFE_MSG = {"message": "If this email is registered, you will receive a password reset link shortly."}

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(SAFE_MSG, status=status.HTTP_200_OK)

        token_generator = PasswordResetTokenGenerator()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        send_password_reset_email(user, reset_link)
        return Response(SAFE_MSG, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Validates the uid+token from the reset email and sets the new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({"detail": "Reset link is invalid or has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"message": "Password reset successful. Please login with your new password."},
            status=status.HTTP_200_OK,
        )


# ─── Profile Views ────────────────────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        allowed = {"full_name", "mobile_number", "profile_image"}
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = UserSerializer(request.user, data=data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
            return Response({"message": "Logout successful."})
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response({"old_password": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data["new_password"])
            user.save(update_fields=["password"])
            return Response({"message": "Password changed. Please log in again."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
