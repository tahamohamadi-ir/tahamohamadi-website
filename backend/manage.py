#!/usr/bin/env python
"""Django management entrypoint.

Defaults to the development settings; override with DJANGO_SETTINGS_MODULE
(for example `config.settings.prod`) when running against a deployed target.
"""

import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:  # pragma: no cover - environment problem, not logic
        raise ImportError(
            "Couldn't import Django. Activate the virtualenv at backend/.venv and "
            "install requirements/dev.txt."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
