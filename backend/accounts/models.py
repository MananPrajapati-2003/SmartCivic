from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import secrets
from datetime import timedelta
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for SmartCivic with 5 roles and verification flags.
    """

    ROLE_CITIZEN = "citizen"
    ROLE_AUTHORITY = "authority"
    ROLE_NGO_CSR = "ngo_csr"
    ROLE_ORG_ADMIN = "org_admin"
    ROLE_SUPER_ADMIN = "super_admin"

    ROLE_CHOICES = [
        (ROLE_CITIZEN, "Citizen"),
        (ROLE_AUTHORITY, "Authority"),
        (ROLE_NGO_CSR, "NGO / CSR"),
        (ROLE_ORG_ADMIN, "Organization Admin"),
        (ROLE_SUPER_ADMIN, "Super Admin"),
    ]

    # ── Core fields ──────────────────────────────────────────────────────────
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    mobile_number = models.CharField(max_length=10, blank=True, default="")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CITIZEN, db_index=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)

    # ── Verification flags ────────────────────────────────────────────────────
    is_email_verified = models.BooleanField(default=False)
    is_mobile_verified = models.BooleanField(default=False)

    # ── Gamification ──────────────────────────────────────────────────────────
    civic_score = models.IntegerField(default=0)

    # ── Django required fields ────────────────────────────────────────────────
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.full_name.split()[0] if self.full_name else self.email

    @property
    def is_fully_verified(self):
        """True when both email and mobile (if provided) are verified."""
        if self.mobile_number:
            return self.is_email_verified and self.is_mobile_verified
        return self.is_email_verified

    @property
    def is_citizen(self):
        return self.role == self.ROLE_CITIZEN

    @property
    def is_authority_user(self):
        return self.role == self.ROLE_AUTHORITY

    @property
    def is_ngo_csr(self):
        return self.role == self.ROLE_NGO_CSR

    @property
    def is_org_admin(self):
        return self.role == self.ROLE_ORG_ADMIN

    @property
    def is_super_admin(self):
        return self.role == self.ROLE_SUPER_ADMIN


class NGOProfile(models.Model):
    """
    Extended profile for NGO/CSR users.
    Created at registration; requires admin approval before user can login.
    """

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Review"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="ngo_profile")
    org_name = models.CharField(max_length=200)
    description = models.TextField(max_length=1000)
    website = models.URLField(blank=True, default="")        # Optional
    address = models.CharField(max_length=300)
    team_size = models.PositiveIntegerField(default=1)
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    rejection_reason = models.TextField(blank=True, default="")
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="ngo_reviews"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ngo_profiles"
        verbose_name = "NGO Profile"
        verbose_name_plural = "NGO Profiles"
        ordering = ["-registered_at"]

    def __str__(self):
        return f"{self.org_name} ({self.approval_status})"


class OTPVerification(models.Model):
    """
    Stores time-limited OTPs for email verification, mobile verification
    and password reset workflows.
    """

    TYPE_EMAIL = "email"
    TYPE_MOBILE = "mobile"
    TYPE_PASSWORD_RESET = "password_reset"

    OTP_TYPE_CHOICES = [
        (TYPE_EMAIL, "Email Verification"),
        (TYPE_MOBILE, "Mobile Verification"),
        (TYPE_PASSWORD_RESET, "Password Reset"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otps")
    otp = models.CharField(max_length=6)
    otp_type = models.CharField(max_length=20, choices=OTP_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "otp_verifications"
        ordering = ["-created_at"]
        verbose_name = "OTP Verification"
        verbose_name_plural = "OTP Verifications"

    def __str__(self):
        return f"{self.user.email} – {self.otp_type} – {'used' if self.is_used else 'active'}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @classmethod
    def generate_otp(cls, user, otp_type, expiry_minutes=10):
        """
        Invalidates any existing unused OTPs of the same type for this user,
        then generates and persists a fresh 6-digit OTP.
        """
        # Invalidate old OTPs of the same type
        cls.objects.filter(user=user, otp_type=otp_type, is_used=False).update(is_used=True)

        otp_value = str(secrets.randbelow(900000) + 100000)  # 100000–999999
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)

        return cls.objects.create(
            user=user,
            otp=otp_value,
            otp_type=otp_type,
            expires_at=expires_at,
        )

