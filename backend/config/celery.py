"""Celery application configuration.

Sets up the Celery app with Django integration and configures periodic tasks
via django-celery-beat. The broker defaults to Redis on localhost for local
development; production overrides via the CELERY_BROKER_URL environment
variable.
"""

from __future__ import annotations

import os

from celery import Celery

# Ensure Django settings are loaded before Celery configuration.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("tahamohamadi")

# Read Celery configuration from Django settings prefixed with CELERY_.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps (looks for tasks.py).
app.autodiscover_tasks()
