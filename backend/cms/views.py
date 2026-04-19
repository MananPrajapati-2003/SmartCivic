"""
CMS API views.

Public:
  GET  /api/cms/pages/           — list all public pages (slug, name, slot)
  GET  /api/cms/pages/<slug>/    — full page with blocks (public pages only)

Super-admin only:
  POST   /api/cms/pages/                    — create page
  PATCH  /api/cms/pages/<slug>/             — update page meta
  DELETE /api/cms/pages/<slug>/             — delete custom page

  POST   /api/cms/blocks/                   — add block to a page
  PATCH  /api/cms/blocks/<id>/              — update block content/order
  DELETE /api/cms/blocks/<id>/              — remove block
  POST   /api/cms/blocks/reorder/           — bulk reorder blocks on a page
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from accounts.models import User
from .models import Page, PageBlock
from .serializers import (
    PageSerializer, PageListSerializer,
    PageBlockSerializer, PageBlockWriteSerializer,
)


def _is_super_admin(user):
    return user.is_authenticated and (
        user.role == User.ROLE_SUPER_ADMIN or user.is_staff
    )


# ── Public page views ─────────────────────────────────────────────────────────

class PageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Page.objects.filter(is_public=True)
        return Response(PageListSerializer(qs, many=True).data)

    def post(self, request):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        ser = PageListSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        page = ser.save()
        return Response(PageSerializer(page).data, status=201)


class PageDetailView(APIView):
    permission_classes = [AllowAny]

    def _get_page(self, slug):
        try:
            return Page.objects.prefetch_related("blocks").get(slug=slug)
        except Page.DoesNotExist:
            return None

    def get(self, request, slug):
        page = self._get_page(slug)
        if not page:
            return Response({"detail": "Not found."}, status=404)
        if not page.is_public and not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        return Response(PageSerializer(page).data)

    def patch(self, request, slug):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        page = self._get_page(slug)
        if not page:
            return Response({"detail": "Not found."}, status=404)
        ser = PageListSerializer(page, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(PageSerializer(page).data)

    def delete(self, request, slug):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        page = self._get_page(slug)
        if not page:
            return Response({"detail": "Not found."}, status=404)
        if page.is_builtin:
            return Response({"detail": "Built-in pages cannot be deleted."}, status=400)
        page.delete()
        return Response(status=204)


# ── Block views ───────────────────────────────────────────────────────────────

class BlockListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        ser = PageBlockWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        block = ser.save()
        return Response(PageBlockSerializer(block).data, status=201)


class BlockDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return PageBlock.objects.get(pk=pk)
        except PageBlock.DoesNotExist:
            return None

    def patch(self, request, pk):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        block = self._get(pk)
        if not block:
            return Response({"detail": "Not found."}, status=404)
        ser = PageBlockWriteSerializer(block, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(PageBlockSerializer(block).data)

    def delete(self, request, pk):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        block = self._get(pk)
        if not block:
            return Response({"detail": "Not found."}, status=404)
        block.delete()
        return Response(status=204)


class BlockReorderView(APIView):
    """
    POST body: { "page_id": 1, "order": [blockId, blockId, ...] }
    Sets the `order` field of each block to its list position.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_super_admin(request.user):
            return Response({"detail": "Forbidden."}, status=403)
        ids = request.data.get("order", [])
        for idx, bid in enumerate(ids):
            PageBlock.objects.filter(pk=bid).update(order=idx)
        return Response({"detail": "Reordered."})
