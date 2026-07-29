"""Admin API URL patterns for workflow module.

Mounted at /api/admin/workflow/ via config/api_urls.py.

Endpoints:
    POST   transition/              — Execute a state transition
    GET    revisions/               — List revisions for an entity
    GET    revisions/compare/       — Compare two revisions
    POST   revisions/restore/       — Restore a revision as new draft
    GET    scheduled/               — List scheduled publish jobs
    DELETE scheduled/{id}/          — Cancel a pending scheduled publish
    POST   schedule/                — Create a scheduled publish
    POST   schedule/cancel/         — Cancel a pending scheduled publish (legacy)
    GET    audit-events/            — List audit events for an entity

Requirements: 1.3, 8.1, 8.4, 8.5, 8.6
"""

from django.urls import path

from apps.workflow.views import (
    AuditEventListView,
    PreviewTokenGenerateView,
    PreviewTokenRevokeView,
    RevisionCompareView,
    RevisionListView,
    RevisionRestoreView,
    ScheduleCancelView,
    ScheduleCreateView,
    ScheduledDeleteView,
    ScheduledListView,
    TransitionView,
    TranslationStatusView,
)

app_name = "workflow-admin"

urlpatterns = [
    path("transition/", TransitionView.as_view(), name="transition"),
    path("revisions/", RevisionListView.as_view(), name="revision-list"),
    path("revisions/compare/", RevisionCompareView.as_view(), name="revision-compare"),
    path("revisions/restore/", RevisionRestoreView.as_view(), name="revision-restore"),
    path("scheduled/", ScheduledListView.as_view(), name="scheduled-list"),
    path("scheduled/<uuid:pk>/", ScheduledDeleteView.as_view(), name="scheduled-delete"),
    path("schedule/", ScheduleCreateView.as_view(), name="schedule-create"),
    path("schedule/cancel/", ScheduleCancelView.as_view(), name="schedule-cancel"),
    path("audit-events/", AuditEventListView.as_view(), name="audit-event-list"),
    path("preview-token/", PreviewTokenGenerateView.as_view(), name="preview-token-generate"),
    path("preview-token/revoke/", PreviewTokenRevokeView.as_view(), name="preview-token-revoke"),
    path("translation-status/", TranslationStatusView.as_view(), name="translation-status"),
]
