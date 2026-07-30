"""Rebuild the schema-aware media usage index."""

from django.core.management.base import BaseCommand

from apps.media.services import reconcile_media_usage_references


class Command(BaseCommand):
    help = "Rebuild the persistent media usage index from content references."

    def handle(self, *args, **options):
        count = reconcile_media_usage_references()
        self.stdout.write(self.style.SUCCESS(f"Reconciled {count} media usage reference(s)."))
