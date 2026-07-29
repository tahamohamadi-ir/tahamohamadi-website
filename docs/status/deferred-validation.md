# موارد معوق، ریسک‌ها و اعتبارسنجی‌های باقی‌مانده

این فایل برای ثبت شفاف کارهایی است که در توسعهٔ سریع عمداً در همان برش انجام
نشده‌اند. هر مورد باید پیش از اعلام آماده‌بودن release متناظر بسته یا با تصمیم
صریح پذیرفته شود.

## R0-03 — قرارداد `getPublicPage`

- [ ] اجرای build کامل Next.js پس از یکپارچه‌سازی تغییرات درخت کاری موجود.
- [ ] اجرای smoke مرورگر برای مسیرهای `/fa` و `/en` با backend در دسترس و
  backend قطع‌شده؛ این برش فقط تست واحد API دارد.

## R0-05 — Blog discovery عمومی

- [ ] اجرای مجموعهٔ متمرکز pytest برای endpointهای `q` و `topics/` پس از تکمیل
  تغییرات این برش. **Blocker فعلی:** interpreter `D:\Project\Taha\tahamohamadi-website\.venv\Scripts\python.exe`
  فاقد ماژول `pytest` است (مشاهده در 2026-07-29).
- [ ] اجرای `python manage.py check` برای backend. **Blocker فعلی:** همین
  interpreter فاقد Django است و فرمان راهنمای فعال‌سازی/install محیط backend را
  برگرداند (مشاهده در 2026-07-29).
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

- [ ] اجرای pytest متمرکز برای `backend/tests/test_media_usage_api.py` پس از
  آماده‌شدن محیط Django؛ همان blocker محیط backend در بخش R0-05 برقرار است.
- [ ] گسترش `get_media_usage` برای رفرنس‌های Blog و Portfolio. endpoint فعلی
  فقط داده‌ای را برمی‌گرداند که service موجود از CMS page blocks پیدا می‌کند؛
  این محدودیت عمداً پنهان نشده است.
- [ ] اجرای integration UI با session/CSRF واقعی و بررسی نمایش usage و warning
  archive در Admin.

## R0-09 — Sentry instrumentation

- [ ] ارسال خطای آزمایشی از server و client به پروژهٔ واقعی Sentry و تأیید scrub
  شدن payload در dashboard. این کار بدون DSN و دسترسی به پروژهٔ Sentry قابل
  اثبات نیست.
- [ ] اجرای build production با source-map upload در CI و بررسی warningهای
  پیکربندی Sentry.

## ریسک محیط مشترک

- [ ] ورک‌تری دارای تغییرات گستردهٔ خارج از این برش است. فقط فایل‌های task-owned
  stage و commit می‌شوند؛ build یا تست کامل ممکن است به تغییرات مستقل وابسته باشد.
