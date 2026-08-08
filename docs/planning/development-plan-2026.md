# طرح توسعهٔ پیشنهادی 2026

**وضعیت:** Proposed — تا پیش از اجرای هر release، با Kiro spec و قراردادهای موجود هم‌راستا شود.  
**دامنه:** Django/DRF + Next.js؛ سایت عمومی، Admin CMS و عملیات انتشار.  
**روش اجرا:** releaseهای کوچک و عمودی؛ هر release باید قابل استفاده، قابل‌آزمون و قابل rollback باشد.

## هدف محصول

سایت باید یک نمایهٔ حرفه‌ای دوزبانه، قابل‌اعتماد و سریع برای پژوهش، نوشته‌ها و case studyها باشد. Admin نیز باید یک CMS عملیاتی و امن باشد: مدیر بتواند محتوا و رسانه را بدون از دست‌دادن داده بسازد، ترجمه را پیگیری کند، قبل از انتشار preview ببیند و انتشار را کنترل کند.

## اصول تصمیم‌گیری

1. ابتدا نقص‌های قابل مشاهده و قراردادهای شکسته را اصلاح می‌کنیم؛ سپس feature جدید می‌سازیم.
2. `fa` و `en` مستقل‌اند. ترجمهٔ ناقص یا رسانهٔ بدون alt همان locale، بخش منتشرشده را پنهان یا انتشار را متوقف می‌کند.
3. یک renderer/projection برای public و preview؛ Preview همواره private، کوتاه‌عمر، `no-store` و `noindex` است.
4. Admin متراکم و keyboard-friendly است؛ dashboard تزئینی، metric ساختگی و animation صرفاً نمایشی خارج از scope هستند.
5. هر mutation با session/CSRF، permission، optimistic lock و audit log محافظت می‌شود.
6. dependency جدید فقط پس از spike کوچک و با مالک، دلیل، مسیر حذف و تست مشخص وارد می‌شود.

## نقشهٔ releases

| Release | خروجی کاربر | وابستگی اصلی | معیار خروج |
|---|---|---|---|
| R0 — Stabilize | Home سالم، Blog/Media بدون قرارداد شکسته، test baseline | داده و API موجود | هیچ صفحهٔ عمومی خالی یا hydration error ندارد؛ تست‌های تعیین‌شده سبزند. |
| R1 — Content operations | Media امن و Inbox تماس | R0 | مدیر می‌تواند رسانهٔ مصرف‌شده و پیام‌های تماس را با اثر روشن مدیریت کند. |
| R2 — Public experience | Landing، Case Study، Blog و SEO قابل‌اشتراک | R0 | مسیرهای public با محتوای واقعی، metadata و a11y پایه منتشرپذیرند. |
| R3 — Publishing workflow | ترجمه، preview، schedule، revisions | R1 | یک flow کامل Draft تا Publish بدون overwrite و با audit قابل اجراست. |
| R4 — Authoring | Page Builder و Article editor قابل استفاده | R3 + R1 | نویسنده محتوا/رسانه را می‌سازد، preview می‌کند و منتشر می‌کند. |
| R5 — Quality & contracts | OpenAPI، E2E، observability و hardening | R2–R4 | CI قرارداد، a11y، امنیت و مسیرهای حیاتی را محافظت می‌کند. |
| R6 — Controlled growth | feature flags، object storage و search | R5 | قابلیت‌های جدید قابل rollout/rollback و عملیات رسانه قابل‌مقیاس‌اند. |

## R0 — تثبیت و دادهٔ واقعی

- **R0-01:** رفع React hydration و جلوگیری از خروجی متفاوت server/client در اجزای interactive.
- **R0-02:** ثبت و انتشار محتوای Home مستقل برای `fa` و `en`؛ افزودن empty state مفید برای مدیر، نه visitor.
- **R0-03:** تکمیل قرارداد Blog taxonomy و اتصال filterها به `q`، category/tag و page در URL.
- **R0-04:** عرضهٔ API مصرف رسانه یا حذف call نامعتبر UI؛ archive/replacement نباید براساس حدس انجام شود.
- **R0-05:** جایگزینی media seed شکسته با asset واقعی یا حذف رکوردهای نمایشی از محیط production-like.
- **R0-06:** رفع پنج شکست BlockRenderer، یک H1 در هر صفحهٔ public، altهای لازم و sanity check RTL/LTR.
- **R0-07:** هم‌راستاسازی تنظیم database test با Compose و تعیین یک command قابل‌تکرار برای frontend/backend test.
- **R0-08:** تکمیل instrumentation Sentry مطابق نسخهٔ فعلی SDK؛ خطاهای build-time backend fetch باید به‌صورت صریح مدیریت شوند.

**پذیرش R0:** `/fa` و `/en` دارای محتوا یا state تعریف‌شده‌اند؛ public console بدون hydration error است؛ Blog/Media 404 قراردادی ندارد؛ مسیرهای unit/integration تعیین‌شده سبزند.

## R1 — عملیات محتوا و رسانه

- **R1-01:** normalized media usage index برای CMS، Blog و Portfolio، با endpoint detail و pagination.
- **R1-02:** archive/replacement reversible با warning مصرف‌کنندگان، orphan report و محافظ public rendering.
- **R1-03:** MediaPicker واحد: search، type filter، upload-in-flow، progress، retry، select/clear/replace و metadata locale.
- **R1-04:** مدل ContactMessage با lifecycle `NEW → READ → ARCHIVED`، retention policy و Admin inbox.
- **R1-05:** نمایش نام محتوا و locale در activity/audit trail؛ ID خام تنها در ابزارهای فنی قابل مشاهده باشد.

**پذیرش R1:** مدیر قبل از تغییر رسانه، همهٔ references را می‌بیند؛ پیام تماس قابل پیگیری است؛ mutationها audit می‌شوند.

## R2 — سایت عمومی و Landing

- **R2-01:** Home editorial با یک H1، hero معتبر، research focus، selected work، publications، latest writing و contact CTA؛ collection خالی حذف می‌شود.
- **R2-02:** قالب Case Study: مسئله، نقش، روش، outcome، technology، gallery، facts و CTA مرتبط؛ بدون fabrication.
- **R2-03:** Blog discovery کامل: featured/latest، taxonomy، search، pagination، empty/error state و URL shareability.
- **R2-04:** related writing/project/publication فقط از دادهٔ منتشرشده و locale-complete.
- **R2-05:** metadata کامل هر route: canonical، hreflang، OG/Twitter image، BlogPosting/Person/CreativeWork JSON-LD و robots مناسب.
- **R2-06:** استفادهٔ امن و ابعادی از `next/image` برای رسانه‌های واقعی؛ جلوگیری از CLS و تنظیم محدود `remotePatterns`.
- **R2-07:** مسیرهای Research، Publications و Resume با فیلتر/سازمان‌دهی متناسب با دادهٔ واقعی، نه صفحه‌های پر از card.

**پذیرش R2:** public route matrix روی desktop/mobile و RTL/LTR بررسی شده، هیچ placeholder تصویری ندارد و metadata/sitemap فقط محتوای published را معرفی می‌کند.

## R3 — انتشار، ترجمه و Preview

- **R3-01:** Translation queue با Missing/Incomplete/Complete/Outdated، checklist کامل، فیلتر و side-by-side compare.
- **R3-02:** تغییر source locale مقصد را Outdated کند؛ هرگز متن مقصد را overwrite نکند.
- **R3-03:** WorkflowPanel با transitionهای مجاز، دلیل تغییر، permission، optimistic conflict و audit timeline.
- **R3-04:** scheduled publishing با timezone، cancel، retry/failure log، idempotency و نمای Admin قابل‌فهم.
- **R3-05:** revision list، compare و restore-as-draft؛ restore محتوای live را مستقیم تغییر نمی‌دهد.
- **R3-06:** preview token قابل ابطال و locale-bound، device preview desktop/tablet/mobile و parity test با public.
- **R3-07:** autosave فقط برای Draft با debounce، status، offline/error recovery و عدم overwrite conflict.

**پذیرش R3:** E2E «ویرایش → preview دو locale → schedule/publish → public read → restore draft» پاس می‌شود.

## R4 — ابزارهای نویسندگی

- **R4-01:** Page Builder: block/section library محدود، keyboard reorder، inspector با validation و وضعیت ترجمهٔ هر block.
- **R4-02:** validation server-side برای block type، settings whitelist، CTA امن، ordering، media reference و locale completeness.
- **R4-03:** Article editor: slash commands، paste cleanup، semantic heading/quote/code/table، inline MediaPicker و caption/alt.
- **R4-04:** custom Tiptap figure/media node که فقط به MediaAsset معتبر وصل می‌شود؛ raw external image URL خارج از سیاست مجاز نیست.
- **R4-05:** Markdown/legacy compatibility و sanitize test؛ renderer عمومی هرگز raw HTML اعتمادنشده را sink نکند.

**پذیرش R4:** نویسنده می‌تواند مقالهٔ دوزبانه و صفحهٔ composed بسازد و بدون اختلاف renderer، آن را preview و publish کند.

## R5 — کیفیت، قرارداد و امنیت

- **R5-01:** OpenAPI با `drf-spectacular`، schema validation و تفکیک API عمومی/Admin؛ سپس type generation فقط اگر duplication معنی‌دار باقی ماند.
- **R5-02:** spike React Query برای یک صفحهٔ Admin و spike React Hook Form/Zod برای یک فرم؛ نتیجه ADR و تصمیم نگه‌داری/رد است.
- **R5-03:** Playwright E2E برای login، media، compose، article lifecycle، public published-only و locale switch.
- **R5-04:** `@axe-core/playwright` روی مسیرهای عمومی و dialogهای اصلی؛ known violationها time-boxed و ثبت‌شده باشند.
- **R5-05:** performance budget: LCP/CLS، image sizes، JavaScript budget و reduced-motion regression.
- **R5-06:** rate limit و login hardening موجود با Redis/proxy/IP و 429 response تست شود؛ فقط در صورت gap واقعی Axes spike شود.
- **R5-07:** backup/restore عملی PostgreSQL و media، structured logging، health/readiness و runbook incident.

**پذیرش R5:** CI روی schema، unit/integration، E2E و a11y اجرا می‌شود؛ release gate دارای evidence قابل بازبینی است.

## R6 — رشد کنترل‌شده

- **R6-01:** feature flags برای rollout/rollback Home، Composer و editor media با مالک و تاریخ حذف.
- **R6-02:** spike object storage با `django-storages` و S3-compatible provider؛ signed/public media policy و disaster-restore test.
- **R6-03:** PostgreSQL full-text search برای نوشته‌ها و case studyها، با ranking، locale isolation و privacy-safe analytics.
- **R6-04:** manifest/PWA فقط اگر installability یا offline reading یک نیاز ثابت کاربران باشد.
- **R6-05:** collaboration realtime، AI writing یا analytics dashboard تنها با PRD/ADR جداگانه.

## گیت مشترک هر Release

1. قرارداد API، migration و data backfill مشخص است.
2. اختیارات، CSRF، audit و optimistic lock تست شده‌اند.
3. RTL/LTR، keyboard، focus، heading و reduced motion بررسی شده‌اند.
4. داده و asset واقعی با alt/caption مستقل locale موجود است.
5. public فقط published content را می‌بیند؛ preview/Admin قابل index نیستند.
6. test command، migration/rollback و معیار rollback در PR ثبت می‌شوند.

## منابع فنی

- [Next.js metadata و OG](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) و [sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js Image](https://nextjs.org/docs/app/getting-started/images)
- [Playwright accessibility](https://playwright.dev/docs/next/accessibility-testing)
- [TanStack Query و App Router SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/en/stable/readme.html)
