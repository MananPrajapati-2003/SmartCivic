from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer for returning user data in responses."""

    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "mobile_number",
            "role",
            "civic_score",
            "profile_image",
            "profile_image_url",
            "date_joined",
        ]
        read_only_fields = fields

    def get_profile_image_url(self, obj):
        request = self.context.get("request")
        if obj.profile_image:
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for citizen self-registration."""

    password = serializers.CharField(
        write_only=True,
        min_length=6,
        style={"input_type": "password"},
        error_messages={"min_length": "Password must be at least 6 characters."},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "email",
            "full_name",
            "mobile_number",
            "password",
            "confirm_password",
            "profile_image",
        ]
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
        # Citizens always get citizen role on self-registration
        validated_data["role"] = User.ROLE_CITIZEN
        user = User.objects.create_user(**validated_data)
        if profile_image:
            user.profile_image = profile_image
            user.save(update_fields=["profile_image"])
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for email + password login."""

    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        email = data.get("email", "").lower()
        password = data.get("password", "")
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password. Please try again."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Your account has been deactivated. Contact support."}
            )
        data["user"] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing own password."""

    old_password = serializers.CharField(style={"input_type": "password"})
    new_password = serializers.CharField(
        min_length=6,
        style={"input_type": "password"},
        error_messages={"min_length": "New password must be at least 6 characters."},
    )
    confirm_new_password = serializers.CharField(style={"input_type": "password"})

    def validate(self, data):
        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        return data
