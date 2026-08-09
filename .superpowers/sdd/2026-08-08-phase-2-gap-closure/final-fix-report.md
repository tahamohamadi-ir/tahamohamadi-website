# Final review fix report

## Scope and implementation

- `image_reveal.media_id` is now optional and nullable for a newly inserted Draft block. When supplied, it remains schema-constrained to a UUID and the existing composition validation still accepts only active `MediaAsset` IDs.
- PreviewPanel retrieves selected Parallax and Image Reveal assets through the existing authenticated Media Library detail endpoint. It passes the resulting active asset URL to the renderer only in local derived preview settings; composition settings retain their `media_id` and never store a URL.
- Raw `media_url` remains an unsupported persisted setting.

## RED

Frontend command:

```text
npm.cmd run test:run -- --run src/components/admin/composer/PreviewPanel.test.tsx src/components/admin/composer/block-defaults.test.ts
```

Result: 1 failed, 14 passed (15 total). The local preview did not render the Image Reveal asset selected by `media_id`.

Backend command:

```text
docker compose -f docker-compose.dev.yml --profile test run --rm -v "${PWD}\\backend:/app" backend-test tests/test_cms_api.py -q -k "unselected_image_reveal_default"
```

Result: 1 failed. A page containing the inserted `image_reveal` default (`media_id: null`) returned HTTP 400 instead of 201.

## GREEN

Focused frontend command:

```text
npm.cmd run test:run -- --run src/components/admin/composer/PreviewPanel.test.tsx src/components/admin/composer/block-defaults.test.ts src/components/blocks/animation/AnimationBlocks.test.tsx
```

Result: 24 passed in 2.01s.

Focused backend command:

```text
docker compose -f docker-compose.dev.yml --profile test run --rm -v "${PWD}\\backend:/app" backend-test tests/test_cms_api.py tests/test_cms_unit.py -q
```

Result: 73 passed in 10.12s.

## Modified files

- `backend/apps/cms/block_registry.py`
- `backend/tests/test_cms_api.py`
- `backend/tests/test_cms_unit.py`
- `frontend/src/components/admin/composer/PreviewPanel.tsx`
- `frontend/src/components/admin/composer/PreviewPanel.test.tsx`
- `.superpowers/sdd/2026-08-08-phase-2-gap-closure/final-fix-report.md`

## Concerns

None. Docker Compose emitted an existing orphan-container warning that did not affect verification.
