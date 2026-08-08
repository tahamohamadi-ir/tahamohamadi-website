# 11 — Implementation roadmap

**UX-ROADMAP-001 — Scope boundary.** M1 does not change accepted backend contracts, backend implementation, migrations, or admin frontend. Current starting point: public shell, route inventory, request-scoped API boundary, and fixtures/specifications exist; CMS-backed route integration and canonical state components are next.

| Phase | Prerequisites / risks | RED contract | GREEN output | Browser / DoD / handoff evidence |
|---|---|---|---|---|
| 0. Protect boundary | Accepted contract/ADR/rules; risk: treating placeholders as pages. | Route and service mapping specs. | No source change beyond scoped public work. | Document changed scope and unresolved contract gaps. |
| 1. Shared states and route data | Fixture response/error evidence; risk: invented fields or stale leakage. | Per-state and per-route API mapping tests. | Request-isolated loaders and canonical state components. | SSR/hydration state review; map route/component/tests in handoff. |
| 2. Home/profile/skills/resume | Supported content and sanitizer decision for Markdown; risk: CMS fact invention. | One-H1, locale, loading/empty/error/offline/translation tests. | Contract-backed pages in journey order. | Both locales, viewports, reading/RTL/keyboard evidence. |
| 3. Blog/portfolio/publications | Detail alternate and SEO contract proof; risk: UI/API path or canonical mismatch. | List/detail, unavailable translation, pagination only if supported. | Repeated content and details after proven repetition. | Rendered head/JSON-LD proof, no unsupported field claims. |
| 4. Contact | Accepted payload/CSRF/error rules; risk: duplicate submit or sensitive logging. | Validation, CSRF, single-submit, retained-input tests. | Accessible contact form and safe receipt. | Keyboard/error recovery and network/forbidden review. |
| 5. SEO and release gate | Approved assets, sanitizer, canonical alignment; risk: crawlable fallback/draft URLs. | SSR metadata/sitemap/robots/hydration tests. | Per-route SEO only where supported. | Rendered HTML, browser, build and route inventory evidence. |
| 6. Admin | Separate approved scope; risk: importing public assumptions. | Separate plan. | FUTURE. | Contract/role/CSRF/versioning evidence. |

**UX-ROADMAP-002 — Delivery discipline.** Each phase follows RED, GREEN, REFACTOR, review. Stop for silent fallback request, unsafe raw HTML, hydration mismatch, missing approved sanitizer, unsupported asset claim, or core accessibility failure. Human operator runs tests, builds, browser checks, Git, and commits.
