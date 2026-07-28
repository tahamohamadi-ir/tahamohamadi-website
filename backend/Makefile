# Backend development commands

.PHONY: lint format check test

# Run linter (report only)
lint:
	ruff check .

# Auto-fix linting issues
lint-fix:
	ruff check --fix .

# Format code
format:
	ruff format .

# Check formatting without modifying files
format-check:
	ruff format --check .

# Run all checks (lint + format check)
check: lint format-check

# Run tests
test:
	pytest

# Run tests with coverage
test-cov:
	pytest --cov=apps --cov-report=term-missing
