# Task 2 report — Align save history and expose the stored template library

## Scope completed

- Draft autosave success now resets the local Composer command history before marking the page clean, matching manual Save. A clean Draft therefore cannot undo to a state from before the successful autosave.
- `TemplatePanel` reuses the existing `GET`/`POST /api/admin/pages/templates/` endpoint to load stored templates and save `createTemplateManifest(sections)` under an author-provided name.
- Selecting a stored template places its manifest into the existing input path, which invalidates a prior dry-run fingerprint and requires the established server dry-run then explicit confirmation. The existing import endpoint remains authoritative and import still requires a separately-created Draft response.
- Existing sanitized error behavior and stale dry-run fingerprint protections were retained.

## TDD evidence

RED command:

`npm.cmd run test:run -- --run "src/app/admin/(dashboard)/pages/[id]/page.test.tsx" src/components/admin/composer/TemplatePanel.test.tsx`

RED result: 3 failures out of 26 tests: the new stored-library list and save controls were absent, and Draft autosave did not reset undo history. The initial autosave-history assertion timed out because the history stayed undoable.

GREEN command:

`npm.cmd run test:run -- --run "src/app/admin/(dashboard)/pages/[id]/page.test.tsx" src/components/admin/composer/TemplatePanel.test.tsx`

GREEN result: 2 test files passed; 26 tests passed; 0 failures.

## Exact modified files

- `frontend/src/app/admin/(dashboard)/pages/[id]/page.tsx`
- `frontend/src/app/admin/(dashboard)/pages/[id]/page.test.tsx`
- `frontend/src/components/admin/composer/TemplatePanel.tsx`
- `frontend/src/components/admin/composer/TemplatePanel.test.tsx`
- `docs/012-cms-v2-wordpress-capability-task-list.md`

## Documentation claim

Updated T2.5 only after the UI and focused tests existed: the Composer UI now exposes the stored `ComposerTemplate` library, saves canonical current manifests, and routes selected templates through dry-run then confirmation import.

## Concerns

- Focused frontend tests are green. Browser/visual/full-suite validation remains deferred exactly as previously documented and was not modified by this task.
