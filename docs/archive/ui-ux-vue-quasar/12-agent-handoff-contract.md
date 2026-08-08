# 12 — Agent handoff contract

**UX-HANDOFF-001 — Read order.** Before changing public UI, read [README](README.md), controlling plan/rules/ADRs, affected route/service/fixture/test, then canonical owner documents from the map. Do not inspect generated output to infer contract facts.

**UX-HANDOFF-002 — Status discipline.** Do not promote PLANNED, PROVISIONAL, BLOCKED, FUTURE, or UNRESOLVED to CURRENT without source and applicable evidence. `TESTED` requires named checked-in test specification; browser/build results are separately recorded.

**UX-HANDOFF-003 — Delivery record.** Handoff names changed files, requirement/route/API/component mapping, state coverage, evidence run by human, unresolved decision IDs, and no-API/not-applicable cells. Preserve public locale, SSR, token, and admin boundaries.

## Full traceability matrix

| Requirement / route | API or status | Page spec | Component / design rule | Test type / phase |
|---|---|---|---|---|
| FR-LANGUAGE-001; `/`, `/language` | NO API REQUIRED | [04](04-page-specifications.md) | `LanguageSwitch`; foundations / components | Existing route/shell spec; Phase 0 |
| FR-I18N-001; `/{lang}` | `getHome(lang)` PLANNED integration | [04](04-page-specifications.md) | `SeoHead`, `PageState`; typography/layout | Route/API/SSR contract; Phase 1–2 |
| Public profile; `/{lang}/about` | `getPage(lang, 'about')` PLANNED | [04](04-page-specifications.md) | `MarkdownContent`, `PageState`; patterns | Page/state/a11y; Phase 2 |
| Public research; `/{lang}/research` | `getPage(lang, 'research')` PLANNED | [04](04-page-specifications.md) | `MarkdownContent`; typography/patterns | Page/state/SEO; Phase 2 |
| Public skills; `/{lang}/skills` | `getSkills(lang)` PLANNED | [04](04-page-specifications.md) | `SkillGroups`; components/patterns | Page/state/RTL; Phase 2 |
| Public resume; `/{lang}/resume` | `getResume(lang)` PLANNED | [04](04-page-specifications.md) | `ResumeTimeline`; typography/patterns | Page/state/a11y; Phase 2 |
| Public blog; `/{lang}/blog` | `listPosts(lang, params)` PLANNED | [04](04-page-specifications.md) | `PostCard`, `PaginationControl`; patterns | List/route/API; Phase 3 |
| Public blog detail; `/{lang}/blog/:slug` | `getPost(lang, slug)` PLANNED; `alternatePath` per UX-CONTENT-003 | [04](04-page-specifications.md) | `MarkdownContent`, `TranslationUnavailable`; typography | Detail/alternatePath/SEO; Phase 3 |
| Public portfolio; `/{lang}/portfolio` | `listPortfolio(lang, params)` PLANNED | [04](04-page-specifications.md) | `ProjectCard`, `PaginationControl`; components | List/route/API; Phase 3 |
| Public portfolio detail; `/{lang}/portfolio/:slug` | `getProject(lang, slug)` PLANNED; `alternatePath` per UX-CONTENT-003 | [04](04-page-specifications.md) | `MediaImage`, `MarkdownContent`; layout | Detail/alternatePath/SEO; Phase 3 |
| Public publications; `/{lang}/publications` | `listPublications(lang, params)` PLANNED | [04](04-page-specifications.md) | `PublicationItem`, `PaginationControl`; typography | List/route/API; Phase 3 |
| Public publication detail; `/{lang}/publications/:slug` | `getPublication(lang, slug)` PLANNED; `alternatePath` per UX-CONTENT-003 | [04](04-page-specifications.md) | `PublicationItem`, `TranslationUnavailable`; typography | Detail/alternatePath/SEO; Phase 3 |
| Public contact; `/{lang}/contact` | `submitContact(payload)` PLANNED; schema contract-owned | [04](04-page-specifications.md) | `ContactForm`, `PageState`; components | CSRF/validation/a11y; Phase 4 |
| Missing translation; localized unavailable | Error-derived; NO API REQUIRED after normalization; `alternatePath` recovery per UX-CONTENT-003 | [04](04-page-specifications.md) | `TranslationUnavailable`, `PageState`; states | Error/alternatePath/a11y; Phase 1 |
| Unknown localized URL; catch-all | NO API REQUIRED | [04](04-page-specifications.md) | `PageState`; states | Route/a11y; Phase 0 |
| NFR-A11Y-001; all public routes | NOT APPLICABLE to endpoint fields | [07](07-accessibility.md) | components / anti-patterns | Keyboard, SR, zoom, motion; every phase |
| FR-SEO-001..003; eligible public routes | Response SEO only when supported; unresolved path alignment gate | [08](08-seo-ssr-hydration.md) | `SeoHead`; tokens NOT APPLICABLE | SSR/head/JSON-LD/sitemap; Phase 5 |
| NFR-PERF-001/002; all public routes | NO API field assumption | [06](06-responsive-rtl-ltr.md) | `MediaImage`, layout-grid | Responsive/media stability; Phases 1–5 |
| Legacy 27 design-system sets | NO API REQUIRED | `design-system/README.md` | Seven design-system documents | Link/mapping audit; documentation maintenance |
| Admin frontend | FUTURE; backend capability not UI contract | [02](02-information-architecture.md) | NOT APPLICABLE | Separate plan; Phase 6 |

## Required handoff evidence

| Role | Must preserve | Minimum handoff evidence |
|---|---|---|
| Public page implementer | Locale parity, content truth, state taxonomy | Route/API/state matrix and focused tests; detail `alternatePath` used unchanged, or target-locale-root recovery without claiming translated detail |
| Accessibility reviewer | One main/H1, keyboard, skip/focus, overlays | Keyboard, 44px, 200% zoom, reduced-motion review |
| SSR/SEO implementer | Request isolation, public-only indexability | Rendered HTML/head, hydration, canonical/hreflang proof |
| Design-system reviewer | Semantic roles, editorial restraint, no raw values | Token/component/anti-pattern review |
| Documentation maintainer | Authority, status, IDs, links, mapping | Link/ID/status audit and decision updates |
| Admin implementer | Separate scope, roles, CSRF, versioning | Separate approved contract and plan |
