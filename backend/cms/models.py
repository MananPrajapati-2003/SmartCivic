"""
CMS models.

Page        — a named page slot (built-in or custom).
PageBlock   — an ordered content block inside a page.
"""
from django.db import models
from django.utils.text import slugify


class Page(models.Model):
    """
    Represents a page that can hold CMS blocks.
    Built-in pages (sla, contact, about, navbar) have is_builtin=True.
    Super-admin can create custom pages too.
    """
    SLOT_CHOICES = [
        ("sla",     "SLA Page"),
        ("contact", "Contact Page"),
        ("about",   "About Page"),
        ("navbar",  "Navbar"),
        ("custom",  "Custom Page"),
    ]

    name        = models.CharField(max_length=120)
    slug        = models.SlugField(max_length=120, unique=True)
    slot        = models.CharField(max_length=20, choices=SLOT_CHOICES, default="custom")
    is_builtin  = models.BooleanField(default=False)
    is_public   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class PageBlock(models.Model):
    """
    A single content block inside a page.
    block_type determines how the frontend renders it.
    content is a JSON field holding type-specific data.
    """
    BLOCK_TYPES = [
        ("text",     "Text / Rich Text"),
        ("card",     "Card"),
        ("image",    "Image"),
        ("dropdown", "Accordion / Dropdown"),
        ("checkbox", "Checklist"),
        ("divider",  "Divider"),
        ("heading",  "Heading"),
        ("table",    "Table"),
    ]

    page        = models.ForeignKey(Page, on_delete=models.CASCADE, related_name="blocks")
    block_type  = models.CharField(max_length=20, choices=BLOCK_TYPES)
    order       = models.PositiveIntegerField(default=0)
    content     = models.JSONField(default=dict)  # type-specific payload
    is_visible  = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.page.name} — {self.block_type} #{self.order}"
