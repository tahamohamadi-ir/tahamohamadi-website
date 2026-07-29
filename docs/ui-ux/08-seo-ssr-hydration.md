# 08 — SEO, SSR, and hydration

**UX-SSR-001 — Deterministic public output.** Public route content and metadata must be SSR-visible and server/client DOM must match. Browser globals and browser-only effects belong behind client lifecycle boundaries. Hydration warning is a release blocker, not cosmetic debt.

**UX-SSR-002 — Request boundary.** Create HTTP/API clients per SSR request. Server origin resolves at runtime from trusted `TAHA_BACKEND_ORIGIN`; browser calls stay same-origin. Forward only that request's `Cookie` header. Do not put request state in globals or expose backend origin, cookies, credentials, or contact content to browser bundles/logs.

**UX-SSR-003 — Mutation boundary.** Contact and other mutations use accepted CSRF flow only when needed, submit once, and do not auto-retry. Normalized errors expose safe fields only.

**UX-SSR-004 — SEO source boundary.** Eligible rendered routes need localized title, description, canonical, hreflang, Open Graph, semantic headings, and applicable safely serialized JSON-LD. Consume canonical/hreflang/SEO values only when supported by the route response and verified against rendered public path; otherwise record an unresolved integration gate. For translated detail pages, canonical and hreflang output must align with API-provided `alternatePath` under [UX-CONTENT-003](05-content-and-localization.md#ux-content-003--alternatepath-control). Never create facts for Person, WebSite, BlogPosting, ScholarlyArticle, CreativeWork, ContactPage, or BreadcrumbList.

**UX-SSR-005 — Indexability.** Sitemap/robots include only eligible rendered public URLs and exclude admin, draft, archived, private, unavailable-translation, and fallback URLs. Not-found and unavailable pages remain recoverable but are not content alternatives.

**UX-SSR-006 — Content safety.** CMS Markdown/rich HTML requires approved sanitizer decision before HTML rendering. Safe JSON-LD is data serialization, never raw CMS HTML.

Request-scoped API creation and safe error normalization have checked-in specifications. CMS SSR rendering, per-route head integration, canonical/hreflang route alignment, JSON-LD, sitemap, and robots delivery are PLANNED.
