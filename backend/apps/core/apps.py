from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Shared building blocks: base models, error format, pagination, services."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    label = "core"
    verbose_name = "Core"
