# 03 — User journeys

**UX-JOURNEY-001 — Locale entry.** Visitor enters `/`, reaches `/language`, selects `fa` or `en`, and receives matching `lang`/`dir` at localized root. Static locale entry needs no API. A CMS detail-language change uses the API-supplied alternate path only; no slug or locale substitution.

**UX-JOURNEY-002 — Evidence discovery.** Visitor moves through labelled, deep-linkable public navigation from profile/research/resume to blog, portfolio, or publication list/detail. Current shell supports navigation; contract-backed content remains PLANNED.

**UX-JOURNEY-003 — Missing translation.** A `TRANSLATION_UNAVAILABLE` response leads to a localized unavailable state. Offer only an API-provided alternate path; otherwise offer localized home or prior navigation. Do not render another-locale content as a substitute.

**UX-JOURNEY-004 — Contact recovery.** Future contact form uses visible labels, accepted CSRF bootstrap, one active submission, localized inline recovery, retained input after recoverable failure, and a non-sensitive receipt. It never auto-retries a mutation.

**UX-JOURNEY-005 — Keyboard continuity.** Skip link reaches the one main landmark. After route change, focus moves to main content. Drawer/dialog close restores trigger focus; Escape closes overlays where applicable.

Current shell mechanics are CURRENT / TESTED by checked-in specifications. Content rendering, contact UI, route-specific alternates, and page-state components are PLANNED.
