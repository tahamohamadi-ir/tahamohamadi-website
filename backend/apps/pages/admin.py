"""Django Admin for Page Builder."""

from django.contrib import admin

from apps.pages.models import BuilderPage, BuilderPageDraft, BuilderPageVersion


@admin.register(BuilderPage)
class BuilderPageAdmin(admin.ModelAdmin):
    list_display = ["slug", "title", "locale", "status", "published_at"]
    list_filter = ["status", "locale"]
    search_fields = ["slug", "title"]


@admin.register(BuilderPageDraft)
class BuilderPageDraftAdmin(admin.ModelAdmin):
    list_display = ["page", "revision", "updated_at"]
    search_fields = ["page__slug", "page__title"]


@admin.register(BuilderPageVersion)
class BuilderPageVersionAdmin(admin.ModelAdmin):
    list_display = ["page", "version_number", "created_by", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["page__slug", "page__title"]
