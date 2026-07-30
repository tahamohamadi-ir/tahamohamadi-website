# موارد معوق، ریسک‌ها و اعتبارسنجی‌های باقی‌مانده

این فایل برای ثبت شفاف کارهایی است که در توسعهٔ سریع عمداً در همان برش انجام
نشده‌اند. هر مورد باید پیش از اعلام آماده‌بودن release متناظر بسته یا با تصمیم
صریح پذیرفته شود.

## R0-03 — قرارداد `getPublicPage`

- [x] Home با `page_type=home` بازیابی می‌شود، نه اسلاگ وابسته به locale. مسیرهای
  ثابت فارسی مانند `/fa/about` ابتدا مالکیت `slug_fa` را بررسی و فقط در نبود کامل آن
  از `slug_en` منتشرشده استفاده می‌کنند؛ متن و blockها همچنان فقط برای locale درخواست‌شده
  projection می‌شوند. ۲۰ تست integration صفحه در PostgreSQL Compose سبز است.
- [ ] اجرای build کامل Next.js پس از یکپارچه‌سازی تغییرات درخت کاری موجود.
- [ ] اجرای smoke مرورگر برای مسیرهای `/fa` و `/en` با backend در دسترس و
  backend قطع‌شده؛ این برش فقط تست واحد API دارد.

## R0-04 — ownership عمومی

- [x] PublicLayout تنها مالک `main#main-content` است؛ Home/About/Contact/Resume دیگر nested main تولید نمی‌کنند و یک test قراردادی source آن را پوشش می‌دهد.
- [ ] QA مرورگر `/fa` و `/en` با CMS Home منتشرشده؛ یک H1 واقعی برای هر صفحه و نبود section خالی باید همراه با semantic Hero در R0-10 تأیید شود.
- [ ] بررسی 375/768/1024/1440، RTL/LTR، keyboard skip-link و reduced-motion با backend در دسترس.

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

- [x] bridge سازگاری فقط شکل دقیق Hero/Text دوزبانهٔ قدیمی را می‌پذیرد؛ Admin در
  ذخیره‌سازی همان JSON قدیمی را نگه می‌دارد و API عمومی آن را در locale درخواست‌شده به
  تنظیمات canonical renderer تبدیل می‌کند. هیچ fallback میان‌زبانی یا migration مخربی
  انجام نشده است.
- [ ] رفع ۵ failure در `frontend/src/components/blocks/BlockRenderer.test.tsx`.
  اجرای کامل Vitest در 2026-07-29 نشان داد تغییرات stage‌نشدهٔ Hero/Quote
  animation، heading معنایی، متن قابل‌دسترسی و border جهت‌دار مورد انتظار تست
  را تغییر داده‌اند. این فایل‌های component متعلق به تغییرات موجود ورک‌تری‌اند
  و در برش سریع R0-05 دست‌کاری نشده‌اند.
- [ ] composer فعلی برای block جدید `settings: {}` می‌سازد و بنابراین همچنان می‌تواند
  422 معتبر بگیرد. defaults، فرم دوزبانه و پیام inline باید پس از تعیین قرارداد canonical
  blockها در همان تغییرات مستقل frontend یکپارچه و با QA مرورگر بررسی شود.
- [ ] سیاست اجرای migration در compose معمولی تعریف نشده است. migrationهای عقب‌افتادهٔ
  دیتابیس محلی در 2026-07-30 به‌صورت دستی اعمال شد؛ پیش از محیط مشترک باید backup، job یا
  startup policy امن و smoke پس از migration تعیین شود.

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

- [x] `SiteProfile` نیز unique singleton constraint دارد و API در race، Problem Details 409 می‌دهد.
- [ ] QA مرورگر public identity در هر دو locale و تأیید محتوای واقعی؛ endpoint
  در نبود profile منتشرشده صریحاً empty state برمی‌گرداند و fallback بین localeها ندارد.

## R1-02 — تجربه و صلاحیت‌ها

- [ ] QA مرورگر public identity در هر دو locale، به‌ویژه timeline و نمایش تاریخ‌ها؛
  projection backend فقط رکوردهای published را برمی‌گرداند و دادهٔ شخصی (phone/reference)
  در مدل یا serializer عمومی وجود ندارد.

## R1-01/R1-02 — قرارداد فهرست منابع هویت

- [x] endpointهای paginated allowlisted برای `skills`، `experience`، `education`، `certifications`، `affiliations` و `languages` افزوده شدند؛ فقط published و locale-complete برمی‌گردند و Skill فقط filter محدود category دارد.
- [ ] اتصال صفحه‌های عمومی اختصاصی برای این منابع، دادهٔ منتشرشدهٔ تأییدشده و QA مرورگر در fa/en؛ تا آن زمان CMS collection تنها مصرف‌کنندهٔ عمومی موجود است.

## R1-03 — پژوهش و آثار

- [x] endpointهای عمومی paginated list/detail برای ResearchProject و Publication، با suppress draft و locale
  درخواست‌شده، روی PostgreSQL Compose تست شدند.
- [x] endpoint paginated `research-interests/` با همان suppress منتشرشده و locale-complete به قرارداد identity افزوده شد.
- [x] صفحات SSR list/detail برای ResearchProject و Publication به endpointهای public متصل شدند؛ empty/error و
  URL-state filter/pagination برای Publications وجود دارد.
- [ ] QA دو locale در مرورگر با دادهٔ تأییدشده؛ backend aggregate و resource endpointها فقط رکوردهای published را
  برمی‌گردانند و manuscript/book در وضعیت draft هرگز public نیست.

## R1-04 — رزومه

- [x] endpointهای عمومی list/detail و صفحهٔ SSR Resume به variantهای `published + active asset` متصل شدند؛ پاسخ فایل فقط URL، نام، MIME و حجم را برمی‌گرداند و metadata داخلی media را expose نمی‌کند.
- [ ] بارگذاری فایل‌های رزومهٔ واقعی و QA دانلود در مرورگر؛ backend فقط variant
  منتشرشده با MediaAsset فعال را public می‌کند و هیچ فایل archive/draft را برنمی‌گرداند.
- [ ] اجرای build production با API در دسترس و QA `fa/en`، pagination، حالت empty/error و دانلود فایل PDF/DOCX واقعی.

## R3-02 — About از دادهٔ هویتی

- [x] fallback SSR مسیر About در نبود صفحهٔ CMS، فقط SiteProfile و Experience/Education منتشرشده و کامل در locale درخواست‌شده را از aggregate نمایش می‌دهد؛ دادهٔ locale دیگر یا محتوای ساختگی جایگزین نمی‌شود.
- [ ] QA مرورگر `/fa/about` و `/en/about` با صفحهٔ CMS و fallback aggregate، timeline خالی/دارای داده، تاریخ‌ها، RTL/LTR، keyboard و viewportهای هدف. bio و ترتیب timeline باید با محتوای واقعی تأیید شوند.

## R3-08 — فرم تماس

- [x] honeypot `website` بدون ارسال ایمیل پاسخ موفق می‌دهد، throttle اختصاصی Contact فعال است و Frontend جزئیات خطای غیرمیدانی server را نمایش نمی‌دهد؛ فرم فقط پس از موفقیت تأییدشده پاک می‌شود.
- [ ] QA واقعی CSRF/cookie و rate-limit در Docker، keyboard/aria-live در fa/en و تصمیم retention در R4-05. delivery ایمیل نیز باید با mailbox واقعی بررسی شود.

## R3-09 — SEO و sitemap

- [x] sitemap برای ResearchProject و Publication فقط تقاطع پاسخ‌های published و locale-complete `fa/en` را وارد می‌کند؛ alternateها دیگر به resource دارای ترجمهٔ ناقص اشاره نمی‌کنند.
- [ ] اجرای production sitemap با API واقعی و تأیید crawler، افزودن/بازبینی JSON-LD `Person` و `CreativeWork`، OG/Twitter image و canonical/hreflang همهٔ routeهای عمومی. static sitemap و routeهای موجود نیز باید با فهرست route نهایی بازبینی شوند.

## R4-05 — Inbox پیام‌های تماس

- [x] `POST /api/public/contact/` اکنون پیام معتبرِ غیر-honeypot را پیش از تلاش fail-safe برای اعلان ایمیل در `ContactMessage` ذخیره می‌کند؛ log برنامه متن، نام یا ایمیل پیام را ثبت نمی‌کند.
- [x] `GET /api/admin/contact-messages/` و detail فقط با session محافظت می‌شوند؛ list بدنهٔ پیام را برنمی‌گرداند، `status` و search روی name/email/subject دارد و actionهای `mark-read` و `archive` گذار `NEW → READ → ARCHIVED` را enforce می‌کنند.
- [x] UI مستقل `/admin/contact` فهرست خلاصه، جست‌وجو/فیلتر، مشاهدهٔ detail و actionهای مرحله‌ای را مصرف می‌کند و UUID را نمایش نمی‌دهد؛ این صفحه عمداً بدون دست‌زدن به shell مشترک ساخته شد.
- [ ] افزودن navigation پس از تعیین وضعیت shell مشترک و QA واقعی session/CSRF، search، pagination، keyboard و viewportهای target. نمایش پیام در UI فعلی فارسی است؛ معادل انگلیسی Admin و تست RTL/LTR همچنان نیازمند تصمیم محصول هستند.
- [ ] سیاست retention (مدت نگه‌داری، deletion قابل بازیابی یا حذف قطعی، job زمان‌بندی‌شده، backup و مجوز دسترسی) تصمیم و سپس پیاده‌سازی شود؛ در این برش هیچ حذف خودکاری انجام نشد.
- [ ] بررسی migration روی محیط staging با backup و آزمایش migration برگشت‌پذیر، و تست واقعی mailbox برای تضمین این‌که ذخیره‌سازی پایدار حتی با خطای delivery باقی می‌ماند.

## R4-06 — سلامت محتوا

- [x] گزارش محافظت‌شدهٔ `/api/admin/content-health/` و صفحهٔ `/admin/content-health` فقط نقص ترجمه، alt تصویر، orphan media و schedule ناموفق را از دادهٔ جاری نشان می‌دهند؛ هر مورد به مسیر واقعی اقدام در Admin لینک دارد و UUID خام نمایش داده نمی‌شود.
- [ ] اسکن و نگه‌داری گزارش broken-link هنوز وجود ندارد؛ dashboard عمداً برای آن مقدار یا count ساختگی نشان نمی‌دهد.
- [ ] هر بخش گزارش حداکثر ۱۰۰ مورد را نمایش می‌دهد؛ برای مجموعه‌های بزرگ باید pagination/filter سروری، query-budget و سنجش performance افزوده شود.
- [ ] افزودن navigation پس از تعیین وضعیت shell مشترک و QA واقعی session/CSRF، keyboard، RTL/LTR و viewportهای هدف در `/admin/content-health`.

## R4-07 — timeline قابل‌فهم audit

- [x] actionهای `mark-read` و `archive` پیام تماس با عنوان وضعیت واقعی در audit ثبت می‌شوند و timeline محافظت‌شدهٔ جزئیات، فقط action/actor/timestamp را بازمی‌گرداند؛ Inbox UUID خام را نمایش نمی‌دهد.
- [ ] تعمیم timeline به Page/Blog/Portfolio/Media و نمایش نام/locale و لینک اقدام برای هر رویداد؛ endpoint فنی generic audit همچنان برای عیب‌یابی به `content_type` و `object_id` نیاز دارد.
- [ ] QA واقعی session/CSRF و سازگاری رخدادهای قدیمیِ generic با timeline انسانی، همراه با keyboard و viewportهای Inbox.

## R4-02 — بایگانی و جایگزینی امن رسانه

- [x] `POST /api/admin/media/{id}/archive/` اکنون رسانهٔ referenced را در یک تراکنش قفل می‌کند، وضعیت active را حفظ می‌کند و `409` همراه با `usage_count` و فهرست impact واقعی برمی‌گرداند؛ بنابراین درخواست هم‌زمان نمی‌تواند میان بررسی مصرف و بایگانی، محتوای عمومی را بشکند.
- [x] `POST /api/admin/media/{id}/replace/` اکنون replacement فعال را بدون UUID خام در UI انتخاب می‌کند، referenceهای شناخته‌شدهٔ CMS/Blog/Portfolio (شامل FK، gallery و `media_id`/`media_ids`) را در یک تراکنش بازنویسی می‌کند و فقط پس از موفقیت کامل مبدأ را archive می‌کند. middleware نیز رخداد `replaced` را در audit ثبت می‌کند.
- [ ] R4-01 یعنی `MediaUsageReference`، backfill/reconcile job و index schema-based هنوز وجود ندارد؛ تا قبل از آن replacement فقط قراردادهای منبعِ شناخته‌شده را پوشش می‌دهد و تضمین کامل در برابر reference جدیدِ ناشناخته یا نویسندهٔ هم‌زمان ندارد.
- [ ] QA واقعی session/CSRF و مرورگر برای سه حالت لازم است: رسانهٔ used باید با 409 فعال بماند، replacement باید مصرف‌ها را منتقل و مبدأ را archive کند، و رسانهٔ unreferenced باید بایگانی شود. build تازهٔ Docker در این برش به‌علت proxy محلیِ خاموش روی `127.0.0.1:3067` اجرا نشد؛ تست backend با image موجود و mount کد جاری انجام شد.

## R4-01 — index و reconcile مصرف رسانه

- [x] مدل `MediaUsageReference` با FKهای صریح برای CMS block، Article، ArticleBlock، CaseStudy و CaseStudyBlock، کلید یکتای media/source/field و indexهای owner/source اضافه شد. `python manage.py reconcile_media_usage` این index را در تراکنش از referenceهای شناخته‌شده بازسازی و stale rowها را حذف می‌کند.
- [ ] command هنوز schedule/lock/metric/alert ندارد و در جریان‌های bulk import یا تغییر مستقیم داده خودکار اجرا نمی‌شود؛ تا تعیین freshness SLO، عملیات روزمره هنوز `get_media_usage` و orphan scanner مستقیم را منبع حقیقت می‌دانند.
- [ ] constraint دیتابیسیِ «دقیقاً یک FK منبع» و مسیر update incremental برای هر serializer/signal اضافه نشده است. migration و اجرای backfill باید نخست با backup و حجم دادهٔ واقعی در staging سنجیده شود.
- [ ] benchmark query/index و اجرای reconcile روی دادهٔ production-like، همراه با تست هم‌زمانی writer و reconcile، برای اثبات مقیاس‌پذیری این index باقی مانده است.

## R4-03 — MediaPicker واحد

- [x] MediaPicker اکنون دقیقاً DTO فعلی Admin (`file`، `original_filename`، `file_size` و alt/caption locale) را مصرف می‌کند؛ search، `mime_type_category` و `status` را به API می‌فرستد و انتخاب پیش‌فرض را به رسانهٔ active محدود می‌کند. backend categoryهای image/video/document را به MIME واقعی ترجمه می‌کند.
- [ ] اتصال MediaPicker به composer و Article editor هنوز انجام نشده است؛ Article editor همچنان placeholder دارد و نباید تا اتصال واقعی، رسانهٔ خارجی یا UUID خام را به content منتشرشده وارد کند.
- [ ] upload واقعی XHR با CSRF/session، progress/retry در مرورگر، keyboard/focus در nested dialog، RTL/LTR و viewportهای هدف هنوز QA نشده‌اند. Docker build تازه همچنان وابسته به رفع proxy محلی است.

## R4-04 — validation و پردازش رسانه

- [x] validation علاوه بر `content_type` ارسالی، signature محتوای JPEG/PNG/GIF/WebP/SVG/PDF/MP4 را کنترل می‌کند، stream را برای hash/storage reset می‌کند و محتوای ناشناخته یا MIME جعلی را رد می‌کند.
- [ ] signature check جای `libmagic`/antivirus، decode کامل image و سیاست مقابله با polyglot را نمی‌گیرد. SVG هنوز sanitize نشده است؛ تا طراحی و آزمون sanitizer یا policy منع SVG، این مسیر باید با review امنیتی جداگانه بسته شود.
- [ ] ایجاد thumbnail/derivative، پردازش async، retry/cleanup storage و benchmark فایل‌های مرزی هنوز وجود ندارد. upload واقعی با session/CSRF، سقف Nginx و storage production نیز باید جداگانه QA شود.

## R5-01 — صف ترجمه

- [x] `GET /api/admin/workflow/translation-status/` اکنون برای Page/Article/CaseStudy، status هر locale، مسیر امن ویرایش و جفت‌فیلدهای واقعیِ قابل‌ترجمه را با ترتیب پایدار می‌دهد. رابط `/admin/workflow` نیز از `adminFetch` با session/CSRF مشترک استفاده می‌کند، فیلدها را کنار هم مقایسه می‌کند و برای locale انتخاب‌شده فقط موارد نیازمند رسیدگی را نشان می‌دهد.
- [ ] endpoint فعلاً حداکثر ۱۰۰ رکورد از هر نوع را در یک پاسخ برمی‌گرداند؛ pagination، filter و sort سمت سرور، شمارش قابل‌مشاهدهٔ truncation و سنجش کارایی روی دادهٔ production-like انجام نشده‌اند.
- [ ] مقایسهٔ این برش فقط فیلدهای top-level تعیین‌کنندهٔ status (عنوان/خلاصه/role/outcome) را می‌بیند؛ blockهای CMS، ArticleBlock و CaseStudyBlock در compare نیستند و نباید تا تعریف قرارداد محدود و آزمون‌شده به پاسخ افزوده شوند.
- [ ] QA واقعی login/session/CSRF، Refresh، خطا و retry، keyboard/focus در dialog، RTL/LTR و viewportهای هدف در `/admin/workflow` لازم است. Docker build تازه نیز تا رفع proxy محلی `127.0.0.1:3067` قابل اثبات نیست.

## R1-05 — پیکربندی سایت

- [x] تست قراردادی API عمومی و اعتبارسنجی لینک/redirect در `backend/tests/test_siteconfig_api.py`
  روی PostgreSQL Compose اجرا شد؛ migration check و `manage.py check` نیز بدون issue گذشتند.
- [x] Footer SSR به `/api/public/site/` متصل شد؛ فقط متن و navigation منتشرشدهٔ CMS را نمایش می‌دهد و در نبود config، محتوای hardcode نشان نمی‌دهد.
- [ ] اتصال Header، metadata SEO و CTA فرانت‌اند به `/api/public/site/` و QA مرورگر در هر دو locale. Header/layout دارای تغییرات مستقل stage‌نشده‌اند و در این برش دست‌نخورده ماندند.
- [x] middleware برای `RedirectRule`‌های active با آزمون 301/302، جلوگیری از loop، مقصد ناسالم و روش غیر GET/HEAD
  در PostgreSQL Compose پیاده و بررسی شد.
- [x] `SiteSettings` اکنون unique singleton constraint در دیتابیس دارد و API در برخورد race، Problem Details 409 بازمی‌گرداند.

## R1-06 — aggregate عمومی

- [x] aggregate `GET /api/public/site/aggregate/` برای Site و Identity با ETag، `Cache-Control` و suppress
  رکوردهای فاقد ترجمهٔ locale درخواست‌شده ساخته و با pytest روی PostgreSQL Compose بررسی شد.
- [x] resource endpointهای تفصیلی Research/Publication به aggregate افزوده شدند؛ اتصال مصرف‌کنندهٔ Frontend باقی است.
- [x] Frontend یک client typed برای aggregate دارد و fallback صفحهٔ SSR Resume، فقط headline منتشرشدهٔ همان locale را مصرف می‌کند؛ در failure یا نبود profile، متن محلیِ خود صفحه حفظ می‌شود.
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
- [x] صفحهٔ مستقل Admin برای `seed-review`، گزارش status/locale ناقص/issueها را بدون نمایش UUID خام نشان می‌دهد، refresh دارد و هیچ action انتشار ندارد.
- [ ] QA واقعی session/CSRF و keyboard در `/admin/seed-review/`، اضافه‌کردن لینک navigation پس از تعیین‌تکلیف shell مشترک، و مرور انسانی locale/privacy پیش از هر انتشار. انتشار گروهی همچنان خارج از این برش است.

## R1-10 — collectionهای CMS

- [x] source/filter/limit/order برای collection محدود شده و API عمومی منابع identity منتشرشده را بدون UUID/raw model
  resolve می‌کند؛ قرارداد با pytest PostgreSQL پوشش داده شد.
- [x] sourceهای Blog/Portfolio و alias `posts` با projection published-only و بدون `id`/status/JSON خام به resolver افزوده شدند؛ renderer SSR فرانت‌اند empty collection را suppress و کارت/لینک locale-safe را نمایش می‌دهد.
- [ ] QA مرورگر با collectionهای واقعی Blog/Portfolio/identity در fa/en، شامل مسیرهای detail، RTL/LTR و حالت empty؛ build production نیز باید با API در دسترس تکرار شود.

## R0-09 — Sentry instrumentation

- [x] initializerهای legacy به `instrumentation.ts`، runtime-specific initializerها و `instrumentation-client.ts` منتقل شدند؛ `onRequestError`، `onRouterTransitionStart` و global error fallback فعال‌اند. build 2026-07-30 دیگر warningهای config قدیمی Sentry را نشان نداد.
- [ ] ارسال خطای آزمایشی از server و client به پروژهٔ واقعی Sentry و تأیید scrub
  شدن payload در dashboard. این کار بدون DSN و دسترسی به پروژهٔ Sentry قابل
  اثبات نیست.
- [ ] اجرای build production با source-map upload در CI؛ build محلی 2026-07-30 پس از compile/type-check در prerender `/fa/about` به‌علت API خاموش (`ECONNREFUSED`) متوقف شد، نه به‌علت Sentry.

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

- [ ] اجرای دوبارهٔ کل collection backend پس از commitهای R1؛ برای سرعت فقط suiteهای متمرکز
  CMS/identity/siteconfig/seed روی PostgreSQL Compose اجرا شدند. اجرای کامل 730/730 مربوط به پیش از این برش‌هاست.

- [ ] ورک‌تری دارای تغییرات گستردهٔ خارج از این برش است. فقط فایل‌های task-owned
  stage و commit می‌شوند؛ build یا تست کامل ممکن است به تغییرات مستقل وابسته باشد.
