# فهرست تسک اجرایی 2026

**وضعیت همهٔ آیتم‌ها:** Proposed  
**قاعده:** یک تسک فقط پس از تکمیل acceptance criteria و evidence همان تسک Done می‌شود؛ صرف وجود کامپوننت یا مدل، Done نیست.

## R0 — Stabilize

- [ ] R0-01 تعیین baseline تست و اصلاح تنظیم database test محلی/Compose.
- [ ] R0-02 افزودن test regression برای hydration اجزای client-only و رفع خطای #418.
- [ ] R0-03 ثبت محتوای منتشرشدهٔ Home برای `fa` و `en` و بررسی API public.
- [ ] R0-04 طراحی empty/not-found state Home که locale دیگر را fallback نمی‌کند.
- [ ] R0-05 تعریف و پیاده‌سازی endpoint taxonomy Blog؛ اتصال `q/category/tag/page` به URL.
- [ ] R0-06 اصلاح UI/endpoint media usage و تست archive برای asset در حال مصرف.
- [ ] R0-07 پاک‌سازی یا جایگزینی seed assetهای 404.
- [ ] R0-08 رفع semantic H1 و Quote، سپس سبزکردن همهٔ تست‌های BlockRenderer.
- [ ] R0-09 تکمیل Next Sentry instrumentation و مدیریت خطای fetch در build/SSR.
- [ ] R0-10 اجرای browser matrix `/fa` و `/en` در desktop/mobile و ثبت evidence.

## R1 — Media و Contact

- [ ] R1-01 inventory همهٔ media referenceها و طراحی media usage index.
- [ ] R1-02 migration/index/service برای CMS، Blog و Portfolio.
- [ ] R1-03 endpointهای usage، orphan report و archive impact با pagination/authorization.
- [ ] R1-04 archive/replacement reversible و جلوگیری از render asset archive‌شده.
- [ ] R1-05 تکمیل MediaPicker upload/search/filter/select/replace و progress/retry.
- [ ] R1-06 validation مستقل alt/caption فارسی و انگلیسی.
- [ ] R1-07 ContactMessage model، retention و migration.
- [ ] R1-08 public contact submit: ذخیره‌سازی + email best-effort بدون افشای خطای داخلی.
- [ ] R1-09 Admin contact inbox list/detail، NEW/READ/ARCHIVED و confirmation archive.
- [ ] R1-10 integration/E2E media و contact flows.

## R2 — Public Experience

- [ ] R2-01 تکمیل sectionهای Home با contract published + locale-complete.
- [ ] R2-02 تعریف case-study template و data validation برای portfolio.
- [ ] R2-03 gallery، facts، technology و CTA امن در detail portfolio.
- [ ] R2-04 Blog filters/search/pagination/empty-error state و URL sharing.
- [ ] R2-05 related content per locale بدون cross-locale fallback.
- [ ] R2-06 route metadata: canonical، hreflang، OG/Twitter و JSON-LD.
- [ ] R2-07 sitemap/robots contract test برای published-only و no-admin/no-preview.
- [ ] R2-08 تبدیل تصویرهای public مناسب به `next/image` با dimensions و remote allowlist محدود.
- [ ] R2-09 responsive/RTL/LTR/keyboard visual QA با محتوای واقعی.

## R3 — Workflow

- [ ] R3-01 translation status contract و checklist per entity.
- [ ] R3-02 TranslationQueue فیلتر، side-by-side، زمان source update و deep-link editor.
- [ ] R3-03 WorkflowPanel transition + reason + permission + conflict dialog.
- [ ] R3-04 Scheduled list با title/locale/timezone/status/cancel/retry.
- [ ] R3-05 revision timeline، compare و restore-as-draft.
- [ ] R3-06 preview token lifecycle: issue/revoke/expiry/no-store/noindex.
- [ ] R3-07 public/preview renderer parity در دو locale و سه viewport.
- [ ] R3-08 autosave Draft، recovery marker و offline/conflict tests.

## R4 — Authoring

- [ ] R4-01 block registry و validation whitelist نهایی.
- [ ] R4-02 section/block keyboard reorder و announce برای screen reader.
- [ ] R4-03 BlockInspector برای media، CTA، collection و locale completeness.
- [ ] R4-04 Article editor extension spike و ADR برای image/figure/table/code.
- [ ] R4-05 custom inline-media node متصل به MediaPicker و usage index.
- [ ] R4-06 paste cleanup، unsafe URL/HTML rejection و sanitizer regression tests.
- [ ] R4-07 article rendering/TOC/print/reading time و BlogPosting validation.

## R5 — Quality و Platform

- [ ] R5-01 `drf-spectacular` spike، public/Admin schema split و CI validation.
- [ ] R5-02 React Query spike روی یک Admin list و ثبت ADR.
- [ ] R5-03 React Hook Form/Zod spike روی یک form و map کردن خطاهای DRF.
- [ ] R5-04 Playwright flow: login → media → compose → preview → publish.
- [ ] R5-05 Playwright flow: article create → publish → anonymous read.
- [ ] R5-06 aXe scans با `@axe-core/playwright` و baseline known issues.
- [ ] R5-07 performance budget و تصویر/JS audit.
- [ ] R5-08 security review rate limit، CSRF، proxy IP، CSP و log redaction.
- [ ] R5-09 backup/restore drill برای DB و media؛ runbook و health checks.

## R6 — Deferred Growth

- [ ] R6-01 ADR و spike django-waffle برای feature flags server-authoritative.
- [ ] R6-02 ADR و spike `django-storages` برای S3-compatible media.
- [ ] R6-03 full-text search PostgreSQL با locale isolation و ranking tests.
- [ ] R6-04 تصمیم PRD برای PWA/offline reading.
- [ ] R6-05 تصمیم PRD برای collaboration/AI/analytics؛ پیش از آن پیاده‌سازی نشود.
