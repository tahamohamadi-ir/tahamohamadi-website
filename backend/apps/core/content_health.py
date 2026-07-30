"""Real, actionable checks used by the Admin content-health dashboard."""

from __future__ import annotations

from django.db.models import Q


ITEM_LIMIT = 100


def _section(items: list[dict]) -> dict:
    return {"count": len(items), "items": items[:ITEM_LIMIT], "truncated": len(items) > ITEM_LIMIT}


def _translation_issues() -> list[dict]:
    from apps.blog.models import Article
    from apps.cms.models import Page
    from apps.portfolio.models import CaseStudy
    from apps.workflow.services import compute_translation_status

    models = [
        (Page, "/admin/pages"),
        (Article, "/admin/blog"),
        (CaseStudy, "/admin/portfolio"),
    ]
    issues = []
    for model, action_base in models:
        for entity in model.objects.all():
            statuses = {locale: compute_translation_status(entity, locale) for locale in ("fa", "en")}
            incomplete_locales = [locale for locale, value in statuses.items() if value != "complete"]
            if incomplete_locales:
                issues.append(
                    {
                        "title": entity.title_fa or entity.title_en,
                        "locales": incomplete_locales,
                        "statuses": statuses,
                        "action_path": f"{action_base}/{entity.pk}",
                    }
                )
    return issues


def content_health_report() -> dict:
    """Return only findings that can be traced to live stored data."""

    from apps.media.models import MediaAsset
    from apps.media.services import get_orphan_media_ids
    from apps.workflow.models import ScheduledPublish

    missing_alt = []
    image_assets = MediaAsset.objects.filter(status="active", mime_type__startswith="image/").filter(
        Q(alt_text_fa="") | Q(alt_text_en="")
    ).order_by("original_filename")
    for asset in image_assets:
        missing_alt.append(
            {
                "title": asset.original_filename,
                "missing_locales": [
                    locale
                    for locale, value in (("fa", asset.alt_text_fa), ("en", asset.alt_text_en))
                    if not value.strip()
                ],
                "action_path": "/admin/media",
            }
        )

    orphan_media = []
    orphan_ids = get_orphan_media_ids()
    for asset in MediaAsset.objects.filter(id__in=orphan_ids).order_by("original_filename"):
        orphan_media.append({"title": asset.original_filename, "action_path": "/admin/media"})

    failed_schedules = []
    for schedule in ScheduledPublish.objects.filter(status="failed").select_related("content_type"):
        failed_schedules.append(
            {
                "content_type": f"{schedule.content_type.app_label}.{schedule.content_type.model}",
                "action_path": "/admin/workflow",
            }
        )

    return {
        "translation_issues": _section(_translation_issues()),
        "missing_media_alt": _section(missing_alt),
        "orphan_media": _section(orphan_media),
        "failed_schedules": _section(failed_schedules),
    }
