# Phase 2 Composer Foundation — Design

**Date:** 2026-08-08
**Status:** Approved direction; awaiting review of this design before implementation planning
**Scope:** Release 2 T2.1 first, then the smallest safe path through T2.2–T2.5

## Purpose

Make the existing CMS Composer operational quickly without inventing a second page model, embedding example content in React, or weakening public rendering safeguards. The first slice establishes one verifiable contract for every supported block across Django validation, the Next.js admin, preview, and the public renderer.

## Observed baseline

- Django already has `BLOCK_SCHEMAS` and fail-closed unknown block handling in `backend/apps/cms/block_registry.py`.
- The admin already has a 16-type block union and defaults in `frontend/src/components/admin/composer/`.
- Public rendering is owned by `frontend/src/components/blocks/BlockRenderer.tsx`.
- The current registry accepts legacy bilingual `hero` and `text` settings and projects the requested locale; it also has canonical per-locale settings for other block types. This compatibility path must remain until an explicit migration is approved.
- `seed_data` contains legacy published sample pages, does not create the documented development media fixture, and `scripts/seed/README.md` is absent. The task list was corrected to describe this as incomplete rather than release-ready.

## Chosen approach

Use a **Composer-first, contract-first** sequence:

1. T2.1 makes the existing catalog demonstrably consistent and supplies a development-only CMS fixture.
2. T2.2 proves preview/public semantic parity on that fixture before adding new preview features.
3. T2.3 adds only essential accessible Canvas operations that the existing contract needs.
4. T2.4 adds Draft-only autosave and undo/redo after interaction semantics are stable.
5. T2.5 adds portable templates last.

This avoids a JSON-field rewrite, a generic visual-builder rewrite, new client dependencies, generated production content, and speculative AI integration.

## Contract boundaries

| Concern | Source of truth | Required behavior |
| --- | --- | --- |
| Allowed block types and setting shape | Django `BLOCK_SCHEMAS` | Reject unknown types and malformed settings with existing Problem Details conventions. |
| Admin defaults and library | `composer/types.ts`, `block-defaults.ts`, library data | Every offered type has a server-recognized default and an explicit locale/media policy. |
| Public projection | CMS public serializer plus `BlockRenderer.tsx` | Render only known, valid, published content for the requested locale; unknown blocks fail closed. |
| Preview | Existing protected preview flow | Use the same locale projection and renderer semantics as public content; never cache or expose tokens publicly. |
| Content and media | CMS/Media Library records | No JSX hardcoding of sample copy, URLs, image paths, or public-facing assets. |

The frontend may describe fields for editing, but it must not become a divergent validation authority. Backend validation remains authoritative.

## Locale and data rules

- Persian and English are independently authored. There is no silent fallback from one locale to the other.
- Existing legacy bilingual `hero` and `text` settings stay supported and are projected only to the requested locale. No bulk migration is part of T2.1.
- Collections keep their existing typed, published-only sources. Empty collections are suppressed by the public renderer.
- Raw HTML is not accepted or rendered. Rich content continues through the existing sanitized path only.
- A media reference must resolve to an active Media Library record before it is accepted or emitted publicly. URL-shaped media fields must not become an unvalidated bypass.

## Development sample fixture

The initial fixture is an explicit management command and documented development procedure, not content compiled into the frontend.

- It is opt-in, idempotent, and refuses non-development settings.
- It refuses to alter non-empty CMS data unless a deliberate, explicit command option is supplied; it never runs automatically during application startup or deployment.
- It creates only **Draft** records: a bilingual Home composition, SiteProfile/SiteSettings/navigation records, and a gallery-backed sample case study.
- Its two development-only image assets are registered through `MediaAsset` with Persian and English alt text. They live in a clearly marked development seed namespace and are never used as production defaults.
- It does not create real contact details, credentials, biographies, claims, research outputs, or publish actions.
- A human must review, localize, attach approved assets, and explicitly publish any real content later.

## T2.1 delivery slices

1. **Catalog evidence and tests** — derive a small, typed catalog/manifest from the existing sources (without duplicated free-form schemas), then test that each admin-offered block is recognized by Django and has a valid default. Document its canonical/legacy locale fields and media references.
2. **Server enforcement gap closure** — trace create/update/preview/public serialization. Add only missing validation for block order and active media references, retaining standardized Problem Details and fail-closed public behavior.
3. **Development fixture** — implement the opt-in Draft-only fixture and its documentation, then verify it with focused Compose tests. It is separate from real publication readiness.
4. **Task and debt record** — mark completed acceptance items with command/test evidence; add skipped browser, visual, broad regression, and security work to `docs/status/deferred-validation.md` rather than delaying the operational slice.

No component redesign, animation expansion, portable templates, broad end-to-end suite, or visual-regression framework belongs in the first slice.

## Verification and release gates

Required for each T2.1 slice:

- focused backend registry/service/API tests in Docker Compose where database behavior is involved;
- focused frontend unit tests for the affected Composer/renderer contract;
- `git diff --check` and production type/build checks only when the changed scope makes them informative;
- task-list and deferred-validation updates that distinguish executed evidence from deferred work.

Deferred until the behavior is ready for a broader review:

- manual authenticated browser QA, visual snapshots, keyboard/touch Canvas QA;
- full backend/frontend regression suites;
- production content, approved licensing/asset review, production publish and deploy;
- threat-model/deep security review beyond focused fail-closed validation.

## Acceptance for the first slice

T2.1 is ready to move to T2.2 only when:

1. Every block surfaced by the Composer is understood by Django, preview, and public rendering, with a focused automated proof.
2. Unknown block types, malformed settings, invalid ordering, and inactive/missing media are rejected through the server contract; public output remains fail closed.
3. The development fixture is explicit, Draft-only, idempotent, documented, and uses Media Library records rather than frontend literals.
4. The public pages remain independent of fixture data and of cross-locale fallback.
5. Remaining manual/broad checks are recorded as debt, not represented as completed validation.

## Out of scope

- automatic publication, AI-generated site content, or paid Gemini use;
- changing the technology stack (Next.js/React frontend and Django/DRF backend remain in place);
- merging the separately parked experimental/security WIP branches;
- an all-at-once block-schema migration, raw-HTML support, generic page-builder engine, or a JSONB rewrite.
