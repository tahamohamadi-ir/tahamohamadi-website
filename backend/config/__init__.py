"""Django project configuration package.

Exports the Celery app so that it is loaded automatically when Django starts,
enabling the `@shared_task` decorator and beat schedule discovery.
"""

from .celery import app as celery_app

__all__ = ("celery_app",)
