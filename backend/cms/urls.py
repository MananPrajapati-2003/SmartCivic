from django.urls import path
from .views import PageListView, PageDetailView, BlockListView, BlockDetailView, BlockReorderView

urlpatterns = [
    path("pages/",                PageListView.as_view(),    name="cms-pages"),
    path("pages/<slug:slug>/",    PageDetailView.as_view(),  name="cms-page-detail"),
    path("blocks/",               BlockListView.as_view(),   name="cms-blocks"),
    path("blocks/reorder/",       BlockReorderView.as_view(),name="cms-blocks-reorder"),
    path("blocks/<int:pk>/",      BlockDetailView.as_view(), name="cms-block-detail"),
]
