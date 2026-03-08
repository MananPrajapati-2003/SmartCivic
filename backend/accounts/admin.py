from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "email",
        "full_name",
        "role",
        "mobile_number",
        "civic_score",
        "is_active",
        "date_joined",
        "avatar_preview",
    ]
    list_filter = ["role", "is_active", "is_staff", "date_joined"]
    search_fields = ["email", "full_name", "mobile_number"]
    ordering = ["-date_joined"]
    readonly_fields = ["date_joined", "last_login", "avatar_preview"]

    fieldsets = (
        ("Login Credentials", {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name", "mobile_number", "profile_image", "avatar_preview")}),
        ("Role & Gamification", {"fields": ("role", "civic_score")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("date_joined", "last_login")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "password1", "password2", "role", "is_staff"),
            },
        ),
    )

    def avatar_preview(self, obj):
        if obj.profile_image:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius:50%;object-fit:cover;" />',
                obj.profile_image.url,
            )
        return "No image"

    avatar_preview.short_description = "Avatar"
