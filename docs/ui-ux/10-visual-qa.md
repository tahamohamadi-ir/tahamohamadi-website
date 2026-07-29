# 10 — Visual and browser QA

**UX-QA-001 — Review matrix.** Record evidence for behaviour-changing work; command result, rendered output, and browser observation are separate evidence types. This documentation pass ran none.

| Pass | Required check | Authoritative dependency |
|---|---|---|
| Route/IA | Exact route, purpose, one H1, API/no-API mapping, state applicability | [02](02-information-architecture.md), [04](04-page-specifications.md) |
| Visual system | Semantic tokens only, editorial restraint, no raw component values/card stacks | `design-system/` |
| Accessibility | Landmark/heading, keyboard, skip/focus, names, 44px, overlays, 200% zoom, reduced motion | [07](07-accessibility.md) |
| SSR/SEO | Rendered content/head, request isolation, hydration, canonical/hreflang, safe JSON-LD, sitemap/robots | [08](08-seo-ssr-hydration.md) |
| Locale/bidi | `lang`/`dir`, logical CSS, technical LTR isolation, alternate path, no fallback | [05](05-content-and-localization.md), [06](06-responsive-rtl-ltr.md) |
| States | Each applicable canonical state and recovery path | [09](09-interaction-and-page-states.md) |

**UX-QA-002 — Viewport coverage.** Browser review covers 375, 768, 1024, and 1440 logical pixels in `fa` and `en`, including no page overflow, readable measure, keyboard navigation, visible focus, drawer Escape/focus restoration, and reduced motion.

**UX-QA-003 — Evidence labels.** `CURRENT / TESTED` means source plus checked-in test specification inspected in this audit. It is not a claim that human/browser/build verification occurred. Record missing evidence as PLANNED, BLOCKED, or UNRESOLVED.
