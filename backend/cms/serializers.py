from rest_framework import serializers
from .models import Page, PageBlock


class PageBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PageBlock
        fields = ["id", "block_type", "order", "content", "is_visible"]


class PageSerializer(serializers.ModelSerializer):
    blocks = PageBlockSerializer(many=True, read_only=True)

    class Meta:
        model  = Page
        fields = ["id", "name", "slug", "slot", "is_builtin", "is_public", "blocks", "updated_at"]


class PageListSerializer(serializers.ModelSerializer):
    """Lightweight — no blocks, used for the admin page picker."""
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model  = Page
        fields = ["id", "name", "slug", "slot", "is_builtin", "is_public", "updated_at"]

    def validate(self, data):
        from django.utils.text import slugify
        # Auto-generate slug from name if not provided
        if not data.get("slug"):
            data["slug"] = slugify(data.get("name", ""))
        return data


class PageBlockWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PageBlock
        fields = ["id", "page", "block_type", "order", "content", "is_visible"]
