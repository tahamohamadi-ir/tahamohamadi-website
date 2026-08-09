# پلن 012: فهرست فنی توسعه و اصلاح CMS V2 بر پایهٔ استخراج قابلیت‌های WordPress

**وضعیت:** مرجع اجراییِ هم‌راستا با Django/Next؛ وضعیت واقعی هر برش در بخش «وضعیت اجرا» و ledger ثبت می‌شود.
**مرجع محصول:** `docs/wordpress-capability-extraction-and-cms-reference.md`
**مرجع اجرای V2:** `docs/planning/development-master-plan.md`
**هدف:** تکمیل تدریجی تجربهٔ مدیریت محتوا، نه ساختن یک WordPress عمومی.
**محدودهٔ فناوری فعلی:** Python/Django + Django REST Framework + PostgreSQL/Django migrations + Next.js/React/TypeScript.
**خارج از دامنه:** مهاجرت فناوری، page builder آزاد، HTML/CSS/JS دلخواه و زنجیرهٔ افزونه‌های WordPress.
**سیاست تحویل سریع:** `docs/governance/fast-track-delivery.md`
**ledger تعویق‌ها:** `docs/status/deferred-validation.md`

---

## 1. قرارداد اجرای این task list

### 1.1 اصول غیرقابل تغییر

- قراردادهای public و admin موجود فقط به‌صورت افزایشی تغییر کنند.
- مدل اصلی محتوا relational و typed بماند؛ JSON فقط برای settings محدود و validate‌شدهٔ blockها است.
- محتوای فارسی و انگلیسی مستقل است؛ هیچ fallback یا overwrite بین‌زبانی مجاز نیست.
- public فقط `PUBLISHED` را ببیند؛ preview محافظت‌شده، غیرقابل cache عمومی و `noindex` باشد.
- تمام mutationهای Admin به session/CSRF/RBAC، optimistic locking و audit متکی باشند.
- public SSR و Admin CSR باقی بمانند.
- فایل‌های sample فقط منبع مطالعه هستند و هرگز dependency یا کد قابل اجرا برای محصول نیستند.

### 1.1.1 نگاشت مسیرهای اجرایی واقعی

نسخهٔ اولیهٔ این task list از یک baseline دیگر منتقل شده بود و نام‌های Spring/Vue در چند بخش آن باقی مانده بود. این نگاشت جایگزین قطعی آن نام‌هاست؛ هیچ task نباید با مسیر یا controller قدیمی اجرا شود.

| موضوع | مسیر/قرارداد واقعی این مخزن |
|---|---|
| backend domain | `backend/apps/<domain>/{models,serializers,services,views,urls_*.py}` |
| migration | `backend/apps/<domain>/migrations/` با Django migrations افزایشی |
| API test | `backend/tests/` یا `backend/apps/<domain>/tests/` با pytest روی PostgreSQL Compose |
| Admin | `frontend/src/app/admin/(dashboard)/` و `frontend/src/components/admin/` با React/TypeScript |
| Public | `frontend/src/app/[locale]/` و `frontend/src/components/blocks/` با Next.js SSR |
| shared API types | `frontend/src/lib/api.ts` و `frontend/src/lib/types/` |

ارجاع‌های تاریخی مانند `.vue`، `backend/src/main/java`، Flyway یا controllerهای Spring در متن‌های قدیمی‌تر این سند، **مسیر هدف نیستند** و باید با این جدول و کد واقعی جایگزین شوند.

### 1.2 تعریف وضعیت taskها

| برچسب | معنی |
|---|---|
| `VERIFY` | قابلیت در کد دیده شده، اما باید با تست/QA تازه اثبات شود. |
| `FIX` | ناسازگاری یا نقص مشخصی دیده شده و اصلاح لازم است. |
| `BUILD` | قابلیت هنوز در قرارداد/کد فعلی دیده نشده و باید در یک vertical slice ساخته شود. |
| `SPIKE/ADR` | قبل از وابستگی، migration یا تغییر قرارداد باید تحقیق فنی و ADR انجام شود. |
| `DEFER` | عمداً خارج از دامنهٔ releaseهای فعلی است. |

### 1.3 گیت مشترک برای هر task

هر task پیش از بسته‌شدن باید این موارد را داشته باشد:

- [ ] فایل‌ها و قراردادهای API/DTO واقعی بررسی شده‌اند؛ endpoint یا field حدسی اضافه نشده است.
- [ ] تغییر backend شامل validation، authorization، audit و test منفی متناسب است.
- [ ] تغییر schema فقط با Django migration افزایشی انجام شده است.
- [ ] تغییر Admin، وضعیت loading/empty/error/conflict و keyboard flow را پوشش می‌دهد.
- [ ] فارسی RTL و انگلیسی LTR با محتوای واقعی کنترل شده‌اند.
- [ ] `git diff --check` بدون خطا است.
- [ ] فقط فایل‌های همان task تغییر کرده‌اند.
- [ ] هر test، QA، security hardening یا ریسکِ آگاهانهٔ به‌تعویق‌افتاده با شناسه، mitigation، owner و trigger بازگشت در `docs/status/deferred-validation.md` ثبت شده است؛ هیچ گیت امنیت، سلامت داده یا انتشار public با این برچسب قابل دورزدن نیست.

---

## 2. تصویر واقعی از قابلیت‌های موجود

این جدول برای جلوگیری از تکرار کار است. «موجود» به‌معنی آماده‌بودن برای release نیست؛ فقط وجود شواهد کد را نشان می‌دهد.

### 2.1 وضعیت فاز ۱ — 2026-08-08

فاز ۱ در برنامهٔ جاری با `R1-01` تا `R1-10` شناخته می‌شود. بررسی inventory نشان می‌دهد scope پیاده‌سازی این موارد در appهای `identity` و `siteconfig`، CMS، routeهای public و Admin React وجود دارد؛ کارهای باقی‌مانده، گیت‌های عملیاتی و انسانی‌اند و نباید به‌عنوان قابلیتِ انجام‌نشده دوباره ساخته شوند.

| گروه | وضعیت توسعه | گیت باقی‌مانده |
|---|---|---|
| R1-01 تا R1-04: identity، سوابق، پژوهش و resume | migration، projection public، CRUD Admin و routeهای SSR موجودند | داده/asset تأییدشده، QA fa/en و دانلود واقعی resume |
| R1-05: Site Settings و navigation | API عمومی/محافظت‌شده، redirect امن، Footer/Header/CTA و metadata ریشهٔ locale مبتنی بر Site Settings منتشرشدهٔ CMS موجود است | QA مرورگر با دادهٔ واقعی در fa/en |
| R1-06: public aggregate | ETag/cache و suppress locale ناقص موجود است | مصرف‌کننده‌های باقی‌مانده و سنجش query/CDN در production |
| R1-07 تا R1-09: CRUD، seed و checklist | قراردادهای Admin، seed idempotent و seed review موجودند | QA session/CSRF/keyboard و مرور انسانی locale/privacy |
| R1-10: CMS collections | source/filter/limit/order محدود و projection بدون UUID خام موجود است | QA collection واقعی fa/en و production build با API در دسترس |

جزئیات، شناسهٔ ریسک، mitigation و trigger هر گیت در `docs/status/deferred-validation.md` مرجع است. هیچ‌کدام از این گیت‌ها با درج وضعیت «پیاده‌سازی‌شده» دور زده نمی‌شوند.

| حوزه | شواهد فعلی | وضعیت کار بعدی |
|---|---|---|
| Media Picker | `components/admin/media/MediaPicker.tsx` دارای جست‌وجو، filter نوع، pagination، upload-in-flow و انتخاب asset فعال است. | VERIFY + یکپارچه‌سازی مصرف‌کننده‌ها |
| Media Library | route `app/admin/(dashboard)/media/page.tsx` upload، metadata، orphan، archive و replace را نمایش می‌دهد. | VERIFY + coverage و QA lifecycle |
| Composer | `components/admin/composer/` شامل canvas، inspector، preview، duplicate، keyboard move و stateهای draft است. | VERIFY + parity/test و تکمیل drag interaction در صورت نیاز |
| Preview Token | `apps.workflow.preview` و serviceهای workflow قرارداد preview را نگه می‌دارند. | VERIFY امنیت و عدم نشت token |
| Page Revisions | `apps.workflow` snapshot و restore-as-draft را نگه می‌دارد. | VERIFY route واقعی و restore |
| Blog Workflow | Blog دارای In Review، schedule، revision، restore-as-draft و translation freshness است. | VERIFY end-to-end + گسترش هم‌سطح به domainهای لازم |
| Translation Queue | `components/admin/workflow/TranslationQueue.tsx` و statusهای Missing/Incomplete/Complete/Outdated وجود دارند. | VERIFY منطق و pagination/scope |
| Article Blocks | `components/admin/editor/` و `components/blocks/article/` برای blockهای پایه وجود دارند. | VERIFY + BUILD catalog و policy کامل |
| Feature flags | flagهای Home V2، Composer Canvas، Article Editor، Portfolio Case Study و Workflow Scheduling وجود دارند. | VERIFY rollout/rollback و configuration docs |

---

## 3. Release 0 — baseline، قراردادها و رفع ناسازگاری قطعی

### T0.1 — baseline و ownership worktree

**نوع:** VERIFY
**هدف:** تعیین دقیق commit مبنا، وضعیت dirty worktree و مالکیت فایل‌ها پیش از هر تغییر کد.

- [ ] `git status --short` و branch فعلی ثبت شود.
- [ ] تغییرهای user-owned از تغییرهای task-owned جدا شوند.
- [ ] نسخه‌های backend/frontend و profileهای اجرای local/staging ثبت شوند.
- [ ] فایل‌های کنترل‌کنندهٔ scope مرور شوند: `AGENTS.md`، `.codex/*-rules.md`، این plan، plan 009 و plan V2 gap-based.
- [ ] برای هر release یک feature flag و rollback owner مشخص شود.

**پذیرش:** هیچ task کدنویسی با worktree نامشخص یا قرارداد نامعلوم شروع نشود.

**وضعیت اجرا — 2026-08-08:**

- [x] branch و وضعیت baseline ثبت شد: `codex/r0-public-page-locale-errors` با worktree بسیار dirty و تغییرهای گستردهٔ خارج از این برش.
- [x] قواعد واقعی Django/Next در `.codex/` و سیاست defer در `docs/governance/fast-track-delivery.md` اضافه شد.
- [x] مرجع‌های Java/Vue در این task list به مسیرهای Django/DRF و Next.js/React نگاشت شدند؛ مسیر تاریخی نباید مبنای تغییر کد باشد.
- [ ] تفکیک کامل ownership برای همهٔ تغییرهای قبلیِ worktree خارج از scope این برش، پیش از هر commit بزرگ باقی است؛ مرجع: `PHASE1-R1-OWNERSHIP-006` در ledger.

### T0.2 — snapshot قراردادهای واقعی

**نوع:** VERIFY
**هدف:** مستندکردن payload/response واقعی پیش از هر اصلاح UI یا backend.

**فایل‌های بررسی:**

- `backend/apps/cms/{serializers,views,urls_admin}.py`
- `backend/apps/media/{serializers,views,urls_admin}.py`
- `backend/apps/blog/{serializers,views,urls_admin}.py`
- `frontend/src/lib/api.ts` و typeهای واقعی Admin/Media مرتبط

- [ ] request/response هر API به fixture تست یا Markdown contract table تبدیل شود.
- [ ] version، validation errors، 401/403، 409 و Problem Details برای هر mutation ثبت شود.
- [ ] locale، pagination bounds، status filter و media typeهای مجاز ثبت شوند.
- [ ] فقط پس از مقایسه با این snapshot قرارداد تغییر کند.

**پذیرش:** تمام تغییرهای بعدی بتوانند compatibility خود را با یک contract test نشان دهند.

### T0.3 — اصلاح ناسازگاری route بازگردانی Page Revision

**نوع:** FIX
**یافتهٔ تاریخی نیازمند بازاعتبارسنجی:** نام route و component این مورد از baseline قبلی آمده است. پیش از هر تغییر باید قرارداد واقعی revision در `backend/apps/workflow/` و صفحهٔ React در `frontend/src/app/admin/(dashboard)/pages/[id]/` بررسی شود؛ endpoint یا نام route جدید حدس زده نشود.

**فایل‌های هدف:**

- `frontend/src/app/admin/(dashboard)/pages/[id]/page.tsx`
- `frontend/src/components/admin/composer/`
- `backend/apps/workflow/{views,services,serializers}.py` (فقط برای تأیید قرارداد؛ endpoint جدید بدون ADR نسازید)
- pytest revision/workflow و test React مناسب برای Page Edit

- [ ] درخواست UI به `restore-as-draft` تغییر کند.
- [ ] `version` فعلی Page به request ارسال شود.
- [ ] UI در پاسخ 409، conflict را نمایش دهد و Draft جدید را فرض نکند.
- [ ] متن confirmation صریحاً بگوید restore، یک Draft جداگانه می‌سازد و نسخهٔ فعلی را overwrite نمی‌کند.
- [ ] test منفی برای route قدیمی و test مثبت برای restore-as-draft با version اضافه شود.

**پذیرش:** Page Edit و Pages list هر دو دقیقاً از یک قرارداد restore استفاده کنند؛ restore نسخهٔ منتشرشده را تغییر ندهد.

### T0.4 — audit مسیرهای duplicate و feature-flag

**نوع:** VERIFY

- [ ] تمام routeهای Admin Page را از `frontend/src/app/admin/` با `backend/apps/cms/` و `backend/apps/workflow/` تطبیق دهید.
- [ ] قابلیت‌های تحت feature flag را با رفتار flag=false و flag=true تست کنید.
- [ ] flagهای پیش‌فرض و متغیرهای configuration در `.env.example` یا config مستند شوند، بدون secret.
- [ ] بررسی کنید flag خاموش هیچ endpoint خصوصی یا navigation مرده‌ای را در public/Admin باقی نمی‌گذارد.

**پذیرش:** هر feature flag یک رفتار روشن، fallback امن و runbook rollback دارد.

---

## 4. Release 1 — Media Library و Media Picker قابل اتکا

### T1.1 — تثبیت policy رسانه در backend

**نوع:** VERIFY

**فایل‌های بررسی:**

- `backend/apps/media/{models,services,serializers,views,urls_admin}.py`
- `backend/apps/media/management/commands/reconcile_media_usage.py`
- `backend/apps/media/tests/` و `backend/tests/` برای policy و public projection

- [ ] allowlist extension/MIME/size را با frontend policy مقایسه کنید.
- [ ] upload executable، MIME جعل‌شده، نام خطرناک و file بزرگ را با test منفی پوشش دهید.
- [ ] response هرگز filesystem path یا storage key خصوصی را افشا نکند.
- [ ] archive، replace و metadata update با optimistic version و audit بررسی شوند.
- [ ] public read برای asset archive/deleted رد شود.

**پذیرش:** policy frontend و server یکسان است و هیچ bypass قابل قبول وجود ندارد.

**وضعیت اجرا — 2026-08-08:**

- [x] allowlist مشترک frontend (`PNG/JPEG/WebP/PDF` و 10/20 MiB) با policy backend به‌صورت ایستا تطبیق داده شد.
- [x] testهای منفی filename خطرناک، MIME/محتوای ناسازگار و فایل بزرگ، و testهای مسیر private/public، version و audit در suite موجودند.
- [x] responseهای admin از `storageKey` خالی نگه داشته شده‌اند و public read تنها asset فعالِ referenced را می‌پذیرد.
- [x] `npm.cmd run test:unit -- test/vitest/__tests__/admin-media-upload.spec.js` با 8 test و `MediaValidationUnitTest` با 5 test عبور کردند.
- [ ] integration testهای Media Upload و QA واقعی upload/replace/archive هنوز به Docker/Testcontainers و session معتبر نیاز دارند؛ مرجع: `CMS-R1-VALIDATION-005` در ledger.

### T1.2 — یک Media Picker واحد برای همهٔ مصرف‌کننده‌ها

**نوع:** VERIFY سپس FIX در صورت مشاهدهٔ مصرف‌کنندهٔ تکراری

**فایل‌های هدف:**

- `frontend/src/components/admin/media/MediaPicker.tsx`
- `frontend/src/app/admin/(dashboard)/media/page.tsx`
- مصرف‌کننده‌های React در `frontend/src/components/admin/` و routeهای Admin
- تمام فرم‌های Site Settings، Page Composer، Blog و Portfolio که media ID می‌گیرند

- [ ] همهٔ انتخاب‌های media با `AdminMediaSelector` یا wrapper تأییدشده انجام شوند.
- [ ] allowed type در سطح field اعمال شود؛ image field نباید PDF بپذیرد.
- [ ] modal باید active asset، query، type filter، pagination، empty، recoverable error و upload progress را نمایش دهد.
- [ ] انتخاب، clear، replace و cancel بدون از‌دست‌رفتن state فرم عمل کنند.
- [ ] UI هیچ UUID خام را به‌عنوان روش انتخاب asset نشان ندهد.

**تست‌ها:** component test برای filter/pagination/multiple/clear و E2E «upload → select → save entity».

**وضعیت اجرا — 2026-08-08:**

- [x] تمام فرم‌های شناسایی‌شدهٔ Settings، Composer، Blog، Portfolio، Publications و Resume از `AdminMediaSelector` استفاده می‌کنند؛ انتخاب UUID خام از لیست Resume و Media Library حذف شد.
- [x] `AdminMediaSelector` type تک‌گزینه‌ای را به query سرور و policy upload منتقل می‌کند؛ `AdminMediaPickerModal` نیز accept/policy یکسان و انتخاب چندگانهٔ واقعی دارد.
- [x] Portfolio و Publication cover و Resume document در backend نیز به‌ترتیب image/image/PDF را الزام می‌کنند؛ test منفی integration افزوده شده است.
- [x] component suite Media Picker با 8 test عبور کرد، از جمله type filter/upload و multiple selection.
- [ ] پوشش عملی pagination/clear در browser و E2E کامل باقی مانده است؛ مرجع: `CMS-R1-VALIDATION-005`.
- [x] `AdminPublicationService` نیز asset فعال غیرتصویری را برای cover در create/update رد می‌کند؛ اجرای HTTP integration هنوز در `CMS-R1-VALIDATION-005` باز است.

### T1.3 — metadata دوزبانه و accessibility رسانه

**نوع:** VERIFY + BUILD اگر نقص policy وجود دارد

- [ ] alt و caption فارسی/انگلیسی در detail رسانه قابل ویرایش و قابل مشاهده باشند.
- [ ] preview در هر locale از alt مناسب همان locale استفاده کند.
- [ ] publish gate برای image meaningful بدون alt تعریف شود: blocker یا warning باید بر اساس content type مشخص باشد.
- [ ] caption نباید جای alt را بگیرد.
- [ ] assetهای decorative باید explicit-marked باشند، نه با alt خالی اتفاقی.

**پذیرش:** تصویر public بدون تصمیم روشن دربارهٔ alt به production نمی‌رود.

**وضعیت اجرا — 2026-08-08:**

- [x] فرم detail رسانه، alt و caption فارسی/انگلیسی را جداگانه نمایش و ویرایش می‌کند؛ caption در API جای alt را نمی‌گیرد.
- [x] Page Builder برای هر تصویر meaningful، alt مستقل فارسی/انگلیسی را در backend الزام می‌کند؛ decorative فقط با `settings.decorative=true` و alt خالی مجاز است. renderer برای تصویر meaningful بدون alt fail-closed است.
- [x] Portfolio gallery به‌صورت قراردادی meaningful است: Admin الصاق/انتشار بدون alt فارسی و انگلیسی را رد می‌کند و public projection فقط alt همان locale را برمی‌گرداند. `CollectionMedia` نیز بدون alt محلی render نمی‌شود؛ logo سایت نام برند CMS را به‌عنوان متن جایگزین دارد.
- [ ] اجرای HTTP integration برای validation gallery و پاسخ locale-specific در Docker/Testcontainers باقی مانده است؛ مرجع: `CMS-R1-VALIDATION-005`.

### T1.4 — usage، replace و archive impact

**نوع:** VERIFY

- [ ] `MediaReferenceService` همهٔ domainهای mediaدار را پوشش دهد: Page blocks، Blog، Portfolio، Site Settings، Featured و Social در صورت استفادهٔ رسانه.
- [ ] قبل از archive/replace، UI usage count و فهرست مصرف‌کننده‌ها را نشان دهد.
- [ ] replace باید type-compatible باشد و بعد از mutation public projection با asset جدید کار کند.
- [ ] archive asset استفاده‌شده confirmation دقیق داشته باشد و شکست conflict را قابل فهم کند.
- [ ] orphan report pagination، filtering و empty state داشته باشد.

**تست‌ها:** media in use، replace incompatible، archive stale version، orphan after reference removal و unauthorized mutation.

**وضعیت اجرا — 2026-08-08:**

- [x] usage index صفحات، Composer، Blog، Portfolio، Publications، Resume و Site Settings را پوشش می‌دهد؛ UI پیش از replace/archive مصرف‌ها را نشان می‌دهد و archive فقط برای orphan فعال است.
- [x] replace در backend هم‌خانوادهٔ MIME را کنترل و referenceها را جایگزین می‌کند؛ version و audit در service وجود دارد.
- [x] orphan endpoint اکنون `PageResponse` پایدار با page/size/query/type/status دارد و پنل Media Library فهرست، pagination و empty state مستقل آن را نمایش می‌دهد.
- [ ] integration testهای mutation/authorization و مشاهدهٔ public projection پس از replace به Docker/Testcontainers و QA واقعی نیاز دارد؛ مرجع: `CMS-R1-VALIDATION-005`.

### T1.5 — spike focal point و responsive variants

**نوع:** SPIKE/ADR

- [ ] با assetهای واقعی نیاز به crop focal point، variant، WebP/AVIF و storage budget را اندازه‌گیری کنید.
- [ ] domain model، migration، cache invalidation و CDN/storage implication را پیش از کدنویسی ثبت کنید.
- [ ] تصمیم «انجام/تعویق» با ADR و rollback note ثبت شود.

**وضعیت اجرا — 2026-08-08:**

- [x] تصمیم تعویق focal point/variant/CDN با trigger بازگشت و rollback note در [ADR-012](../docs/adr/ADR-012-media-variants-and-focal-point.md) ثبت شد.

### تکمیل اجرایی R1 — محتوای نمونهٔ محلی از مسیر CMS

**نوع:** BUILD، فقط توسعه

- [ ] وضعیت واقعی `main` در 2026-08-08: `seed_data` فقط بخشی از identity/siteconfig را به‌صورت draft می‌سازد، اما profile-guard نیست، نمونهٔ رسانه‌دار ندارد و pageهای منتشرشدهٔ قدیمی ایجاد می‌کند؛ این رفتار نباید به‌عنوان محتوای قابل‌انتشار تلقی شود.
- [x] `seed_composer_demo` صریح، idempotent و محدود به `DEBUG=true` برای dataset کاملاً خالی است؛ guard علاوه بر ریشه‌های CMS/identity/siteconfig/portfolio، وجود `ComposerTemplate` یا `ResumeVariant` را نیز رد می‌کند. این فرمان یک صفحهٔ دوزبانهٔ Draft با Hero/Text/Gallery، هویت و تنظیمات سایت Draft، navigation header Draft و یک CaseStudy گالری‌دار Draft ایجاد می‌کند. آزمون متمرکز Compose در 2026-08-08 guard همهٔ ریشه‌ها، refusal، روابط، private بودن public endpoint و idempotence را تأیید کرد.
- [x] دو SVG خنثیِ توسعه‌ای با alt فارسی/انگلیسی به‌صورت MediaAsset فعال ثبت می‌شوند و blockها فقط UUID آن‌ها را نگه می‌دارند، نه URL یا کد frontend.
- [x] راهنمای فرمان، شرط database خالی و منع مطلق production در `scripts/seed/README.md` ثبت شد. QA SSR مرورگر و بازبینی انسانی محتوا/asset هنوز deferred هستند. مرجع: `CMS-DEMO-SEED-010` در ledger.

---

## 5. Release 2 — Composer، Canvas و preview

### T2.1 — contract بخش‌ها و block registry

**نوع:** VERIFY

**فایل‌های هدف:**

- `frontend/src/components/admin/composer/{ComposerCanvas,BlockInspector,PreviewPanel}.tsx`
- `frontend/src/components/blocks/BlockRenderer.tsx`
- `backend/apps/cms/{block_registry,serializers,views}.py`
- DTOهای block/section در همان package

- [x] catalog blockهای frontend با allowlist backend تطبیق داده شود.
- [x] برای هر block، default settings، validation schema، media policy و fields محلی مستند شود.
- [x] settings ناشناخته، block type ناشناخته، ترتیب نامعتبر و media inactive با Problem Details رد شوند.
- [x] public renderer block ناشناخته را fail closed کند و Admin diagnostic نشان دهد.
- [x] composition عادی، template import و restore نسخهٔ Page همگی raw HTML را پیش از ذخیره رد می‌کنند؛ projection عمومی و token preview نیز block تاریخی نامعتبر را fail closed حذف می‌کنند و Text renderer محتوا را فقط به‌شکل متن inert نمایش می‌دهد، نه HTML sink.

**پذیرش:** یک block تنها در صورتی قابل ذخیره است که frontend، server، preview و public renderer آن را بفهمند.

### T2.2 — parity عمومی و preview

**نوع:** VERIFY

- [x] preview token کوتاه‌عمر، content-bound، audit‌شده و بدون cache عمومی باقی مانده است؛ endpoint همان `PublicPageSerializer` با locale/request token را به‌کار می‌گیرد و `no-store`/`noindex` دارد.
- [x] token در پاسخ خطا منتشر نمی‌شود و مسیر endpoint برای token دست‌کاری‌شده، headerهای `no-store` و `noindex` را حفظ می‌کند؛ بررسی live referrer/log/analytics در ledger deferred است.
- [x] preview هر دو locale و desktop/tablet/mobile را با همان projection public می‌خواند؛ fixture رسانه‌دار و blockهای ناشناخته/نامعتبر parity را در آزمون متمرکز تأیید می‌کنند.
- [x] endpoint preview برای token نامعتبر/دست‌کاری‌شده negative test دارد؛ مرورگر guest/session واقعی در ledger deferred است.
- [ ] snapshot visual فارسی/انگلیسی برای blockهای هسته ساخته شود.

**پذیرش:** اختلاف معنی‌دار بین preview و public برای یک fixture یکسان وجود ندارد.

### T2.3 — تعامل Canvas و دسترس‌پذیری

**نوع:** VERIFY + BUILD مشروط

- [x] add/remove/duplicate/reorder section و block با mouse و keyboard قابل انجام باشد.
- [x] بعد از move/duplicate/delete، focus به target منطقی منتقل و با `aria-live` اعلام شود.
- [x] drag handle فعلی فقط زمانی فعال شود که drag-and-drop واقعی، touch-safe و قابل دسترس باشد؛ در غیر این صورت دکمه‌های keyboard مرجع هستند.
- [x] delete confirmation برای block/section destructive داشته باشد.
- [x] Inspector drawer errorهای فیلد را کنار همان field و در Validation Summary نمایش دهد.
- [x] navigation خارج از صفحه با unsaved guard پوشش داده شود.

**تست‌ها:** keyboard-only reorder، focus restoration، duplicate locality، delete confirmation و route leave.

### T2.4 — undo/redo و autosave Draft

**نوع:** VERIFY

- [x] command history فقط mutationهای محلی را ذخیره کند و پس از save موفق reset شود.
- [x] autosave فقط `DRAFT` باشد و debounce مشخص داشته باشد.
- [x] validation failure، offline و 409 conflict نباید دادهٔ remote را overwrite یا publish کنند.
- [x] statusهای pending/saving/saved/error/conflict برای screen reader اعلام شوند.
- [x] بعد از reload رفتار recovery marker و unsaved draft به‌صورت صریح تعیین شود.

**تست‌ها:** rapid edits، stale version، offline، invalid action path، autosave cleanup در unmount و Draft/PUBLISHED تفاوت رفتار.

### T2.5 — library و portable templates

**نوع:** BUILD، بعد از تثبیت T2.1 تا T2.4

- [x] aggregate مستقل `ComposerTemplate` برای snapshot قابل‌حمل ساخته شد؛ import همیشه Page جدید می‌سازد و هیچ Page زنده‌ای را تغییر نمی‌دهد.
- [x] manifest نسخهٔ ۱ شامل sections و مشتقات server-owned برای block typeها، media references و translation completeness است؛ settings از registry موجود اعتبارسنجی می‌شوند و `enabled` اجباری/boolean و `layout` اجباری/non-empty string پیش از ذخیرهٔ template کنترل می‌شوند تا snapshot ذخیره‌شده importable بماند.
- [x] import ابتدا dry-run کاملاً بدون write، حتی بدون AuditEvent، انجام می‌دهد؛ رابط Composer پاسخ دیررس را پس از تغییر manifest/identity دور می‌اندازد و فقط برای fingerprint تأییدشده confirmation را نمایش می‌دهد.
- [x] schema ناشناخته، block/settings نامعتبر، HTML خام، همهٔ URL fieldهای ثبت‌شده (canonical، legacy و animation) و media مفقود/آرشیوشده با Problem Details رد می‌شوند.
- [x] template و Draft واردشده actorهای audit دارند؛ event به content type و UUID واقعی target با action دقیق create/import متصل است، import واقعی در transaction انجام می‌شود و rollback آن atomic است.
- [x] رابط Composer اکنون library ذخیره‌شدهٔ `ComposerTemplate` را از endpoint موجود نمایش می‌دهد، manifest canonical صفحهٔ فعلی را با نام author ذخیره می‌کند و template انتخاب‌شده را فقط به جریان dry-run سپس confirmation import می‌فرستد.

**پذیرش:** template سرعت authoring را بالا می‌برد بدون اینکه ساختار page زنده یا ترجمه‌های مستقل را خراب کند.

---

## 6. Release 3 — Article document و Blog experience

### T3.1 — تثبیت document model و adapter

**نوع:** VERIFY + FIX در صورت عدم تطابق

**فایل‌های هدف:**

- `frontend/src/components/admin/editor/`
- `frontend/src/components/blocks/article/`
- `backend/apps/blog/{models,serializers,views}.py`
- قرارداد Blog admin/public و DTOهای مرتبط

- [ ] document version و block allowlist صریح باشند.
- [ ] import Markdown با گزارش blockهای تبدیل‌نشده انجام شود؛ silent data loss ممنوع است.
- [ ] export Markdown فقط برای blockهای قابل تبدیل تضمین شود؛ برای موارد دیگر warning روشن باشد.
- [ ] adapter، storage domain را از editor UI جدا نگه دارد.
- [ ] HTML خام، JavaScript، URL ناامن و embed غیرمجاز ذخیره یا render نشوند.

### T3.2 — تکمیل catalog مقاله

**نوع:** BUILD

**اولویت catalog:**

- [ ] paragraph و heading با سطح مجاز؛
- [ ] ordered/unordered list؛
- [ ] image از Media Library با alt/caption محلی؛
- [ ] gallery با ترتیب و caption؛
- [ ] quote و attribution؛
- [ ] code با language محدود و render امن؛
- [ ] divider و callout؛
- [ ] reference/link با URL validation.

**تا ADR جداگانه وارد نشود:** video، download، iframe/embed، chart interactive و external rich widget.

### T3.3 — authoring ergonomics و محتوا

**نوع:** BUILD

- [ ] slash command یا command palette فقط برای catalog مجاز.
- [ ] keyboard shortcuts و move controls با focus قابل پیش‌بینی.
- [ ] paste cleanup برای HTML/Office/Markdown.
- [ ] inline media picker؛ بدون تایپ raw media ID.
- [ ] reading time از محتوای واقعی و نه metric ساختگی محاسبه شود.
- [ ] preview امن و public renderer parity برقرار باشد.

### T3.4 — Blog listing/detail و SEO

**نوع:** VERIFY + BUILD شکاف‌های واقعی

- [ ] فیلتر `q`، category و tag از URL state و API موجود استفاده کند.
- [ ] metadata محلی، canonical، hreflang، OG، BlogPosting و published/updated date بررسی شوند.
- [ ] related/previous-next فقط با رابطهٔ مشخص (taxonomy یا curated) نمایش داده شوند.
- [ ] empty، translation unavailable و not-found اطلاعات داخلی نشان ندهند.
- [ ] RSS فقط بعد از قرارداد و feed security review اضافه شود.

---

## 7. Release 4 — Portfolio و Case Study

### T4.1 — domain audit و lifecycle Portfolio

**نوع:** VERIFY

- [ ] CRUD، media references، skill references، status، schedule و public projection Portfolio بررسی شود.
- [ ] `PortfolioScheduledPublisher` برای retry/failure audit/idempotency test شود.
- [ ] دوزبانگی، status translation و publish eligibility با Blog هم‌سطح باشد.
- [ ] public فقط پروژه‌های Published همان locale را ببیند.

### T4.2 — case-study composition

**نوع:** BUILD

- [ ] ساختار content برای statement، role/context، problem، process، decisions، artifacts، outcome، limitations و related work تعریف شود.
- [ ] هر artifact از Media Library و با caption/alt محلی باشد.
- [ ] بخش خالی render نشود.
- [ ] layout variantها محدود، نسخه‌دار و قابل preview باشند؛ Masonry/slider فقط پس از QA performance/a11y.

### T4.3 — Portfolio landing و Home selection

**نوع:** VERIFY + BUILD

- [ ] featured selection، sort و limit domain-owned باشند.
- [ ] cardها نقش، حوزه، نتیجه و media واقعی نمایش دهند؛ fake metric/technology-logo wall ممنوع است.
- [ ] filterها URL-driven، locale-aware، accessible و pagination-bound باشند.
- [ ] Home فقط collection غیرخالی و محتوای approved با media معتبر نمایش دهد.

---

## 8. Release 5 — workflow، revision و translation freshness

### T5.1 — workflow consistency matrix

**نوع:** VERIFY

**Domainها:** Page، Blog، Portfolio، Publication و هر content type publishable موجود.

- [ ] transitionهای DRAFT/IN_REVIEW/SCHEDULED/PUBLISHED/ARCHIVED هر domain فهرست شوند.
- [ ] برای هر transition، role، validation، audit event، optimistic version و public consequence ثبت شود.
- [ ] invalid transition، unauthorized transition و stale version negative test دارند.
- [ ] زمان‌بندی timezone-aware، idempotent و دارای failure visibility باشد.
- [ ] cancel schedule به Draft برگردد و published content را تغییر ندهد.

### T5.2 — revision consistency و restore safety

**نوع:** VERIFY + BUILD برای domainهای فاقد revision

- [ ] Page و Blog revision flow موجود با integration test تازه تثبیت شوند.
- [ ] Portfolio/Publication فقط پس از بررسی مدل واقعی به revision افزوده شوند؛ field حدسی وارد نشود.
- [ ] snapshot immutable، actor/time/reason دار و قابل list/detail باشد.
- [ ] restore همیشه entity/Draft جدید بسازد یا از policy domain پیروی کند؛ live content overwrite نشود.
- [ ] media referenceهای snapshot پیش از restore validate شوند.
- [ ] compare UI تغییرهای ساختاری و متنی را قابل فهم نشان دهد.

### T5.3 — Translation queue و freshness

**نوع:** VERIFY + BUILD برای coverage domainهای لازم

- [ ] منطق Missing/Incomplete/Complete/Outdated در backend domain-owned باشد.
- [ ] تغییر source فقط وضعیت target را Outdated کند؛ copy خودکار ممنوع است.
- [ ] queue باید source locale، آخرین تغییر، checklist fieldها و مسیر edit را نشان دهد.
- [ ] data list bounded/paginated باشد؛ «latest 100» نباید جای paginated API را در مقیاس production بگیرد.
- [ ] public fallback همچنان صریح و locale-owned باقی بماند.

### T5.4 — نقش‌ها و dashboard عملیاتی

**نوع:** SPIKE/ADR سپس BUILD

- [ ] permission matrix Content Editor/Reviewer/Publisher/Admin/Site Owner تدوین شود.
- [ ] role enforcement در backend بررسی شود؛ UI visibility جایگزین authorization نیست.
- [ ] dashboard فقط actionable queueها را نشان دهد: Draft، scheduled، translation issue، media failure، SEO blocker و contact message.
- [ ] هر card/dashboard metric به مسیر انجام کار منتهی شود.

---

## 9. Release 6 — سفارشی‌سازی کنترل‌شده و template system

### T6.1 — Design presets و token governance

**نوع:** VERIFY + BUILD

- [ ] Site Settings فعلی برای brand، logo، OG media، theme preset و density با token system هم‌راستا شود.
- [ ] preset جدید فقط پس از اضافه‌شدن tokenهای semantic، preview و visual QA وارد شود.
- [ ] Typography، spacing، color، radius، border و motion به‌صورت token کنترل شوند.
- [ ] dark-mode public toggle تا QA کامل تمام page familyها DEFER بماند.
- [ ] arbitrary CSS/JS/HTML هرگز به Site Settings اضافه نشود.

### T6.2 — Header/Footer و Navigation templateها

**نوع:** BUILD

- [ ] Header/Footer variantها محدود، semantic و دوزبانه طراحی شوند.
- [ ] Navigation item فقط target path معتبر یا external URL allowlisted بپذیرد.
- [ ] menu ordering، active state، keyboard navigation و mobile drawer برای RTL/LTR تست شود.
- [ ] هیچ template نباید `main#main-content` دوم یا H1 اضافه بسازد.

### T6.3 — visual selector و migration variants

**نوع:** BUILD

- [ ] انتخاب variant با thumbnail، نام، توضیح و preview انجام شود.
- [ ] metadata هر variant شامل version، page-family، compatible blocks و deprecation policy باشد.
- [ ] variant نامعتبر/حذف‌شده fallback امن و diagnostic Admin داشته باشد.
- [ ] هر variant در فارسی/انگلیسی و viewportهای اصلی visual regression داشته باشد.

---

## 10. Release 7 — SEO، Accessibility، Performance، Security و عملیات

### T7.1 — SEO quality gate

**نوع:** BUILD

- [ ] validator برای title، description، slug، canonical، hreflang، OG، structured data و missing alt بسازید.
- [ ] یافته‌ها فقط برای routeهای Published/public گزارش شوند.
- [ ] sitemap/robots هیچ draft، archived، preview، admin یا media خصوصی را افشا نکنند.
- [ ] broken internal link و unsafe URL در Admin گزارش و در publish gate اعمال شوند.
- [ ] schema به content type وصل باشد، نه به block دلخواه.

### T7.2 — Accessibility و visual regression

**نوع:** BUILD

- [ ] keyboard، focus restoration، dialog semantics، status announcements و 44px target در Admin تست شوند.
- [ ] public H1، heading hierarchy، alt، caption، table semantics، contrast و reduced motion بررسی شوند.
- [ ] fixtureهای واقعی fa/en برای page، blog و portfolio تعریف شوند.
- [ ] screenshot regression برای desktop/tablet/mobile و RTL/LTR برقرار شود.

### T7.3 — performance budget

**نوع:** BUILD

- [ ] SSR payload، LCP، CLS، image dimensions و route bundle برای public routeها budget داشته باشند.
- [ ] media below-the-fold lazy-load و responsive size داشته باشد.
- [ ] Admin heavy moduleها (editor/media) route-level lazy-load شوند.
- [ ] module use detection یا معادل آن فقط assets مورد نیاز page را بارگیری کند.

### T7.4 — security و observability

**نوع:** VERIFY + BUILD

- [ ] sanitize Markdown/document model و URL policy با malicious fixture تست شوند.
- [ ] CSP سازگار با SSR/media تعریف و headerها audit شوند.
- [ ] session/CSRF، RBAC، rate limit، preview token، upload defense و log redaction negative test داشته باشند.
- [ ] health/readiness، scheduler failure، media failure و structured error logging قابل مشاهده شوند.
- [ ] backup/restore برای database و media، migration/rollback و incident runbook در staging تمرین شوند.

---

## 11. Release 8 — rollout و stabilization

### T8.1 — rollout تدریجی

- [ ] هر capability بزرگ پشت flag مستقل عرضه شود.
- [ ] ترتیب deploy، migration، backfill، feature enable و rollback ثبت شود.
- [ ] dual-read یا migration compatibility فقط وقتی واقعاً نیاز است طراحی شود.
- [ ] production rollout بدون backup/restore rehearsal انجام نشود.

### T8.2 — sign-off

- [ ] data migration audit؛
- [ ] permission matrix؛
- [ ] public only-published behavior؛
- [ ] fa/en در چهار breakpoint؛
- [ ] no-placeholder media/content؛
- [ ] preview/schedule/revision/restore؛
- [ ] SEO/A11y/Performance gate؛
- [ ] post-deploy smoke و rollback owner.

---

## 12. آیتم‌های عمدیِ defer شده

این موارد فقط در صورت تغییر دامنهٔ محصول وارد backlog می‌شوند:

- WooCommerce، cart، payment، wishlist و محصول فیزیکی؛
- comment system عمومی و حساب کاربری عمومی؛
- plugin marketplace یا page-builder extensibility عمومی؛
- multi-tenant CMS؛
- sliderهای متعدد، popup marketing و animation دائمی؛
- custom script injection؛
- AI publish خودکار، AI overwrite ترجمه و AI image generation بدون ADR؛
- analytics/experiment مبتنی بر tracking بدون تصمیم privacy.

---

## 13. ترتیب پیشنهادی اجرای واقعی

1. T0.1 تا T0.4 — baseline و رفع route mismatch.
2. T1.1 تا T1.4 — رسانه؛ T1.5 فقط spike.
3. T2.1 تا T2.4 — Composer؛ T2.5 بعد از تثبیت registry.
4. T3.1 تا T3.4 — Article/Blog.
5. T4.1 تا T4.3 — Portfolio.
6. T5.1 تا T5.4 — workflow و translation.
7. T6.1 تا T6.3 — customization/template.
8. T7.1 تا T7.4 — quality/operations.
9. T8.1 تا T8.2 — rollout.

هر شماره باید به یک یا چند PR کوچک، قابل review و قابل rollback شکسته شود. یک PR نباید هم‌زمان migration، editor vendor جدید، redesign، scheduler و SEO overhaul را حمل کند.

---

## 14. معیار نهایی تکمیل

این برنامه فقط زمانی کامل است که:

- مدیر بتواند در هر locale محتوا را بسازد، preview کند، برای review بفرستد، زمان‌بندی کند، publish/archive کند و نسخه‌ای را به Draft جدید بازگرداند.
- انتخاب media در همهٔ حوزه‌ها یکپارچه، امن و قابل ردیابی باشد.
- Composer و Article editor دادهٔ typed و validate‌شده تولید کنند و preview/public parity داشته باشند.
- محتوای فاقد translation، SEO، alt یا permission لازم به‌طور صریح block یا warning شود.
- public SSR فقط محتوای Published و locale-owned را نمایش دهد.
- تمام مسیرهای حساس test منفی، audit و rollback قابل اجرا داشته باشند.
- قابلیت‌های اخذشده از WordPress فقط در حد نیاز سایت شخصی، پایدار و قابل نگهداری وارد شده باشند.
