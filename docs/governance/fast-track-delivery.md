# سیاست تحویل سریع

**وضعیت:** فعال برای توسعهٔ مرحله‌ای؛ آخرین بازبینی: 2026-08-08
**ledger مرجع:** [deferred-validation.md](../status/deferred-validation.md)

## هدف

هدف تحویل سریع، رساندن یک برش عمودیِ قابل استفاده به محیط عملیاتی است؛ نه حذف پنهانی کیفیت. هر برش باید یک قرارداد واقعی، رفتار قابل مشاهده و مسیر بازگشت مشخص داشته باشد. مواردی که در همان برش ضروری نیستند با شناسه در ledger ثبت می‌شوند تا بتوان بعداً بدون حدس‌زدن به آن‌ها بازگشت.

## آنچه می‌تواند defer شود

- QA دستی گستردهٔ مرورگر، viewport و accessibility پس از آن‌که تستِ قرارداد یا واحد متناسب اجرا شده باشد.
- benchmark و تنظیم نهایی cache/CDN که به داده یا ترافیک واقعی نیاز دارد.
- قابلیت‌های P2/P3، dependency جدید و refactorهایی که برای رفتار برش لازم نیستند.
- محتوای واقعی یا asset تأییدشده؛ تا زمان تأیید، Public باید بخش را suppress کند و هرگز جایگزین ساختگیِ production نشان ندهد.

## آنچه هرگز defer نیست

- authorization، session/CSRF، validation ورودی، سیاست URL/media و جلوگیری از افشای دادهٔ خصوصی.
- migration افزایشی و سازگار، integrity داده، optimistic locking و audit mutationهای Admin.
- مرز `published` در public، استقلال localeهای `fa` و `en` و منع fallback پنهان بین آن‌ها.
- حذف یا انتشار غیرقابل بازگشت، یا هر عملی که بدون backup/rollback دادهٔ کاربر را در معرض خطر بگذارد.

## قرارداد ledger

هر defer باید در `docs/status/deferred-validation.md` شامل این اطلاعات باشد:

1. شناسهٔ پایدار (برای نمونه `R1-05-QA-001`).
2. دلیلِ تعویق و شواهدی که اکنون وجود دارد.
3. ریسک باقی‌مانده و mitigation فعلی.
4. owner و trigger بازگشت؛ مانند «پیش از publish»، «پیش از production deploy» یا «با ورود دادهٔ واقعی».

بستن یک release مستلزم اجرای triggerهای همان release است. وجود مورد defer به‌معنی مجازبودن bypass در release gate نیست.

## روند برش عمودی

1. قرارداد و مدل موجود را بررسی کنید؛ endpoint، field، slug یا DTO حدسی نسازید.
2. یک تست متمرکز RED بنویسید و شکست درست آن را ببینید.
3. کمترین تغییر backend/frontend لازم را پیاده کنید؛ public SSR و Admin CSR را جدا نگه دارید.
4. تست متمرکز و سپس verification متناسب را اجرا کنید.
5. موارد باقی‌مانده را با شناسه در ledger و وضعیت task list ثبت کنید.
6. فقط فایل‌های همان برش را stage، commit و push کنید. تغییرهای نامرتبطِ worktree مالکیت کاربر دارند.

## محتوای نمونه و دادهٔ توسعه

نمونهٔ توسعه فقط از مسیر CMS، seed profile-guarded و Media Library وارد می‌شود. متن، لینک و تصویر مثال نباید در component یا landing page hardcode شوند و seed نباید در production خودکار اجرا یا داده‌ای را publish کند.
