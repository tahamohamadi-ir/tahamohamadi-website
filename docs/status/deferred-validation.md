# موارد معوق، ریسک‌ها و اعتبارسنجی‌های باقی‌مانده

این فایل برای ثبت شفاف کارهایی است که در توسعهٔ سریع عمداً در همان برش انجام
نشده‌اند. هر مورد باید پیش از اعلام آماده‌بودن release متناظر بسته یا با تصمیم
صریح پذیرفته شود.

## R0-03 — قرارداد `getPublicPage`

- [ ] اجرای build کامل Next.js پس از یکپارچه‌سازی تغییرات درخت کاری موجود.
- [ ] اجرای smoke مرورگر برای مسیرهای `/fa` و `/en` با backend در دسترس و
  backend قطع‌شده؛ این برش فقط تست واحد API دارد.

## R0-05 — Blog discovery عمومی

- [x] اجرای مجموعهٔ متمرکز pytest برای endpointهای `q` و `topics/`: 17 تست در
  `tests/test_blog_public_api.py` روی PostgreSQL Compose در 2026-07-29 پاس شد.
- [x] اجرای `python manage.py check` در runtime PostgreSQL Compose در 2026-07-29:
  بدون issue.
- [ ] اجرای تست واحد فرانت برای مسیرهای درخواست و سپس type-check کامل.
- [ ] اجرای QA مرورگر برای جست‌وجو، تغییر موضوع، pagination و حفظ هم‌زمان
  پارامترهای `q` و `topic` در هر دو locale.
- [ ] بازبینی محدودیت/رتبه‌بندی جست‌وجوی PostgreSQL پس از وجود محتوای واقعی؛
  پیاده‌سازی فعلی فیلتر `icontains` است و ranking را ادعا نمی‌کند.
- [ ] اجرای بررسی a11y فرم جست‌وجو (keyboard/focus/RTL/LTR) در مرورگر.
- [ ] اجرای build کامل Next.js. در این برش برای جلوگیری از توسعه روی یک گیت
  قرمز اجرا نشد؛ ابتدا failureهای R0-10 زیر باید تعیین‌تکلیف شوند.

## R0-10 — BlockRenderer semantics

- [ ] رفع ۵ failure در `frontend/src/components/blocks/BlockRenderer.test.tsx`.
  اجرای کامل Vitest در 2026-07-29 نشان داد تغییرات stage‌نشدهٔ Hero/Quote
  animation، heading معنایی، متن قابل‌دسترسی و border جهت‌دار مورد انتظار تست
  را تغییر داده‌اند. این فایل‌های component متعلق به تغییرات موجود ورک‌تری‌اند
  و در برش سریع R0-05 دست‌کاری نشده‌اند.

## R0-06 — Media usage endpoint

- [x] اجرای pytest متمرکز برای `backend/tests/test_media_usage_api.py`: یک تست
  قراردادی روی PostgreSQL Compose در 2026-07-29 پاس شد.
- [x] `get_media_usage` و orphan detection برای CMS، featured/blockهای Blog و
  gallery/blockهای Portfolio تکمیل شد؛ 32 تست مرتبط در PostgreSQL Compose
  در 2026-07-29 پاس شد.
- [ ] اجرای integration UI با session/CSRF واقعی و بررسی نمایش usage و warning
  archive در Admin.

## R0-07 — رسانهٔ seed

- [x] seed_data دیگر placeholder media تولید نمی‌کند و cleanup امن فقط رکوردهای
  گمشدهٔ namespace تاریخی `media/seed/` را حذف می‌کند؛ `tests/test_seed_data.py`
  در PostgreSQL Compose پاس شد.
- [ ] بارگذاری و تأیید محتوای واقعی هم‌locale (portrait/project/publication/OG)
  پیش از release عمومی؛ این برش عمداً هیچ asset جایگزین یا ساختگی ایجاد نمی‌کند.

## R1-01 — Identity

- [ ] QA مرورگر public identity در هر دو locale و تأیید محتوای واقعی؛ endpoint
  در نبود profile منتشرشده صریحاً empty state برمی‌گرداند و fallback بین localeها ندارد.

## R1-02 — تجربه و صلاحیت‌ها

- [ ] QA مرورگر public identity در هر دو locale، به‌ویژه timeline و نمایش تاریخ‌ها؛
  projection backend فقط رکوردهای published را برمی‌گرداند و دادهٔ شخصی (phone/reference)
  در مدل یا serializer عمومی وجود ندارد.

## R1-03 — پژوهش و آثار

- [ ] routeهای عمومی detail/list، frontend و QA دو locale برای ResearchProject و
  Publication؛ backend aggregate فقط رکوردهای published را برمی‌گرداند و
  manuscript/book در وضعیت draft هرگز public نیست.

## R1-04 — رزومه

- [ ] بارگذاری فایل‌های رزومهٔ واقعی و QA دانلود در مرورگر؛ backend فقط variant
  منتشرشده با MediaAsset فعال را public می‌کند و هیچ فایل archive/draft را برنمی‌گرداند.

## R1-05 — پیکربندی سایت

- [x] تست قراردادی API عمومی و اعتبارسنجی لینک/redirect در `backend/tests/test_siteconfig_api.py`
  روی PostgreSQL Compose اجرا شد؛ migration check و `manage.py check` نیز بدون issue گذشتند.
- [ ] اتصال Header، Footer، metadata SEO و CTA فرانت‌اند به `/api/public/site/` و QA مرورگر در هر دو locale.
- [ ] افزودن middleware/runtime برای اعمال `RedirectRule`‌های active، همراه با جلوگیری از loop و آزمون 301/302.
- [ ] بازبینی هم‌زمانی ایجاد رکورد singleton برای `SiteSettings`؛ guard فعلی در ViewSet است و unique constraint دیتابیسی ندارد.

## R1-06 — aggregate عمومی

- [x] aggregate `GET /api/public/site/aggregate/` برای Site و Identity با ETag، `Cache-Control` و suppress
  رکوردهای فاقد ترجمهٔ locale درخواست‌شده ساخته و با pytest روی PostgreSQL Compose بررسی شد.
- [ ] resource endpointهای تفصیلی و اتصال مصرف‌کنندهٔ Frontend به aggregate؛ این برش فقط قرارداد backend را تثبیت می‌کند.
- [ ] سنجش query-count و سیاست نهایی CDN/revalidation در محیط production؛ TTL اولیه 60 ثانیه با
  `stale-while-revalidate=300` است و هنوز با ترافیک واقعی اندازه‌گیری نشده است.

## R1-07 — Admin CRUD

- [x] منابع جدید `identity` و `siteconfig` از یک قرارداد Admin برای filter/search/ordering و optimistic
  locking استفاده می‌کنند؛ تست متمرکز DRF آن را روی PostgreSQL Compose پوشش می‌دهد.
- [ ] QA واقعی session/CSRF، pagination و keyboard در صفحه‌های Admin و اتصال فرم‌های Frontend؛
  تست فعلی با `force_authenticate` فقط contract سرور را پوشش می‌دهد.

## R1-08 — seed امن

- [x] seed identity/siteconfig idempotent فقط draftهای حداقلیِ دو‌زبانه می‌سازد و email، تلفن،
  reference و asset ندارد؛ این قرارداد با pytest روی PostgreSQL Compose بررسی می‌شود.
- [ ] بازبینی انسانی محتوا و localeها پیش از هر انتشار؛ فرمان seed عمداً هیچ رکوردی را publish نمی‌کند.

## R1-09 — checklist seed

- [x] endpoint محافظت‌شدهٔ `/api/admin/seed-review/` رکوردهای `created_by=seed` را برای status و کامل‌بودن
  هر دو locale بررسی می‌کند و `automatic_publish_allowed=false` را ثابت نگه می‌دارد.
- [ ] ساخت UI checklist در Admin و اتصال workflow انتشار گروهی؛ endpoint سرور به‌تنهایی جایگزین تأیید انسانی نیست.

## R1-10 — collectionهای CMS

- [x] source/filter/limit/order برای collection محدود شده و API عمومی منابع identity منتشرشده را بدون UUID/raw model
  resolve می‌کند؛ قرارداد با pytest PostgreSQL پوشش داده شد.
- [ ] renderer فرانت‌اند و sourceهای Blog/Portfolio هنوز باید به دادهٔ resolved متصل شوند؛ collection فعلی در UI placeholder است.

## R0-09 — Sentry instrumentation

- [ ] ارسال خطای آزمایشی از server و client به پروژهٔ واقعی Sentry و تأیید scrub
  شدن payload در dashboard. این کار بدون DSN و دسترسی به پروژهٔ Sentry قابل
  اثبات نیست.
- [ ] اجرای build production با source-map upload در CI و بررسی warningهای
  پیکربندی Sentry.

## R0-08 — Backend test runtime

- [x] فرمان تکرارپذیر `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test`
  روی PostgreSQL Compose فعال شد. اجرای متمرکز Blog و Media Usage در
  2026-07-29، 18 تست را پاس کرد.
- [x] اجرای collection کامل backend با همان فرمان در 2026-07-29: 730 تست اجرا شد؛
  پس از رفع PreviewToken، rate-limit، ScheduledPublish، قرارداد test `None` و
  ترتیب pagination، 730/730 پاس شد.
- [x] PreviewToken: nonce برای یکتایی و کنترل durable expiry/revoke اضافه شد؛
  75 تست Workflow/Preview در PostgreSQL Compose پاس شد.
- [x] rate-limit: throttleها نرخ را از تنظیمات فعال DRF می‌خوانند؛ 8 تست
  `tests/test_rate_limiting.py` در PostgreSQL Compose پاس شد.
- [x] translation outdated: تست `None` با قرارداد `NOT NULL` مدل سازگار شد و
  منطق empty-field در همان مجموعهٔ 75تایی پاس شد.
- [x] 9 failure ScheduledPublish: lock job و publish به transaction منتقل شد و
  `apps/workflow/tests/test_scheduled_task.py` در 2026-07-29، 9/9 پاس شد.
- [x] رفع 3 warning `UnorderedObjectListWarning` در list صفحات Admin با ترتیب
  پایدار `-updated_at, id`؛ اجرای کامل مجدد backend آن را تأیید کرد.
- [ ] lint backend برای فایل‌های تغییرکرده: image تست Compose فعلاً `ruff` را
  نصب ندارد؛ تا افزودن ابزار به محیط توسعه، فقط compile/test اجرا شده است.

## ریسک محیط مشترک

- [ ] اجرای دوبارهٔ کل collection backend پس از commitهای R1-05 تا R1-10؛ برای سرعت فقط مجموعهٔ متمرکز
  118 تست CMS/identity/siteconfig/seed روی PostgreSQL Compose اجرا شد. اجرای کامل 730/730 مربوط به پیش از این برش‌هاست.

- [ ] ورک‌تری دارای تغییرات گستردهٔ خارج از این برش است. فقط فایل‌های task-owned
  stage و commit می‌شوند؛ build یا تست کامل ممکن است به تغییرات مستقل وابسته باشد.
