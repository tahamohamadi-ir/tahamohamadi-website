# ADR-012: تعویق focal point و responsive media variants

**وضعیت:** پذیرفته‌شده برای تعویق
**تاریخ:** 2026-08-08

## زمینه

Media Library فعلی validation، metadata دوزبانه، archive/replace و public projection را دارد. focal point، crop variant، derivative WebP/AVIF و CDN invalidation به migration/model جدید، پردازش background، ظرفیت storage، cache policy و QA روی asset واقعی نیاز دارند.

## تصمیم

این قابلیت‌ها بخشی از برش عملیاتی فعلی نیستند. public از asset اصلیِ active و metadata locale-owned استفاده می‌کند و هیچ crop یا variant ساختگی نمایش داده نمی‌شود.

## trigger بازگشت

پیش از نیاز واقعی به crop responsive یا پس از ورود مجموعه‌ای از assetهای تأییدشده که LCP/ratio آن‌ها مشکل‌ساز است، spike باید هزینهٔ storage، invalidation، policy SVG/polyglot، retry/cleanup و budget عملکرد را اندازه بگیرد.

## rollback

تا زمانی که migration افزایشی، generation قابل retry، cleanup و fallback asset اصلی اثبات نشده‌اند، feature flag خاموش می‌ماند و هیچ reference عمومی به variant جدید ساخته نمی‌شود.
