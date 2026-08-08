# پیشنهاد کتابخانه‌ها و قابلیت‌ها — وضعیت عملیاتی

**تاریخ بازبینی:** 2026-08-08
**پشتهٔ مرجع:** Django/DRF + PostgreSQL + Next.js/React/TypeScript
**تصمیم فاز ۱:** dependency جدید اضافه نمی‌شود. هدف، عملیاتی‌کردن قابلیت‌های موجود و بستن گیت‌های مستندشده است.

## ۱. اصل تصمیم

مخزن هم‌اکنون یک CMS typed، public SSR و Admin مبتنی بر React دارد. اضافه‌کردن کتابخانه برای ظاهر «wow»، dashboard تزئینی، دادهٔ ساختگی یا builder آزاد، مسیر عملیاتی‌شدن را کند و سطح نگه‌داری و امنیت را بیشتر می‌کند. هر قابلیت جدید باید یک مسئلهٔ واقعی، قرارداد داده، مالک، test و rollback داشته باشد.

محتوای نمونهٔ توسعه مجاز است، اما فقط از CMS و Media Library با seed profile-guarded وارد می‌شود؛ هیچ component یا landing page نباید متن، تصویر، URL، آمار یا CTA نمونه را hardcode کند.

## ۲. آنچه اکنون در پشته وجود دارد

| حوزه | ابزار/قابلیت موجود | استفادهٔ مجاز در مسیر فعلی |
|---|---|---|
| Public rendering | Next.js App Router و React Server Components | SSR صفحات locale-aware، metadata و تفکیک باندل public/Admin |
| Admin UI | React، TypeScript، Tailwind و primitiveهای shadcn/Radix | فرم‌های عملیاتی، stateهای loading/error/conflict و keyboard flow |
| Composer | `@dnd-kit/*` و componentهای composer موجود | فقط برای blockهای allowlisted و عملیات قابل دسترس؛ keyboard controls مرجع رفتار هستند |
| Article editor | Tiptap موجود | document model محدود، sanitizer و media از Media Library؛ نه HTML/embed آزاد |
| Observability | Sentry برای Next.js | ثبت خطای scrubbed؛ تأیید ارسال واقعی و source-map CI در ledger باقی است |
| Backend | Django/DRF، Django migrations، Celery | API typed، migration افزایشی و jobهای domain-owned |
| Runtime | PostgreSQL، Nginx و Docker Compose | تست‌های integration روی PostgreSQL و کنترل cache/media در لایه‌های واقعی |

وجود package در `package.json` یا dependencyهای Python، به‌تنهایی تأیید استفاده، مجوز نمایش عمومی یا دلیل افزودن قابلیت نیست.

## ۳. اولویت اجرایی تا پایان فاز ۱

| اولویت | اقدام | شرط پذیرش |
|---|---|---|
| P0 | تکمیل اتصال Site Settings به Header، metadata و CTA | از `/api/public/site/` و فقط دادهٔ منتشرشدهٔ همان locale؛ نبود داده hardcode نشود |
| P0 | QA واقعی R1 برای session/CSRF، pagination، keyboard و public fa/en | با محتوای تأییدشده و در triggerهای `deferred-validation.md` |
| P0 | اجرای seed توسعه روی PostgreSQL توسعه و QA SSR | seed profile-guarded، بدون publish خودکار یا دادهٔ شخصی/asset ساختگی production |
| P1 | اتصال مصرف‌کننده‌های واقعی به aggregate/resource endpointها | خطای شبکه/5xx صریح بماند و locale ناقص suppress شود |
| P1 | تکرار production build با API در دسترس | بررسی SSR، routeهای locale، media و metadata؛ نتیجه در ledger ثبت شود |
| P2 | derivative/thumbnail و variant رسانه | فقط پس از ADR، policy SVG/polyglot، بودجهٔ storage و measurement روی asset واقعی |

## ۴. پیشنهادهای ردشده یا deferشده

- **Aceternity/Magic UI، custom cursor، aurora/spotlight و animationهای تزئینی:** برای public CMS content مبنای محصول نیستند. بدون مسئلهٔ کاربر، دسترس‌پذیری، budget عملکرد و محتوای واقعی اضافه نشوند.
- **GSAP یا animation framework دوم:** تا وقتی Motion و CSS موجود پاسخ‌گو هستند dependency جدید توجیه ندارد؛ motion باید reduced-motion-aware باشد.
- **پوسته‌های Django Admin مانند Jazzmin/Unfold:** Admin محصول Next.js است؛ Django Admin سطح عملیاتی اصلی نیست.
- **Pydantic موازی برای settings:** قرارداد blockها در Django/DRF serializer و registry domain-owned می‌ماند. dual validation بدون ADR ممنوع است.
- **Redis caching یا analytics اختصاصی:** پس از اندازه‌گیری query/load، تعریف retention/privacy و تعیین سؤال تصمیم‌گیری بررسی می‌شود؛ metric ساختگی در dashboard ممنوع است.
- **AI Writer:** فقط با ADR برای retention، consent، prompt/data boundary، هزینه، audit و review انسانی؛ تولید خودکار نباید محتوا را publish کند.

## ۵. گیت افزودن dependency یا قابلیت

پیش از افزودن هر library یا feature، یک ADR یا task باید این پاسخ‌ها را ثبت کند:

1. مسئلهٔ واقعی و صفحه/کاربر هدف چیست؟
2. آیا قابلیت یا dependency موجود آن را حل می‌کند؟
3. قرارداد API/data، localization، accessibility، امنیت و performance چگونه است؟
4. test، telemetry، rollback و owner چه هستند؟
5. آیا این کار فاز ۱ را جلو می‌برد یا باید در `deferred-validation.md` ثبت شود؟

تا پیش از این گیت، قابلیت‌های پیشنهادی صرفاً backlog هستند، نه دستور پیاده‌سازی.
