# Task 6 review-fix report

## Review findings closed

- `errors.composition` now maps flat `sections[n].blocks[n]` Problem Details into selected-Inspector issues. UUIDs, unsafe URLs, and server diagnostic text are replaced with bounded client messages before rendering.
- Hero no longer exposes an editable Media UUID. Gallery no longer exposes comma-separated IDs. Both use the existing media picker, with a non-raw selected state and explicit clear/remove controls.
- Existing-page manual save now uses the autosave serializer. A pending debounce is cancelled, an in-flight autosave disables manual save, queued saves drain sequentially, and manual failure is reported without marking local state clean.
- The shared confirmed-discard guard clears the Draft recovery marker before Back, imported-template, navbar, logo, mobile-nav, or logout exits. Cancelled exits retain the marker; conflict Reload and successful save still clear it.
- Normal composition saves now reject raw HTML as well as template imports, making the catalog and task-list policy accurate. The task list and deferred ledger were narrowed to the remaining raw Filter JSON debt.

## RED to GREEN evidence

- RED frontend: 11 focused failures reproduced the missing composition parser, raw media controls, same-version overlap, and marker discard lifecycle.
- RED autosave follow-up: manual save returned no failure result, proving the editor could incorrectly clean state after a failed serialized save.
- GREEN frontend: `npm.cmd run test:run -- --run src/components/admin/composer/composer-validation.test.ts src/components/admin/composer/ComposerCanvas.test.tsx src/components/admin/composer/BlockInspector.test.tsx src/components/admin/composer/ConflictDialog.test.tsx src/components/admin/admin-navigation-guard.test.tsx "src/app/admin/(dashboard)/pages/[id]/page.test.tsx" src/hooks/useAutosave.test.ts src/hooks/useDirtyGuard.test.ts` — 8 files, 94 tests passed.
- GREEN backend: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_composition_validation.py -q` — 51 tests passed.
- `git diff --check` passed.
- `graphify update .` completed with 5593 nodes / 8063 edges; its existing extraction warning remains outside this fix commit.

## Boundaries

No dependency, migration, merge, push, browser QA, visual QA, production build, or full-suite action was performed. The pre-existing deleted `task-3b-report.md` working-tree change remains unstaged and untouched.
