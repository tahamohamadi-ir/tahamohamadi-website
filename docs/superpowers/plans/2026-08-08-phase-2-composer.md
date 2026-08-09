# Phase 2 Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the operational Composer, preview, Canvas, Draft recovery, and portable-template path without publishing sample content or loosening Django validation.

**Architecture:** Django remains authoritative for block schemas, active media, preview access, and template imports. Next.js renders the same typed blocks in public and local preview; the admin state layers undo/autosave on top of the existing controlled `ComposerCanvas`. Each new cross-layer feature is a narrow vertical slice with its own focused test evidence.

**Tech Stack:** Django 5/DRF/PostgreSQL, Next.js 15/React 19/TypeScript, Vitest, Docker Compose.

## Global Constraints

- Keep Django `BLOCK_SCHEMAS` authoritative; reject unknown settings/types and inactive or missing `MediaAsset` references with RFC 7807 Problem Details.
- Preserve independently editable `fa` and `en` fields with no locale fallback.
- Public output remains published-only and fails closed; never render raw HTML or add an unvalidated media URL path.
- Development samples are opt-in, idempotent, Draft-only, and registered through `MediaAsset`; no JSX public sample copy, URLs, or images.
- Do not add dependencies, paid AI calls, automatic publishing, migrations of legacy bilingual `hero`/`text`, or merge parked WIP branches.
- Run focused tests only. Record browser QA, visual snapshots, full suites, and production asset review in `docs/status/deferred-validation.md` when they are not needed to prove the slice.

---

## File structure

- `backend/apps/cms/services.py` — validates ordered compositions and extracts CMS media references.
- `backend/apps/cms/views.py` — applies active-media validation before an admin create/update persists.
- `backend/tests/test_cms_api.py` — verifies API Problem Details for active/inactive/missing media.
- `frontend/src/components/blocks/BlockRenderer.tsx` — separates CMS renderable types from article-only types.
- `frontend/src/components/blocks/BlockRenderer*.test.tsx` — proves that CMS rendering cannot dispatch article-only blocks and still renders every allowed Composer block.
- `backend/apps/core/management/commands/seed_composer_demo.py` — explicit development-only Draft fixture.
- `backend/apps/core/seed_assets/composer-demo-{hero,gallery}.svg` — development-only source files attached via `MediaAsset`, not frontend literals.
- `backend/tests/test_seed_composer_demo.py` and `scripts/seed/README.md` — fixture contract and operator instructions.
- `frontend/src/components/admin/composer/{ComposerCanvas,PreviewPanel,useCommandStack,useAutosave,useDirtyGuard}.ts` — local edit history, preview parity, and Draft recovery.
- `frontend/src/app/admin/(dashboard)/pages/[id]/page.tsx` — Draft-only autosave/recovery integration.
- `backend/apps/cms/{models,serializers,views,urls_admin}.py` — template persistence, dry-run validation, import audit, and restore endpoint.
- `backend/tests/test_cms_templates.py` and Composer Vitest files — focused server/client behavior.

## Task 1: Close the persisted-composition and public-renderer contract

**Files:**
- Modify: `backend/apps/cms/services.py`, `backend/apps/cms/views.py`
- Modify: `backend/tests/test_cms_api.py`, `backend/tests/test_cms_unit.py`
- Modify: `frontend/src/components/blocks/BlockRenderer.tsx`, `frontend/src/components/blocks/BlockRenderer.test.tsx`, `frontend/src/components/blocks/BlockRenderer.property.test.tsx`

**Interfaces:**
- Consumes: `validate_page_composition(page_data, known_media_ids=None) -> list[str]`, `MediaAsset.status`.
- Produces: admin create/update accepts only UUID references belonging to active media; `BlockRenderer(..., context="cms")` dispatches only the 16 registered CMS block types.

- [ ] **Step 1: Write failing backend API tests for media status**

```python
active = MediaAsset.objects.create(..., status="active")
payload["sections"][0]["blocks"][0]["settings"] = {"title": "Draft", "media_id": str(active.id)}
assert authed_client.post("/api/admin/pages/", payload, format="json").status_code == 201

archived = MediaAsset.objects.create(..., status="archived")
payload["sections"][0]["blocks"][0]["settings"]["media_id"] = str(archived.id)
response = authed_client.post("/api/admin/pages/", payload, format="json")
assert response.status_code == 400
assert response["Content-Type"].startswith("application/problem+json")
assert "media asset" in str(response.json()["errors"]).lower()
```

- [ ] **Step 2: Run the focused test and verify the archived reference currently persists**

Run: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_cms_api.py -q`

Expected: the new archived-media assertion fails before implementation.

- [ ] **Step 3: Pass the active ID set into validation on both write paths**

```python
from apps.media.models import MediaAsset

active_media_ids = {
    str(media_id)
    for media_id in MediaAsset.objects.filter(status="active").values_list("id", flat=True)
}
composition_errors = validate_page_composition(
    {"sections": sections_data}, known_media_ids=active_media_ids,
)
```

Use this identical call in `AdminPageViewSet.create` and `AdminPageViewSet.update`; retain existing Problem Details response construction.

- [ ] **Step 4: Restrict the CMS renderer registry and add a focused frontend test**

```tsx
const CMS_RENDERER_REGISTRY = {
  ...CMS_BLOCK_REGISTRY,
  ...ANIMATION_BLOCK_REGISTRY,
} satisfies Record<string, BlockComponent>;

const registry = context === "article" ? ARTICLE_BLOCK_REGISTRY : CMS_RENDERER_REGISTRY;
```

Test that `context="cms"` renders `scroll_reveal` but returns an empty container for `paragraph`; retain article rendering in `context="article"`.

- [ ] **Step 5: Run focused tests and commit**

Run: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_cms_api.py tests/test_cms_unit.py -q` and `npm.cmd run test:run -- --run src/components/blocks/BlockRenderer.test.tsx src/components/blocks/BlockRenderer.property.test.tsx`

Commit: `git commit -m "feat(cms): enforce active media composition"`

## Task 2: Add the explicit Draft-only Composer demo fixture

**Files:**
- Create: `backend/apps/core/management/commands/seed_composer_demo.py`, `backend/apps/core/seed_assets/composer-demo-hero.svg`, `backend/apps/core/seed_assets/composer-demo-gallery.svg`, `backend/tests/test_seed_composer_demo.py`, `scripts/seed/README.md`
- Modify: `docs/012-cms-v2-wordpress-capability-task-list.md`, `docs/status/deferred-validation.md`

**Interfaces:**
- Consumes: `settings.DEBUG`, `Page`, `Section`, `Block`, `MediaAsset`, `SiteProfile`, `SiteSettings`, `NavigationItem`, `CaseStudy`.
- Produces: `python manage.py seed_composer_demo` creates an idempotent set of Draft rows only when CMS/identity/site config/portfolio are empty.

- [ ] **Step 1: Write failing command tests**

```python
call_command("seed_composer_demo")
assert Page.objects.get(slug_en="composer-demo").status == "draft"
assert list(MediaAsset.objects.filter(original_filename__startswith="composer-demo-"))
assert not Page.objects.filter(status="published").exists()
with override_settings(DEBUG=False):
    with pytest.raises(CommandError, match="development"):
        call_command("seed_composer_demo")
```

Also assert a pre-existing `Page` raises `CommandError` and a second successful call does not create duplicates.

- [ ] **Step 2: Run the test and verify the command is absent**

Run: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_seed_composer_demo.py -q`

Expected: import/command-not-found failure.

- [ ] **Step 3: Implement the opt-in fixture**

```python
if not settings.DEBUG:
    raise CommandError("seed_composer_demo is available only in development.")
if any((Page.objects.exists(), SiteProfile.objects.exists(), SiteSettings.objects.exists(), CaseStudy.objects.exists())):
    raise CommandError("Refusing to seed non-empty development content.")
```

Load the two checked-in SVG files with `File(open(..., "rb"))`, create active `MediaAsset` rows with non-empty `alt_text_fa` and `alt_text_en`, then create a bilingual `composer-demo` Home page, one gallery-backed Draft case study, Draft profile/settings/navigation, and ordered valid blocks. Use neutral product-demo language only; do not add email, social links, factual CV claims, or a publish timestamp.

- [ ] **Step 4: Document operation and debt**

Write `scripts/seed/README.md` with exactly the development command, empty-database precondition, Draft-only guarantee, and warning never to run in production. Mark the corrected task-list items only after focused tests pass; add browser/SSR verification and human asset/content approval to the deferred ledger.

- [ ] **Step 5: Run focused tests and commit**

Run: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_seed_composer_demo.py tests/test_seed_data.py -q`

Commit: `git commit -m "feat(seed): add draft composer demo fixture"`

## Task 3: Make preview semantics use the public CMS boundary

**Files:**
- Modify: `frontend/src/components/admin/composer/PreviewPanel.tsx`, `frontend/src/components/admin/composer/PreviewPanel.test.tsx`, `frontend/src/components/admin/composer/project-settings.ts`
- Modify: `backend/apps/workflow/views.py`, `backend/tests/test_preview_tokens.py`, `docs/status/deferred-validation.md`

**Interfaces:**
- Consumes: `projectSettingsForLocale(blockType, settings, locale)`, `BlockRenderer`, public serializer locale projection.
- Produces: local preview projects only the selected locale, suppresses disabled sections, and fails closed for a type outside the CMS renderer registry.

- [ ] **Step 1: Add parity tests using the same hero/text fixture**

```tsx
render(<PreviewPanel sections={[fixture]} />)
expect(screen.getByRole("heading", { name: "عنوان نمونه" })).toBeInTheDocument()
await userEvent.click(screen.getByRole("radio", { name: /english/i }))
expect(screen.getByRole("heading", { name: "Example title" })).toBeInTheDocument()
expect(screen.queryByText("عنوان نمونه")).not.toBeInTheDocument()
```

Add one assertion that a `paragraph` block supplied to the CMS preview yields no article markup.

- [ ] **Step 2: Implement only the needed projection/registry adjustment**

Keep `projectSettingsForLocale` as the local mirror of legacy server projection for `hero` and `text`; pass `context="cms"` explicitly to `BlockRenderer` in the preview. Change the existing token-protected preview endpoint to serialize through `PublicPageSerializer`, with the token locale in serializer context, so it applies the same enabled/known/valid block filtering and media projection as the public endpoint. Do not add a second preview API.

- [ ] **Step 3: Verify and record deferred visual/token work**

Run: `npm.cmd run test:run -- --run src/components/admin/composer/PreviewPanel.test.tsx src/components/blocks/BlockRenderer.test.tsx` and `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_preview_tokens.py -q`

Record authenticated preview-token negative tests and visual screenshots as deferred only if the existing preview-token contract is not changed in this task.

- [ ] **Step 4: Commit**

Commit: `git commit -m "test(composer): lock preview projection parity"`

## Task 4: Complete essential Canvas keyboard operations and Draft recovery

**Files:**
- Modify: `frontend/src/components/admin/composer/{ComposerCanvas,SortableSection,SortableBlock,useCommandStack,useAutosave,useDirtyGuard}.ts` and their existing tests
- Modify: `frontend/src/app/admin/(dashboard)/pages/[id]/page.tsx` and its focused test
- Modify: `docs/status/deferred-validation.md`

**Interfaces:**
- Produces: the existing `useCommandStack`, `useAutosave`, and `useDirtyGuard` are safely integrated with the page editor; Draft-only autosave uses the existing PUT contract and page `version`.

- [ ] **Step 1: Add failing interaction tests**

```tsx
await user.keyboard("{Control>}z{/Control}")
expect(onChange).toHaveBeenLastCalledWith(originalSections)
await user.keyboard("{Control>}{Shift>}z{/Shift}")
expect(onChange).toHaveBeenLastCalledWith(mutatedSections)
```

Cover add, duplicate, delete confirmation, keyboard reorder, focus target, and `aria-live` announcement with the existing Canvas controls. Add an autosave test using fake timers that asserts Draft triggers one debounced PUT and `published` triggers none.

- [ ] **Step 2: Integrate and harden the existing history hook**

```ts
const commandStack = useCommandStack(sections)
const handleSectionsChange = (next: ComposerSection[]) => {
  commandStack.execute({ type: "replace-sections", payload: structuredClone(next) })
}
```

Use the existing Ctrl/Cmd-Z, Shift+Ctrl/Cmd-Z, and Ctrl/Cmd-Y behavior; add visible undo/redo controls. Reset history after a successful explicit save, and never call the server from undo/redo.

- [ ] **Step 3: Implement Draft-only autosave and conflict-safe failure display**

Wire the existing hook with a 750 ms debounce only when `page.status === "draft"`, include current `version`, clear the timer on unmount, and display existing formatted Problem Details. Harden its in-flight behavior so the latest edit is queued once, while a 409 or validation error keeps local editor state, stops retries, and never publishes.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm.cmd run test:run -- --run src/components/admin/composer/ComposerCanvas.test.tsx src/components/admin/composer/SortableSection.test.tsx src/components/admin/composer/SortableBlock.test.tsx src/app/admin/(dashboard)/pages/[id]/page.test.tsx`

Commit: `git commit -m "feat(composer): add draft recovery controls"`

## Task 5: Add portable Draft templates with dry-run import

**Files:**
- Create: `backend/apps/cms/migrations/000x_composer_template.py`, `backend/tests/test_cms_templates.py`, `frontend/src/components/admin/composer/template-store.ts`, `frontend/src/components/admin/composer/TemplatePanel.tsx`, `frontend/src/components/admin/composer/TemplatePanel.test.tsx`
- Modify: `backend/apps/cms/{models,serializers,views,urls_admin}.py`, `frontend/src/components/admin/composer/{index,ComposerCanvas}.tsx`, `docs/012-cms-v2-wordpress-capability-task-list.md`

**Interfaces:**
- Produces: `ComposerTemplate(manifest, status="draft")`; `POST /api/admin/pages/templates/import/` accepts `{manifest, dry_run}` and returns validation problems or a new Draft page/section composition only after `dry_run=false`.

- [ ] **Step 1: Add failing backend import tests**

```python
manifest = {"schema_version": 1, "sections": [{"ordering": 0, "layout": "default", "blocks": [{"block_type": "text", "ordering": 0, "settings": {"content": "", "alignment": "start"}}]}]}
dry = authed_client.post("/api/admin/pages/templates/import/", {"manifest": manifest, "dry_run": True}, format="json")
assert dry.status_code == 200 and dry.json()["valid"] is True
assert Page.objects.count() == 0
```

Add negative cases for unknown schema version, unknown block type, unsafe CTA URL, malformed media ID, and archived media.

- [ ] **Step 2: Add the model, serializer, and import endpoint**

The manifest fields are `schema_version`, `sections`, `block_types`, `media_references`, and `translation_completeness`. Validate `schema_version == 1`, derive block types/media references server-side from `sections`, call `validate_page_composition(..., known_media_ids=active_ids)`, and reject any caller-supplied derived mismatch. `dry_run=true` persists nothing. A real import creates a new `Page(status="draft")` and never mutates a live page.

- [ ] **Step 3: Add the minimal template panel**

The panel exports the current Canvas as a version-1 manifest, requests dry-run before showing the import confirmation button, and applies a successful import only as new Draft content. It must show server validation text, not raw JSON or UUID diagnostics.

- [ ] **Step 4: Run focused tests, update checklist, and commit**

Run: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_cms_templates.py -q` and `npm.cmd run test:run -- --run src/components/admin/composer/TemplatePanel.test.tsx`

Commit: `git commit -m "feat(cms): add draft composer templates"`

## Task 6: Evidence, final review, merge, and deferred validation

**Files:**
- Modify: `docs/012-cms-v2-wordpress-capability-task-list.md`, `docs/status/deferred-validation.md`

- [ ] **Step 1: Run only cross-slice focused verification**

Run: `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test tests/test_cms_api.py tests/test_cms_unit.py tests/test_seed_composer_demo.py tests/test_cms_templates.py -q` and `npm.cmd run test:run -- --run src/components/admin/composer src/components/blocks/BlockRenderer.test.tsx`

- [ ] **Step 2: Update task state and debt**

Mark a Release-2 line complete only when its focused command passed. Keep browser session/CSRF QA, touch/visual regression, full frontend/backend suites, human review of bilingual real content/assets, production template import, and production deployment as unchecked ledger debt.

- [ ] **Step 3: Review, merge, and push**

Run `git diff --check`, perform a scoped review of the Phase-2 branch, merge it to `main`, resolve only task-owned conflicts, re-run the focused verification after merge, and push `main`.
