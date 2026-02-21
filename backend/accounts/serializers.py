from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer — returned in all auth responses."""

    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "mobile_number", "role",
            "civic_score", "profile_image", "profile_image_url",
            "is_email_verified", "is_mobile_verified", "date_joined",
        ]
        read_only_fields = fields

    def get_profile_image_url(self, obj):
        request = self.context.get("request")
        if obj.profile_image:
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """Public citizen self-registration serializer."""

    password = serializers.CharField(write_only=True, min_length=6, style={"input_type": "password"})
    confirm_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["email", "full_name", "mobile_number", "password", "confirm_password", "profile_image"]
        extra_kwargs = {
            "profile_image": {"required": False, "allow_null": True},
            "mobile_number": {"required": False, "allow_blank": True},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_mobile_number(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Mobile number must contain only digits.")
        if value and len(value) != 10:
            raise serializers.ValidationError("Mobile number must be exactly 10 digits.")
        return value

    def validate(self, data):
        if data["password"] != data.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        profile_image = validated_data.pop("profile_image", None)
        validated_data["role"] = User.ROLE_CITIZEN
        validated_data["is_email_verified"] = False
        validated_data["is_mobile_verified"] = False
        user = User.objects.create_user(**validated_data)
        if profile_image:
            user.profile_image = profile_image
            user.save(update_fields=["profile_image"])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        email = data.get("email", "").lower()
        password = data.get("password", "")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({"detail": "Invalid email or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Your account has been deactivated."})
        data["user"] = user
        return data


# ─── OTP Serializers ──────────────────────────────────────────────────────────

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_type = serializers.ChoiceField(choices=["email", "mobile"])


class SendMobileOTPSerializer(serializers.Serializer):
    """Triggers sending an OTP to the authenticated user's mobile number."""
    pass  # No extra fields — user comes from request


class VerifyMobileOTPSerializer(serializers.Serializer):
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only digits.")
        return value


# ─── Password Reset Serializers ───────────────────────────────────────────────

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=6, style={"input_type": "password"})
    confirm_password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(style={"input_type": "password"})
    new_password = serializers.CharField(min_length=6, style={"input_type": "password"})
    confirm_new_password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        return data
