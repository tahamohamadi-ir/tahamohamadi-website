# 05 — Content and localization

**UX-CONTENT-001 — Content authority.** CMS-managed text, media, links, lifecycle, translation availability, and SEO facts are authoritative only when supplied by accepted public responses. This suite owns presentation constraints, not content facts.

**UX-CONTENT-002 — Equal locales.** `fa` is RTL and `en` is LTR. Both receive localized labels, meaningful alternatives, metadata, navigation, and error recovery. Missing localized content is not a permission to render the other locale.

**UX-CONTENT-003 — alternatePath control.** API-provided `alternatePath` is authoritative for a translated detail URL and must be used unchanged. Locale or slug string replacement is prohibited. When `alternatePath` is absent, language control may navigate only to target locale root; that navigation must not be represented as a translation of current detail page. Silent content fallback is prohibited. Current shared header does not receive route-specific `alternatePath`; detail-language switching is therefore PLANNED, not claimed conformant.

**UX-CONTENT-004 — Bidi and locale format.** Use locale-aware date/number formatting only when implementation and source data support it; do not claim a calendar or numeral system not evidenced. URLs, code, DOI values, email addresses, hashes, version strings, and identifiers are LTR-isolated in Persian. Keep one metadata row internally coherent.

**UX-CONTENT-005 — Media and Markdown.** Meaningful image alternatives are localized; decorative images have empty alternatives. Never render CMS Markdown/rich HTML until an approved sanitizer decision and implementation exist. Preserve identifier/citation copyability.

> **UX-CONTENT-003 invariant — No silent fallback:** When lternatePath is absent, the language control may navigate only to the target locale root. It must never present source-locale content as a translation of the current detail page or construct a translated detail URL by replacing locale or slug text.
