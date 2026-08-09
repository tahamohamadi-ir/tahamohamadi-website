# Phase 2 gap closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four functional gaps found by the fresh Phase 2 acceptance audit without expanding deferred browser or visual scope.

**Architecture:** The backend remains the single authority for composition validation and active-media references, returning the project Problem Details shape for malformed page composition. The existing page editor resets local history after any successful save, and `TemplatePanel` becomes a thin UI client of the existing validated `ComposerTemplate` list/create/import endpoints.

**Tech Stack:** Django 5/DRF/PostgreSQL, Next.js 15/React 19/TypeScript, Vitest, pytest via Docker Compose.

## Global Constraints

- Keep the existing typed relational CMS composition; do not introduce JSONB or a second template format.
- Media-bearing animation settings must resolve only active `MediaAsset` UUIDs; do not persist arbitrary media URLs.
- Invalid page composition must return `application/problem+json` with `errors.composition` on create and update.
- Autosave and manual save are both successful-save boundaries for local undo/redo history.
- Template import remains dry-run first, always creates a new Draft, and cannot overwrite a live page.
- Do not run browser E2E, visual snapshots, full suites, or production build in this fast-track slice; preserve their existing ledger entries.
- Use RED -> GREEN tests, stage only task-owned files, update the task list and deferred ledger only when their claims change.

---

### Task 1: Normalize composition errors and enforce active animation media

**Files:**
- Modify: `backend/apps/cms/views.py`
- Modify: `backend/apps/cms/services.py`
- Modify: `backend/apps/cms/block_registry.py`
- Modify: `backend/tests/test_cms_api.py`
- Modify: `backend/tests/test_cms_unit.py`

**Interfaces:**
- Consumes: `validate_page_composition(payload, known_media_ids)` and `build_problem(...)`.
- Produces: Page create/update errors in the existing `errors.composition` Problem Details shape; animation blocks use a registered active media UUID instead of arbitrary URL text.

- [x] **Step 1: Write focused failing API/unit tests**

  Add a create and update assertion for unknown block types/settings that expects status 400, `application/problem+json`, and `errors.composition`. Add an animation block fixture whose arbitrary `media_url` is rejected and whose active media UUID succeeds.

- [x] **Step 2: Run the new tests to verify RED**

  Run: `docker compose -f docker-compose.dev.yml --profile test run --rm -v "${PWD}\\backend:/app" backend-test tests/test_cms_api.py tests/test_cms_unit.py -q`

  Expected: failing assertions demonstrate DRF validation JSON or arbitrary animation URLs are accepted.

- [x] **Step 3: Implement the minimum server-authoritative path**

  Route nested serializer validation failures through the existing composition validation response before `serializer.is_valid(raise_exception=True)`. Change animation schemas/defaults/projection so media is supplied as `media_id`, is covered by `extract_media_ids`, and a public projection resolves the active asset URL only after validation. Preserve current canonical/legacy CTA safety validation.

- [x] **Step 4: Run the focused backend tests to verify GREEN**

  Run the same command from Step 2 and require all selected tests to pass.

- [x] **Step 5: Commit**

  Stage only the listed backend source and test files; commit as `fix(cms): enforce composition problem details and media policy`.

### Task 2: Align save history and expose the stored template library

**Files:**
- Modify: `frontend/src/app/admin/(dashboard)/pages/[id]/page.tsx`
- Modify: `frontend/src/app/admin/(dashboard)/pages/[id]/page.test.tsx`
- Modify: `frontend/src/components/admin/composer/TemplatePanel.tsx`
- Modify: `frontend/src/components/admin/composer/TemplatePanel.test.tsx`
- Modify: `docs/012-cms-v2-wordpress-capability-task-list.md`
- Modify: `docs/status/deferred-validation.md` only if a precise new browser/visual limitation is introduced

**Interfaces:**
- Consumes: `useAutosave({ onSuccess })`, `useCommandStack(...).reset`, `adminFetch`, `/api/admin/pages/templates/`, and `/api/admin/pages/templates/import/`.
- Produces: successful autosaves reset history exactly like manual saves; authors can save current composition as a named template, list stored templates, and import a selected manifest through the existing dry-run confirmation flow.

- [x] **Step 1: Write focused failing frontend tests**

  Add a page-editor test that performs a Draft autosave then verifies Undo is disabled. Add TemplatePanel tests for loading stored templates, creating a named template from the current section manifest, and selecting a stored template before normal dry-run/import confirmation.

- [x] **Step 2: Run the selected tests to verify RED**

  Run: `npm.cmd run test:run -- --run "src/app/admin/(dashboard)/pages/[id]/page.test.tsx" src/components/admin/composer/TemplatePanel.test.tsx`

  Expected: history remains undoable after autosave and no template-library controls/API calls exist.

- [x] **Step 3: Implement the minimum editor integration**

  Call `reset()` only after the current autosave succeeds. In `TemplatePanel`, load stored templates once, create a template from `createTemplateManifest(sections)` with an explicit name, and copy a selected stored manifest into the existing import workflow. Retain fingerprint protection and sanitized errors; do not add new endpoints or duplicate validation.

- [x] **Step 4: Run the selected tests to verify GREEN**

  Run the same command from Step 2 and require all selected tests to pass.

- [x] **Step 5: Update the acceptance record and commit**

  Mark the T2.5 library acceptance item as completed only after UI and test evidence exist. Stage only the listed task-owned files and commit as `fix(composer): complete template library and autosave history`.

## Plan self-review

- Spec coverage: Task 1 closes both T2.1 API/media gaps; Task 2 closes T2.4 history and T2.5 UI-library gaps.
- Deferred scope: browser/visual/full build remain explicitly excluded and already owned by the debt ledger.
- Type consistency: all integrations reuse current endpoint payloads, `TemplateManifest`, `ComposerSection`, `onSuccess`, and `reset` contracts.
