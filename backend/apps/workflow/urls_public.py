"""Public API URL patterns for workflow module.

The workflow module exposes a single public endpoint for preview token
validation — allowing token-holders to view draft/scheduled content.

Requirement 8.7: Preview tokens allow viewing unpublished content.
Requirement 12.7: Preview responses include X-Robots-Tag: noindex and
    Cache-Control: no-store.
"""

from django.urls import path

from apps.workflow.views import PreviewContentView

app_name = "workflow-public"

urlpatterns: list = [
    path("preview/", PreviewContentView.as_view(), name="preview-content"),
]
