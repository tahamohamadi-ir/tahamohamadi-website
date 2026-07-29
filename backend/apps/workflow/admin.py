from django.contrib import admin

from apps.workflow.models import AuditEvent, Revision, ScheduledPublish


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("id", "content_type", "object_id", "from_status", "to_status", "user", "timestamp")
    list_filter = ("from_status", "to_status", "content_type")
    search_fields = ("object_id", "reason")
    readonly_fields = ("id", "content_type", "object_id", "from_status", "to_status", "user", "timestamp", "reason")


@admin.register(Revision)
class RevisionAdmin(admin.ModelAdmin):
    list_display = ("id", "content_type", "object_id", "label", "created_at", "created_by")
    list_filter = ("content_type",)
    search_fields = ("object_id", "label")
    readonly_fields = ("id", "content_type", "object_id", "snapshot", "label", "created_at", "created_by")


@admin.register(ScheduledPublish)
class ScheduledPublishAdmin(admin.ModelAdmin):
    list_display = ("id", "content_type", "object_id", "scheduled_at", "status", "attempts")
    list_filter = ("status",)
    search_fields = ("object_id",)
