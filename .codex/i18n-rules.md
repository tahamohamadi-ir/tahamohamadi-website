# i18n Rules

1. Supported locales are exactly `fa` and `en`; public routes use their locale prefix and layout owns `lang` and `dir`.
2. Persian and English fields are independently authored. Never fill, copy or overwrite one locale from the other without an explicit user action and audit.
3. Public projection suppresses missing or incomplete localized content. Only a documented route-level `alternatePath` may link to an alternate; it does not substitute the content itself.
4. Metadata, canonical/hreflang, image alt/caption, navigation label and CTA follow the requested locale and must not leak private or untranslated fields.
5. Admin lists and forms make missing/invalid translation state visible. Translation freshness is a workflow state, not a reason for automatic copy.
