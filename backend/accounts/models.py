from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for SmartCivic.
    Uses email as the unique login identifier.
    Supports 5 roles: citizen, authority, ngo_csr, org_admin, super_admin.
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
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_CITIZEN,
        db_index=True,
    )
    profile_image = models.ImageField(
        upload_to="profiles/",
        blank=True,
        null=True,
    )

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
    def is_citizen(self):
        return self.role == self.ROLE_CITIZEN

    @property
    def is_authority(self):
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
