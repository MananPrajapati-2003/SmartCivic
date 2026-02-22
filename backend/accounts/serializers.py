from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, NGOProfile
import re


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer — returned in all auth responses."""

    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "mobile_number", "role",
            "civic_score", "profile_image", "profile_image_url",
            "is_email_verified", "is_mobile_verified", "date_joined", "is_staff",
        ]
        read_only_fields = fields

    def get_profile_image_url(self, obj):
        request = self.context.get("request")
        if obj.profile_image:
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url
        return None


# ─── Registration Serializers ─────────────────────────────────────────────────

def _validate_mobile(value):
    """Shared mobile validator."""
    if value:
        if not value.isdigit():
            raise serializers.ValidationError("Mobile number must contain only digits.")
        if len(value) != 10:
            raise serializers.ValidationError("Mobile number must be exactly 10 digits.")
    return value


class CitizenRegisterSerializer(serializers.ModelSerializer):
    """Citizen self-registration serializer."""

    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"},
                                     error_messages={"min_length": "Password must be at least 8 characters."})
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

    def validate_full_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return value.strip()

    def validate_mobile_number(self, value):
        return _validate_mobile(value)

    def validate_password(self, value):
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
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


class NGORegisterSerializer(serializers.Serializer):
    """NGO/CSR Team registration. Creates an inactive user pending admin approval."""

    # Contact person details
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    mobile_number = serializers.CharField(max_length=10, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"},
                                     error_messages={"min_length": "Password must be at least 8 characters."})
    confirm_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    # NGO/CSR Organisation details
    org_name = serializers.CharField(max_length=200)
    description = serializers.CharField(max_length=1000)
    website = serializers.URLField(required=False, allow_blank=True, default="")   # Optional
    address = serializers.CharField(max_length=300)
    team_size = serializers.IntegerField(min_value=1, max_value=100000)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_full_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Contact name must be at least 2 characters.")
        return value.strip()

    def validate_mobile_number(self, value):
        return _validate_mobile(value)

    def validate_password(self, value):
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        return value

    def validate_org_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Organisation name must be at least 2 characters.")
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Please describe your organisation in at least 20 characters.")
        return value.strip()

    def validate_address(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Please enter a valid address.")
        return value.strip()

    def validate(self, data):
        if data["password"] != data.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        ngo_fields = ["org_name", "description", "website", "address", "team_size"]
        ngo_data = {k: validated_data.pop(k) for k in ngo_fields}

        user = User.objects.create_user(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            mobile_number=validated_data.get("mobile_number", ""),
            password=validated_data["password"],
            role=User.ROLE_NGO_CSR,
            is_active=False,            # Inactive until admin approves
            is_email_verified=False,
            is_mobile_verified=False,
        )
        NGOProfile.objects.create(user=user, **ngo_data)
        return user


# ─── Login ────────────────────────────────────────────────────────────────────

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
            # Provide specific message for NGO pending
            if hasattr(user, "ngo_profile") and user.ngo_profile.approval_status == NGOProfile.STATUS_PENDING:
                raise serializers.ValidationError({"detail": "Your NGO registration is pending admin review. You will receive an email once approved."})
            if hasattr(user, "ngo_profile") and user.ngo_profile.approval_status == NGOProfile.STATUS_REJECTED:
                raise serializers.ValidationError({"detail": "Your NGO registration was rejected. Please contact support."})
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
    new_password = serializers.CharField(min_length=8, style={"input_type": "password"},
                                          error_messages={"min_length": "Password must be at least 8 characters."})
    confirm_password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(style={"input_type": "password"})
    new_password = serializers.CharField(min_length=8, style={"input_type": "password"},
                                          error_messages={"min_length": "Password must be at least 8 characters."})
    confirm_new_password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        return data


# ─── Admin Account Creation Serializers ──────────────────────────────────────

class AdminCreateUserSerializer(serializers.Serializer):
    """Used by admins to create authority/admin accounts."""
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    mobile_number = serializers.CharField(max_length=10, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_full_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return value.strip()

    def validate_mobile_number(self, value):
        return _validate_mobile(value)
