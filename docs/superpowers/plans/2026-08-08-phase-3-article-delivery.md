# Phase 3 Article delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Phase 3 article authoring and public Blog delivery operational on the existing Django/Next contracts, without adding unsupported rich-content capabilities.

**Architecture:** Article documents stay in the existing typed `ArticleBlock` relation. A single document-v1 allowlist, validation and projection contract governs backend persistence, editor conversion, preview and public rendering. The public Blog detail DTO is aligned with the established backend published-only projection rather than inventing a category or previous/next relationship.

**Tech Stack:** Django/DRF/PostgreSQL, Next.js/React/TypeScript, Tiptap, Vitest, pytest via Docker Compose.

## Global Constraints

- Preserve independent `fa` and `en` content; never silently fall back across locales.
- Persist article media only as active Media Library UUID references; resolve URLs/alt/caption only in projections.
- Accept only a versioned allowlist: paragraph, heading, ordered/unordered list, image, gallery, quote, code, divider, callout, reference/link.
- Reject raw HTML, JavaScript, unsafe URLs, unsupported embeds and unknown blocks before storage and before public projection.
- Markdown import/export must report unsupported nodes; no silent loss.
- Related articles remain Topic-derived; do not invent category or previous/next APIs without a domain rule.
- Do not run browser E2E, visual snapshots, full suite, or production build in this fast-track slice; register those checks in the deferred ledger.

---

### Task 1: Article document-v1 and public Blog detail contract

**Files:**
- Modify: `backend/apps/blog/services.py`
- Modify: `backend/apps/blog/serializers.py`
- Modify: `backend/apps/blog/views.py`
- Modify: focused `backend/tests/test_blog_*` files
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/app/[locale]/blog/[slug]/page.tsx`
- Modify: focused public Blog tests

**Interfaces:**
- Consumes: existing `Article`, `ArticleBlock`, active media queryset, current `PublicArticleDetailView` and `PublicApiError`.
- Produces: document-v1 allowlist and validation errors; localized public detail DTO with only server-supported reading time/related fields and `updated_at`; `getArticle` returns null only for 404.

- [ ] **Step 1: Write failing focused tests**

  Add backend tests rejecting unknown blocks, raw HTML, unsafe reference URLs, unsupported code languages and inactive/missing image/gallery media; add a public-detail test asserting localized reading time, Topic-derived related items and updated timestamp. Add frontend DTO/render tests that use those exact field names and verify non-404 errors remain visible.

- [ ] **Step 2: Run RED tests**

  Run targeted blog pytest through Compose and the selected public Blog Vitest tests. Expected: generic sanitization admits unsupported content and detail DTO fields disagree.

- [ ] **Step 3: Implement minimal canonical contracts**

  Make validation fail closed for the document-v1 catalog and bounded code languages; validate active UUID references and localized text metadata. Project only validated public blocks with resolved media objects. Align frontend types/page rendering to backend field names; remove unsupported previous/next assumptions and keep Topic-based related items only. Limit `getArticle` null mapping to 404.

- [ ] **Step 4: Run GREEN tests and commit**

  Re-run only selected backend/frontend tests, stage task-owned files, commit `feat(blog): enforce article document and public detail contract`.

### Task 2: Operational article authoring, media and parity preview

**Files:**
- Modify: `frontend/src/components/admin/editor/{ArticleEditor,SlashCommandMenu,block-converter}.tsx`
- Modify: `frontend/src/app/admin/(dashboard)/blog/[id]/page.tsx`
- Modify: relevant editor tests
- Modify: `docs/012-cms-v2-wordpress-capability-task-list.md`
- Modify: `docs/status/deferred-validation.md`

**Interfaces:**
- Consumes: Task 1 document-v1 types, existing `MediaPicker`, `BlockRenderer`, and current Blog admin endpoint required metadata fields.
- Produces: locale-bearing block payloads, complete minimal metadata submit payload, allowed slash commands with real node/block conversion, media UUID selection with localized alt/caption, explicit conversion/import warnings, and same-renderer safe preview.

- [ ] **Step 1: Write failing focused tests**

  Cover conversion preserving locale and returning warnings for unsupported Tiptap nodes; creation/save payload includes title, slug, status and locale blocks; image/gallery controls select MediaPicker assets and never expose a raw UUID input; preview receives the same valid block settings.

- [ ] **Step 2: Run RED tests**

  Run the selected editor/page Vitest files. Expected: locale/metadata are absent and media commands insert placeholders.

- [ ] **Step 3: Implement minimal authoring path**

  Replace placeholder image/gallery commands with the existing picker and local alt/caption controls. Keep unsupported catalog commands unavailable rather than mapping them incorrectly. Make converter produce blocks plus warnings, preserve locale, and wire the page form to required Article fields. Render preview with the existing `BlockRenderer` document context; add predictable keyboard move controls only for existing selected blocks.

- [ ] **Step 4: Run GREEN tests and commit**

  Re-run the selected Vitest files, stage task-owned source/tests/docs, commit `feat(blog): complete safe article authoring flow`.

### Task 3: Phase 3 acceptance and fast-track record

**Files:**
- Modify: `docs/012-cms-v2-wordpress-capability-task-list.md`
- Modify: `docs/status/deferred-validation.md`
- Modify: `docs/composer-block-catalog.md` only if it owns the shared public renderer catalog reference

- [ ] **Step 1: Update only evidence-backed checklist items**

  Mark T3.1–T3.4 claims complete only where Task 1/2 behavior and tests demonstrate them. State that Topic is the sole taxonomy and previous/next is intentionally not implemented until a curation/order rule exists.

- [ ] **Step 2: Record nonessential validation**

  Add a Phase3 ledger entry for authenticated Admin browser/CSRF flow, fa/en RTL/LTR viewport/a11y QA, visual snapshots, full regression/build and live feed review. Do not defer document validation, public projection, media integrity or 404/error distinction.

- [ ] **Step 3: Commit documentation**

  Stage only the evidence/debt docs and commit `docs(phase3): record article delivery evidence`.

## Plan self-review

- Task 1 covers T3.1 safety/contract and T3.4 public DTO correctness.
- Task 2 covers the remaining T3.2/T3.3 operational authoring path and preview parity.
- Task 3 ensures no unsupported capability is marked complete and all intentionally skipped checks are traceable.
