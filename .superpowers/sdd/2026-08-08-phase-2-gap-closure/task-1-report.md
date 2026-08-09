# Task 1 report — Normalize composition errors and enforce active animation media

## Implementation

- Page create and update now run composition validation before nested DRF serializer validation. Unknown block types and invalid block settings therefore return HTTP 400 `application/problem+json` with `errors.composition`.
- The `parallax` and `image_reveal` schemas now persist `media_id` UUIDs instead of `media_url` strings. Existing composition validation checks those IDs against the active `MediaAsset` set, while public serialization continues to resolve validated IDs to public URLs.
- Canonical and legacy CTA URL validation remains unchanged; animation `media_url` is no longer a persisted input field.

## RED

Command:

```text
docker compose -f docker-compose.dev.yml --profile test run --rm -v "${PWD}\\backend:/app" backend-test tests/test_cms_api.py tests/test_cms_unit.py -q -k "unknown_block_type_returns_composition_problem or invalid_settings_returns_composition_problem or animation_media"
```

Result: 6 selected; 5 failed, 1 passed.

- Create/update unknown block types and invalid settings returned 422 instead of the required 400 composition Problem Details response.
- An `image_reveal` block accepted arbitrary `media_url` input without errors.

## GREEN

Focused command (same as RED): 6 passed, 66 deselected in 2.29s.

Required verification command:

```text
docker compose -f docker-compose.dev.yml --profile test run --rm -v "${PWD}\\backend:/app" backend-test tests/test_cms_api.py tests/test_cms_unit.py -q
```

Result: 72 passed in 9.02s.

## Modified files

- `backend/apps/cms/views.py`
- `backend/apps/cms/services.py`
- `backend/apps/cms/block_registry.py`
- `backend/tests/test_cms_api.py`
- `backend/tests/test_cms_unit.py`
- `.superpowers/sdd/2026-08-08-phase-2-gap-closure/task-1-report.md`

## Concerns

None for the requested scope. Docker Compose emitted an existing orphan-container warning, which did not affect the test result.
