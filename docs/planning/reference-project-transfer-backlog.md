# Backlog انتقال ایده‌های مفید از پروژهٔ مرجع

**تاریخ بررسی:** 2026-07-29  
**پروژهٔ مرجع:** `D:\Project\Taha\tahamohamadi-ir` (Spring Boot + Vue/Quasar)  
**پروژهٔ مقصد:** Django/DRF + Next.js

## هدف و مرز

این سند، قابلیت‌هایی را ثبت می‌کند که در کد یا اسناد اجرایی پروژهٔ مرجع دیده شدند و می‌توانند تجربهٔ سایت عمومی یا عملیات پنل مدیریت این پروژه را بهتر کنند. این **برنامهٔ انتقال تکنولوژی یا کپی کد نیست**؛ پیاده‌سازی باید با قراردادهای Django/DRF و Next.js، مدل‌های فعلی، و تست‌های این مخزن انجام شود.

مواردی که در پروژهٔ مقصد وجود دارند اما ناقص‌اند، پیش از افزودن قابلیت جدید باید تکمیل شوند. محتوای فارسی و انگلیسی مستقل است؛ نبود ترجمه نباید با نمایش محتوای locale دیگر پنهان شود.

## یافته‌های قابل انتقال

| اولویت | قابلیت | ارزش برای کاربر | وضعیت مقصد و خروجی پیشنهادی |
|---|---|---|---|
| P0 | Home مبتنی بر دادهٔ کامل و locale-complete | صفحهٔ نخست فقط بخش‌ها و رسانه‌های واقعاً منتشرشده را نشان می‌دهد؛ صفحهٔ خالی یا placeholder به کاربر نمایش نمی‌دهد. | Home انگلیسی اکنون بخش ندارد و Home فارسی از API یافت نمی‌شود. ابتدا محتوای `fa` و `en` را کامل و منتشر کنید؛ سپس empty state مدیریتی و حذف section ناقص را اضافه کنید. |
| P0 | Blog discovery با URL state | جست‌وجو، category/tag، صفحه‌بندی و لینک قابل اشتراک، کش و SEO سازگار می‌شوند. | صفحهٔ مقصد اجزای filter دارد، ولی endpoint topics فعلاً 404 است. قرارداد API برای taxonomy را تکمیل و queryهای `q`، `category`، `tag` و `page` را منبع حقیقت UI کنید. |
| P0 | شاخص مصرف رسانه و archive ایمن | قبل از archive/replace، همهٔ مصرف‌کنندگان رسانه مشخص‌اند؛ فایل استفاده‌شده ناخواسته از سایت حذف نمی‌شود. | UI به مسیر `media/{id}/usage/` درخواست می‌زند اما بک‌اند آن را عرضه نمی‌کند. یک index مشتق‌شده از CMS، Blog و Portfolio بسازید، archive را هنگام مصرف مسدود کنید، و orphan report صفحه‌بندی‌شده بدهید. |
| P1 | صف ترجمهٔ عملیاتی | مدیر سریعاً Missing / Incomplete / Outdated را می‌بیند، دو locale را کنار هم مقایسه می‌کند و به ویرایشگر همان رکورد می‌رود. | API و `TranslationQueue` وجود دارد؛ آن را با checklist فیلدهای لازم، زمان تغییر source، فیلتر «نیازمند رسیدگی»، و نمای side-by-side کامل کنید. هرگز ترجمه را خودکار overwrite نکنید. |
| P1 | چرخهٔ انتشار قابل‌فهم | Draft، بازبینی، زمان‌بندی، انتشار و آرشیو با دلیل، مجوز، conflict و audit trail قابل مشاهده‌اند. | مدل‌ها و بخش‌هایی از Workflow وجود دارد؛ UI فعلی scheduled list فقط شناسه را نشان می‌دهد. نام محتوا، locale، وضعیت job، cancel/retry، timezone و پیوند به editor را اضافه کنید. |
| P1 | Preview محافظت‌شدهٔ چنددستگاهی | قبل از انتشار، Admin همان renderer عمومی را در desktop/tablet/mobile و برای هر locale می‌بیند. | توکن preview و `PreviewPanel` وجود دارند. باید public/preview parity، `no-store`/`noindex`، token کوتاه‌عمر و حالت‌های خطا با تست E2E تأیید شوند. |
| P1 | Autosave محدود به Draft و recovery امن | کاربر محتوا از دست نمی‌دهد، ولی autosave هرگز publish نمی‌کند یا conflict را overwrite نمی‌کند. | Composer و dialog conflict وجود دارند. autosave را فقط برای Draft با debounce، saving/saved/error، offline handling و recovery marker تکمیل کنید. |
| P1 | Inbox پیام‌های تماس | پیام‌های Contact به‌جای صرفاً ارسال ایمیل، قابل پیگیری با وضعیت New / Read / Archived و امکان archive تأییدشده‌اند. | Contact فعلی اعتبارسنجی و ارسال ایمیل دارد اما inbox محتوایی ندارد. مدل ذخیره‌سازی، Admin list/detail، pagination و permission/audit لازم است. |
| P2 | گیت محتوای واقعی برای انتشار | رسانه، alt، caption و ترجمهٔ locale قبل از انتشار بررسی می‌شوند؛ فایل seed یا تصویر شکسته به کاربر نمی‌رسد. | دادهٔ seed به چند فایل ناموجود اشاره می‌کند. validation server-side و pre-publish checklist برای asset، alt/caption و لینک‌ها اضافه شود. |
| P2 | اصول UI/UX عملیاتی و editorial | سایت عمومی از card-soup و انیمیشن تزئینی دور می‌ماند؛ پنل dense، قابل‌پیش‌بینی و keyboard-friendly می‌شود. | این اصل با design system فعلی هم‌راستا است. 44px target، focus-visible، reduced motion، heading hierarchy و stateهای loading/empty/error باید به معیار پذیرش هر صفحه تبدیل شوند. |

## قراردادهای غیرقابل‌مذاکره در پیاده‌سازی

1. APIهای عمومی فقط محتوای منتشرشده و locale همان درخواست را برگردانند.
2. Preview با public یک projection/renderer مشترک داشته باشد و cache/index نشود.
3. archive و restore برگشت‌پذیر باشند؛ restore باید Draft جدید ایجاد کند، نه بازنویسی مستقیم محتوای live.
4. تمام mutationهای Admin شامل authorization، CSRF، optimistic locking و audit logging باشند.
5. رسانه در UI با preview و metadata انتخاب شود؛ شناسهٔ خام به کاربر نمایش داده نشود.
6. هر قابلیت با یک مسیر E2E واقعی پوشش داده شود: login → edit/compose → preview → publish → public read.

## مواردی که منتقل نمی‌شوند

- Vue، Quasar، Pinia، Spring Boot، Flyway و قراردادهای `/api/v1` پروژهٔ مرجع؛ مقصد روی Django/DRF و Next.js باقی می‌ماند.
- بازنویسی کلی CMS یا جایگزینی مدل‌های رابطه‌ای فعلی با JSON بدون نیاز اثبات‌شده.
- dashboard تزئینی، KPI ساختگی، gradient/animation صرفاً نمایشی یا placeholder برای محتوای واقعی.
- fallback پنهان میان `fa` و `en`.

## افزوده‌های پژوهش بازار و اکوسیستم

این موارد از بررسی مستندات رسمی انتخاب شده‌اند. «پذیرفته برای بررسی» به‌معنای نصب فوری نیست؛ هر بسته فقط همراه یک vertical slice، ADR کوچک و تست وارد پروژه می‌شود.

| تصمیم | مورد | کاربرد محدود | شرط پذیرش یا علت تعویق |
|---|---|---|---|
| نگه‌داری و تکمیل | `@tiptap/*`، `@dnd-kit/*`، Celery/Redis و Sentry | editor، composer، زمان‌بندی و مشاهده‌پذیری، همگی از قبل در پروژه هستند. | ابتدا inline-media، keyboard reorder، public/preview parity و تنظیم کامل Sentry تکمیل شوند؛ کتابخانهٔ جایگزین اضافه نشود. |
| پذیرفته برای Release 5 | `@axe-core/playwright` | اسکن خودکار a11y برای مسیرهای عمومی و flowهای کلیدی Admin. | lint یا scan به‌تنهایی کافی نیست؛ keyboard، RTL/LTR و screen-reader smoke هم باید دستی ثبت شوند. |
| پذیرفته برای Release 5 | `drf-spectacular` | قرارداد OpenAPI قابل‌اعتبارسنجی برای DRF و جلوگیری از drift میان endpoint و TypeScript. | schema عمومی و schema Admin جدا، بدون افشای endpointهای خصوصی؛ schema validation در CI. |
| پذیرفته با spike | `@tanstack/react-query` | فقط state سروری Admin: invalidation، optimistic UI کنترل‌شده و cache در فهرست‌ها. | public SSR با `fetch`/RSC باقی بماند؛ setup نباید hydration یا duplicate fetch ایجاد کند. |
| پذیرفته با spike | `react-hook-form` + `zod` + `@hookform/resolvers` | فرم‌های بزرگ Admin و Contact با type inference و error mapping یکنواخت. | serializer بک‌اند مرجع نهایی validation است؛ فقط یک فرم نمونه قبل از مهاجرت گسترده. |
| پذیرفته برای نیاز آینده | `django-storages` + S3-compatible storage | انتقال media از volume محلی به object storage هنگام نیاز به پایداری/scale. | media URL خصوصی/public، migration و backup/restore باید پیش از فعال‌سازی طراحی و تمرین شوند. |
| پذیرفته برای rollout | `django-waffle` | فعال‌سازی تدریجی featureهایی مانند Composer جدید یا editor media. | flag باید server-authoritative باشد و در Next.js به‌شکل امن قابل‌خواندن باشد؛ برای MVP ضروری نیست. |
| فقط در صورت نیاز اثبات‌شده | `django-axes` | lockout عمیق login بر مبنای signalهای Django. | throttling فعلی Login و Redis پیش از افزودن بررسی شود؛ response، proxy IP و حریم خصوصی باید تست شوند. |
| فعلاً رد | headless CMS خارجی، state manager سراسری جدید، collaboration realtime/AI editor | پیچیدگی و نگه‌داری بالا بدون نیاز فعلی. | فقط با ADR، مسئلهٔ واقعی و ظرفیت عملیاتی بازبینی می‌شوند. |

منابع رسمی: [Playwright accessibility](https://playwright.dev/docs/next/accessibility-testing)، [TanStack Query SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)، [React Hook Form resolvers](https://github.com/react-hook-form/resolvers)، [Tiptap extensions](https://tiptap.dev/docs/editor/core-concepts/extensions)، [drf-spectacular](https://drf-spectacular.readthedocs.io/en/stable/readme.html)، [django-storages](https://django-storages.readthedocs.io/en/stable/backends/amazon-S3.html)، [django-waffle](https://waffle.readthedocs.io/en/stable/)، و [django-axes](https://django-axes.readthedocs.io/en/stable/3_usage.html).

## ترتیب پیشنهادی اجرا

1. رفع داده و UX Home، hydration، و شکست‌های تست BlockRenderer.
2. هم‌راستاسازی Blog taxonomy و Media usage API با UI موجود.
3. تکمیل inbox تماس و صفحهٔ Workflow عملیاتی.
4. گیت‌های انتشار/ترجمه/رسانه و preview چنددستگاهی.
5. E2Eهای انتشار و بررسی دسترس‌پذیری/RTL/LTR برای همهٔ مسیرهای عمومی.

## منابع بررسی

- پروژهٔ مرجع: `docs/tahamohamadi_site_cms_v2_gap_based_implementation_plan.md`، `docs/roadmap/v2-release-1-media-usage-index.md` و کامپوننت‌های `AdminPageBlockComposer`، `AdminTranslationQueuePage`، `AdminMediaPickerModal` و `BlogPage`.
- پروژهٔ مقصد: `frontend/src/components/admin/`، `frontend/src/components/blocks/`، `backend/apps/workflow/`، `backend/apps/media/` و یافته‌های audit در 2026-07-29.
