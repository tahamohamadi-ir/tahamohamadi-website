# مرجع استخراج قابلیت از نمونه‌های WordPress برای CMS و تجربهٔ مدیریت محتوا

**وضعیت:** مرجع تصمیم‌گیری و اجرای تدریجی
**تاریخ ارزیابی:** 2026-08-08
**نمونه‌های بررسی‌شده:** Divi 5.9 و Phlox Pro Max، به‌همراه بسته‌های دمو و افزونه‌های همراه
**مخاطب:** مالک محصول، طراح تجربهٔ مدیریت، توسعه‌دهندهٔ CMS و تیم QA

---

## 1. خلاصهٔ تصمیم

از نمونه‌های WordPress نباید یک WordPress دیگر بسازیم. ارزش قابل انتقال آن‌ها در این پنج قابلیت است:

1. **ساخت صفحه با آزادی کنترل‌شده:** صفحه از Section و Blockهای تایپ‌شده ساخته شود، نه از HTML، shortcode یا JSON آزاد.
2. **مدیریت محتوا به‌عنوان یک گردش‌کار:** Draft، بازبینی، preview خصوصی، انتشار، زمان‌بندی، آرشیو، revision و بازگردانی.
3. **رسانه به‌عنوان یک دارایی مدیریت‌شده:** انتخاب، اعتبارسنجی، جایگزینی، metadata دوزبانه و دانستن محل استفاده از هر فایل.
4. **سفارشی‌سازی محدود و امن:** presetهای طراحی، تنظیمات هویت سایت، منو، Header/Footer و قالب‌های page-family؛ نه CSS/JS دلخواه مدیر.
5. **انتشار با gate کیفیت:** ترجمه، SEO، دسترس‌پذیری، امنیت، وضعیت رسانه و preview باید پیش از publish بررسی شوند.

برای پروژهٔ فعلی، مسیر درست تکامل تدریجی Composer رابطه‌ای و تایپ‌شدهٔ موجود است. تغییر یک‌باره به page builder آزاد یا ذخیره‌سازی کامل صفحه در JSONB، این مسیر را نقض می‌کند.

> این سند «لیست قابلیت محصول» است، نه مجوز تغییر فناوری یا افزودن dependency. مخزن فعلی Python/Django/DRF و Next.js/React/TypeScript است. قابلیت‌های WordPress فقط زمانی وارد می‌شوند که با قراردادهای typed، CMS relational، امنیت و مسیر اجرای این مخزن سازگار باشند.

---

## 2. روش بررسی و سطح اطمینان

### 2.1 دامنهٔ شواهد

قابلیت‌ها از ساختار و کد محلی نمونه‌ها استخراج شده‌اند، نه از تبلیغات فروش:

- **Divi:** کتابخانهٔ ماژول‌ها، Theme Builder، library، global presets، display conditions، portability، AI app، Cloud و یکپارچگی WooCommerce.
- **Phlox Pro:** قالب‌های Blog/Portfolio، Customizer، گزینه‌های visual-select، Elementor و افزونه‌های بسته‌بندی‌شده، Demo Importer، Header/Footer template و RTL.
- **پروژهٔ فعلی:** Composer، preview، زمان‌بندی Blog، Site Settings، Navigation، media و برنامهٔ CMS V2.

### 2.2 تفسیر شواهد

| برچسب | معنی |
|---|---|
| `تأییدشده در نمونه` | در فایل‌ها یا ساختار بستهٔ Divi/Phlox وجود دارد. |
| `تأییدشده در پروژه` | هم‌اکنون در کد یا قراردادهای پروژه وجود دارد. |
| `پیشنهاد اجرایی` | نتیجهٔ طراحی این ارزیابی است؛ هنوز پیاده‌سازی نشده است. |
| `آینده / نیازمند ADR` | قبل از انتخاب یا پیاده‌سازی به بررسی فنی و تصمیم مکتوب نیاز دارد. |

وجود افزونه در یک bundle به‌معنی نیاز، کیفیت، یا مجازبودن آن برای محصول ما نیست.

---

## 3. وضعیت موجود پروژه و شکاف واقعی

### 3.1 قابلیت‌های پایهٔ تأییدشده

پروژه از صفر شروع نمی‌کند. پایه‌های زیر وجود دارند:

| حوزه | وضعیت فعلی |
|---|---|
| Composer صفحه | registry تایپ‌شدهٔ CMS و renderer React برای blockهای allowlisted وجود دارد؛ پیش‌فرض‌های schema-valid در `block-defaults.ts` نگه‌داری می‌شوند. |
| Collection | منبع‌های Blog، Portfolio و identity با projection published-only و بدون UUID/JSON خام برای blockهای collection موجود است. |
| Preview | preview صفحه با `no-store` و `noindex, nofollow` محافظت می‌شود. |
| انتشار | workflow، revision، preview token و scheduler در appهای Django وجود دارند؛ public فقط projection منتشرشده را می‌بیند. |
| Site customization | نام و tagline دوزبانه، متن‌های footer، لوگو، OG image، preset تم، density و navigation مرتب‌شونده موجود است. |
| رسانه | رسانه status، archive، metadata و alt/caption فارسی و انگلیسی دارد. |
| ایمنی mutation | optimistic locking و audit برای عملیات مهم وجود دارد. |
| دوزبانگی | مسیرهای `/fa` و `/en`، RTL/LTR و منع fallback خاموش، جزء قواعد هسته‌اند. |

### 3.2 شکاف‌هایی که ارزش پرکردن دارند

| شکاف | چرایی | اولویت |
|---|---|---|
| Media Picker مشترک | انتخاب فایل هنوز باید یک تجربهٔ واحد، قابل جست‌وجو و قابل جایگزینی باشد. | P0 |
| Canvas و Inspector کامل | Composer فعلی به تجربهٔ بصری‌تر، library، validation summary و عملیات مدیریت‌شده نیاز دارد. | P0 |
| revision و restore | انتشار حرفه‌ای بدون snapshot، compare و restore امن ناقص است. | P0 |
| Translation freshness | وضعیت «ترجمه عقب‌مانده» باید از تغییر source تشخیص داده شود، نه با حدس کاربر. | P0 |
| autosave محدود + recovery | فقط Draft، با کنترل conflict، offline و validation. | P1 |
| SEO/Accessibility audit | publish باید بتواند نقص metadata، alt، hreflang و ساختار را گزارش کند. | P1 |
| template library | reusable section/page template سرعت تولید محتوا را بالا می‌برد. | P1 |
| global design tokens | سفارشی‌سازی باید از token و preset انجام شود، نه CSS پراکنده. | P1 |
| analytics و آزمایش | فقط پس از تعریف رضایت، حریم خصوصی و سؤال تصمیم‌گیری. | P3 |

---

## 4. قابلیت‌های استخراج‌شده از Divi

### 4.1 صفحه‌ساز و کتابخانهٔ ماژول

Divi یک کتابخانهٔ پرحجم از ماژول‌های صفحه دارد؛ مانند Accordion، Audio، Blog، Breadcrumbs، Button، Contact Form، CTA، Gallery، Heading، Image، Portfolio، Slider، Tabs، Video و ماژول‌های WooCommerce.

**درس قابل استفاده:** catalog محدود، مستند و typed از blockها داشته باشیم. هر block باید:

- schema تنظیمات، schema translation و renderer مشخص داشته باشد؛
- validation سمت سرور داشته باشد؛
- preview و public را از یک projection مشترک تغذیه کند؛
- برای دادهٔ ناشناخته fail closed باشد؛
- فقط media و URL معتبر را بپذیرد؛
- وضعیت دسترس‌پذیری خود، مانند heading level، alt، caption و label را بداند.

**نتیجه:** از library گستردهٔ Divi، «مدل registry» را بگیریم، نه تعداد زیاد widgetها را.

### 4.2 Theme Builder و قالب‌های قابل استفادهٔ مجدد

Divi برای Header، Footer، templateهای اختصاصی و library layout پشتیبانی دارد. این ایده برای سایت شخصی مفید است، اما باید به page-familyهای محدود تبدیل شود:

- Home
- Article و Article listing
- Portfolio case study و listing
- Publication detail و listing
- Resume
- Contact
- Static informational page

هر page-family باید skeleton معنایی، SEO schema، جایگاه H1، بخش‌های مجاز و بلوک‌های سازگار خودش را داشته باشد. مدیر نباید بتواند ساختار ضروری Article یا Portfolio را به صفحه‌ای بدون heading و metadata تبدیل کند.

### 4.3 Global presets و design system

وجود `global-presets` در Divi نشان می‌دهد حفظ زبان بصری با تنظیم تک‌تک عناصر قابل اتکا نیست.

**قابلیت پیشنهادی:**

- tokenهای رنگ، typography، spacing، radius، border و motion؛
- presetهای محدود مثل `EDITORIAL_NAVY`؛
- density جدا برای Admin؛
- variantهای کنترل‌شده برای Button، Card، Section و Media frame؛
- اعمال تغییر preset به‌صورت preview و سپس publish configuration.

**ممنوع:** ویرایش آزاد CSS، JavaScript، HTML یا iframe در Site Settings و blockها.

### 4.4 Display conditions و محتوای پویا

Divi display conditions و module-use detection دارد. ایدهٔ مفید آن این است که نمایش یک block تابع وضعیت محتوایی باشد، نه کد دلخواه.

**شرط‌های قابل قبول در آینده:**

- وضعیت انتشار؛
- بازهٔ زمانی featured content؛
- locale؛
- خالی/غیرخالی‌بودن collection؛
- نوع route و page-family.

**شرط‌های خارج از MVP:** شخصی‌سازی مبتنی بر ردیابی کاربر، آزمایش‌های پنهان یا targetting رفتاری.

### 4.5 Portability و library export/import

Divi برای portability و library layout ابزار دارد. در محصول ما نسخهٔ امن و محدود آن مفید است:

- export/import فقط برای template و sectionهای typed؛
- manifest شامل version، block types، media references و translation completeness؛
- import ابتدا در حالت validation/report؛
- media خارجی بدون انتقال خودکار؛
- rollback و audit برای import؛
- عدم ورود HTML، shortcode، executable payload و schema ناشناخته.

این قابلیت بعد از تثبیت block registry و migrations وارد P2 می‌شود.

### 4.6 AI authoring

نمونهٔ Divi شامل AI app، image editor و کمک تولید متن/کد است. برای محصول ما فقط این کاربردها ارزش بررسی دارند:

- پیشنهاد outline مقاله؛
- پیشنهاد خلاصه، excerpt و SEO metadata؛
- پیشنهاد alt text با تأیید انسان؛
- بررسی اولیهٔ لحن و completeness ترجمه؛
- کمک به تبدیل Markdown به blockهای مجاز.

**خط قرمز:** AI نباید خودکار publish کند، ترجمه را overwrite کند، محتوای invented بسازد یا URL/media ناامن وارد کند. این حوزه نیازمند ADR، کنترل هزینه، رضایت کاربر، retention policy و ثبت provenance است.

---

## 5. قابلیت‌های استخراج‌شده از Phlox Pro

### 5.1 انتخاب تصویری variantهای قالب

Phlox برای Blog، Header، Footer، Portfolio، Slider و layoutها گزینه‌های visual-select دارد؛ برای مثال چندین نوع Blog layout، Header layout، Footer layout و Portfolio grid/masonry/single layout.

**درس قابل استفاده:** انتخاب template و variant باید با thumbnail، نام روشن و preview باشد، نه selectهای مبهم.

**نسخهٔ مناسب ما:**

- 2 تا 4 variant معتبر برای هر page-family؛
- هر variant با mobile/desktop preview؛
- محدودیت آشکار دربارهٔ blockهای سازگار؛
- migration/compatibility note هنگام deprecated شدن variant؛
- fallback امن برای variant نامعتبر.

برای MVP، تعداد variantها باید پایین بماند تا طراحی، تست RTL/LTR و SSR قابل نگهداری باشد.

### 5.2 Demo Importer و onboarding

Phlox یک Demo Importer برای clone سریع دمو دارد. نمونهٔ مناسب برای ما «onboarding محتوایی» است، نه واردکردن یک سایت کامل:

- ایجاد پروژه از template خالی یا نمونهٔ کنترل‌شده؛
- ساخت draftهای اولیه برای Home/Article/Portfolio؛
- checklist شامل translation، media، SEO و preview؛
- عدم انتشار خودکار؛
- قابلیت لغو و گزارش آیتم‌های ساخته‌شده.

در محیط production، import دمو نباید دادهٔ منتشرشده را overwrite کند.

### 5.3 الگوهای محتوایی Blog و Portfolio

Phlox انواع presentation برای post و portfolio دارد: listing، tile، column، grid، masonry، single layout و gallery.

**قابلیت‌هایی که ارزش نگه‌داشتن دارند:**

- featured article/case study؛
- listing قابل فیلتر با taxonomy؛
- related content مبتنی بر taxonomy یا curated list؛
- previous/next navigation؛
- تصویر، نقش، حوزه، تاریخ، زمان مطالعه و summary؛
- gallery یا media frame در case study؛
- ساختار detail برای مسئله، فرایند، تصمیم‌ها، نتیجه و محدودیت‌ها.

**احتیاط:** Masonry، slider و motion فقط وقتی وارد شوند که با محتوای واقعی، keyboard، reduced motion، CLS و mobile QA سازگار باشند.

### 5.4 یکپارچگی افزونه‌ها

Phlox افزونه‌هایی مانند Elementor، WPBakery، Visual Composer، چند Slider، WooCommerce، Wishlist، pricing، portfolio/news و social plugins را در بسته دارد.

این وضعیت یک هشدار معماری است: قابلیت‌های محصول نباید به زنجیره‌ای از pluginها یا rendererهای مستقل وابسته شوند. برای محصول ما هر قابلیت مهم باید مالک domain، قرارداد API، test و سیاست امنیتی روشن داشته باشد.

### 5.5 RTL و localization

وجود stylesheet و customizer RTL در Phlox، اهمیت پشتیبانی native از RTL را تأیید می‌کند. در محصول ما RTL نباید layer جداگانه یا patch پایانی باشد:

- CSS logical properties؛
- تنظیم `lang` و `dir` در document؛
- mirror کردن iconهای جهت‌دار فقط در صورت معنایی‌بودن؛
- نگه‌داشتن identifierهای فنی به‌صورت LTR؛
- preview و visual QA مستقل برای فارسی و انگلیسی؛
- slug، metadata و media alt/caption مستقل برای هر زبان.

---

## 6. catalogue پیشنهادی بلوک‌ها

### 6.1 بلوک‌های هسته (P0)

| Block | کاربرد | تنظیمات کنترل‌شده | نیاز محتوایی/دسترس‌پذیری |
|---|---|---|---|
| Hero | آغاز صفحه | media، alignment، CTAهای داخلی/HTTPS | یک H1، alt، CTA معتبر |
| Rich text | متن توضیحی | Markdown امن، width، tone | heading hierarchy، link policy |
| Media | تصویر/ویدئوی مجاز | asset، crop، caption، focal point در آینده | alt محلی، dimensions |
| Media + text | روایت رسانه‌ای | variant و media position | ترتیب خوانش منطقی |
| CTA | دعوت به اقدام | label، path، variant | label توصیفی و URL امن |
| Collection | نمایش دادهٔ موجود | source، limit، filter و sort allowlist | empty-state بدون اطلاعات داخلی |
| Gallery | مجموعهٔ تصویری | انتخاب رسانه و order | alt/caption و keyboard support |
| Quote | نقل‌قول | quote، attribution، source | semantic quote |
| Divider / Spacer | ریتم صفحه | variant و size محدود | نباید جایگزین heading شود |

### 6.2 بلوک‌های دامنه‌ای (P1)

| Block | کاربرد |
|---|---|
| Skills | توانمندی‌های گروه‌بندی‌شده، بدون progress bar نمایشی |
| Resume | تجربه، تحصیل، پژوهش و evidence |
| Social links | لینک‌های ساختاریافته و مرتب‌شونده |
| Contact | کانال‌های تماس و فرم امن |
| Stats | فقط آمار واقعی، منبع‌دار و قابل نگهداری |
| Publications | citation، DOI/URL معتبر و فایل مجاز |
| Timeline | مسیر زمانی About/Resume با پشتیبانی RTL |
| Reference/Callout | منابع، نکتهٔ مهم یا warning در مقاله |

### 6.3 بلوک‌های آینده و مشروط (P2/P3)

- Accordion/FAQ با schema و JSON-LD کنترل‌شده؛
- Table با headingهای قابل دسترس و نمایش responsive؛
- Code block با syntax highlight سمت renderer و بدون اجرای کد؛
- Embed فقط از allowlist و پس از URL validation؛
- audio/video فقط با سیاست media و caption/transcript؛
- chart/data visualization با description و جایگزین متنی/جدولی؛
- countdown، price table و popup فقط در صورت نیاز محصول واقعی.

### 6.4 بلوک‌ها و قابلیت‌های مردود

- raw HTML، raw JavaScript، arbitrary CSS و shortcode؛
- iframe بدون allowlist؛
- slideshow خودکار و حرکت ضروری برای فهم محتوا؛
- progress bar برای مهارت بدون metric معتبر؛
- fake metric، testimonial یا badge ساختگی؛
- comment system عمومی، ecommerce، wishlist و membership تا زمانی که دامنهٔ محصول تغییر نکرده است.

---

## 7. تجربهٔ صفحه‌ساز پیشنهادی

### 7.1 ساختار Canvas

```text
Page
  └── Section (title اختیاری، sort order، enabled، layout preset)
        └── Block (type، settings typed، enabled، sort order)
              └── Translation (fa یا en، متن و metadata محلی)
```

### 7.2 عملیات لازم

- افزودن Section از library محدود؛
- افزودن Block از catalog فیلترشده بر پایهٔ page-family؛
- duplicate، delete با confirmation، enable/disable و reorder؛
- drag-and-drop همراه حرکت معادل با keyboard؛
- Inspector برای تنظیمات همان block؛
- summary برای validation، translation، media و SEO؛
- dirty guard و نمایش saving/saved/error؛
- دریافت conflict با 409 و امکان reload/compare؛
- preview در هر locale و سه viewport desktop/tablet/mobile؛
- local undo/redo که با save موفق reset می‌شود.

### 7.3 قواعد غیرقابل مذاکره

1. public و preview از registry و projection یکسان استفاده کنند.
2. block ناشناخته در public نمایش داده نشود و در Admin diagnostic داشته باشد.
3. هر block قبل از ذخیره در server validate شود؛ validation سمت React کافی نیست.
4. reorder فقط ترتیب را تغییر دهد و translation یا media reference را از بین نبرد.
5. autosave فقط Draft باشد؛ نباید publish، overwrite conflict یا عبور از validation انجام دهد.
6. هر mutation version دارد و optimistic locking را رعایت می‌کند.

---

## 8. سفارشی‌سازی سایت

### 8.1 موارد مجاز

| قلمرو | قابلیت پیشنهادی |
|---|---|
| هویت | نام، tagline، لوگو، favicon، OG image، footer statement و availability برای هر locale |
| Navigation | label دوزبانه، target path معتبر، external flag، فعال/غیرفعال و sort order |
| Design | preset انتخابی، tokenهای مصوب و density Admin |
| Header/Footer | انتخاب template از library و variant محدود |
| Listings | variant کارت، featured item، limit و sort کنترل‌شده |
| SEO defaults | site name، default image و fallbackهای صریح و locale-aware |

### 8.2 موارد نیازمند ADR

- dark-mode public toggle؛
- font management و بارگذاری font سفارشی؛
- custom domain/tenant؛
- third-party analytics و A/B testing؛
- external storage/S3؛
- AI image/text authoring؛
- import/export عمومی.

### 8.3 موارد ممنوع

- security setting در دسترس Content Editor؛
- injection کد یا tracking script از UI؛
- ویرایش global token بدون preview و audit؛
- cross-locale copying که ترجمهٔ مقصد را overwrite کند.

---

## 9. تولید محتوا و editor مقاله

### 9.1 حداقل تجربهٔ نویسندگی

- عنوان، slug، excerpt، category، tag، cover media و زمان مطالعه؛
- editor با paragraph، heading، list، image، gallery، caption، quote، code، divider، callout و reference؛
- slash command، shortcut، paste cleanup و inline media picker؛
- Markdown import با گزارش تبدیل‌ناپذیرها؛
- preview امن و نمایش همان renderer عمومی؛
- SEO panel و translation panel مستقل؛
- نشان‌دادن validation کنار field و در summary.

### 9.2 مدل محتوای توصیه‌شده

برای مقاله، یک document model versioned پشت adapter نگه‌داری شود. Markdown فعلی باید importable و readable بماند، اما domain نباید به editor vendor وابسته شود. HTML خام یا URL ناامن نه ذخیره و نه render شود.

### 9.3 کنترل کیفیت محتوا

- عنوان و description locale-aware؛
- URL policy برای لینک، media و embed؛
- تصویر meaningful بدون alt نباید publish شود؛
- heading نباید از H1 صفحه عبور کند؛
- canonical و alternate path فقط از قرارداد محتوا بیاید؛
- محتوای خالی، translation ناقص یا media آرشیوشده باید warning/blocker صریح تولید کند.

---

## 10. workflow انتشار و همکاری

### 10.1 state machine هدف

```text
DRAFT → IN_REVIEW → SCHEDULED → PUBLISHED → ARCHIVED
   ↑        ↓              ↓
   └── NEEDS_EDIT ────────┘
```

### 10.2 قواعد transition

| Transition | کنترل لازم |
|---|---|
| Draft → In review | validation پایه، owner و audit |
| In review → Needs edit | reason اجباری و اعلان قابل مشاهده |
| In review/Draft → Scheduled | زمان timezone-aware، permission، validation کامل و job idempotent |
| Scheduled → Published | scheduler، retry، failure log و public-only projection |
| Published → Archived | confirmation، audit و خروج از public/sitemap |
| هر وضعیت → Draft با restore | ایجاد Draft جدید از snapshot؛ نه overwrite مستقیم live content |

### 10.3 revision و restore

- snapshot immutable برای Page، Article و Case study؛
- timeline شامل actor، زمان، نوع mutation و reason؛
- compare ساختاری برای blockها و compare متنی برای translation؛
- restore فقط با ایجاد Draft جدید؛
- revision و restore باید version conflict و audit داشته باشند.

### 10.4 translation freshness

| وضعیت | تعریف |
|---|---|
| Missing | translation وجود ندارد. |
| Incomplete | translation هست اما fieldهای لازم کامل نیستند. |
| Complete | fieldهای لازم، metadata و validation کامل هستند. |
| Outdated | source locale پس از آخرین تأیید مقصد تغییر کرده است. |

تغییر source فقط مقصد را Outdated می‌کند؛ هرگز متن مقصد را خودکار overwrite نمی‌کند.

---

## 11. مدیریت رسانه

### 11.1 Media Library مشترک

Media Picker باید در Site Settings، Page Composer، Blog و Portfolio یکسان باشد و این قابلیت‌ها را داشته باشد:

- grid/list، search، filter type/status، sort و pagination؛
- preview، انتخاب، clear، replace و upload در همان flow؛
- progress، validation، retry، empty state و خطای مجوز/CSRF؛
- alt و caption فارسی/انگلیسی مستقل؛
- media type policy در سطح فیلد مصرف‌کننده؛
- نمایش dimensions، size، MIME و status؛
- usage detail و اثر archive/replace پیش از mutation؛
- orphan report با pagination و filter؛
- archive reversible و منع public rendering دارایی archive‌شده.

### 11.2 سیاست امنیت و کیفیت

- allowlist برای extension و MIME، محدودیت حجم و نام‌گذاری تولیدشده؛
- عدم افشای filesystem path؛
- عدم پذیرش executable؛
- dimension/aspect-ratio policy برای تصاویر public؛
- alt الزامی یا warning قابل‌مشاهده، بر حسب نوع محتوا؛
- محتوا فقط به asset فعال و مجاز reference بدهد.

### 11.3 قابلیت‌های بعدی که باید spike شوند

- focal point؛
- responsive variants؛
- checksum/deduplication؛
- bulk action؛
- storage capacity؛
- pipeline تولید thumbnail/format جدید.

---

## 12. SEO، دسترس‌پذیری، عملکرد و امنیت

### 12.1 publish gate

| دسته | بررسی لازم |
|---|---|
| SEO | title، description، canonical، hreflang، OG، structured data، slug و internal link |
| i18n | locale صحیح، translation status، alternate path و عدم fallback خاموش |
| Media | alt/caption، asset فعال، dimensions و public URL امن |
| Accessibility | H1، heading hierarchy، label، keyboard، contrast، focus و reduced motion |
| Performance | size/media dimensions، lazy-load و budget payload/route |
| Security | URL allowlist، sanitize content، permission، CSRF، optimistic version و audit |

گزارش gate باید بین **warning** و **blocker** تفاوت بگذارد. انتشار نباید با blockerهای امنیتی، محتوای نامعتبر، translation ضروری ناقص یا metadata الزامی ناقص انجام شود.

### 12.2 قابلیت‌های مفید اما مشروط

- Breadcrumb و JSON-LD؛
- related content؛
- RSS؛
- reading progress؛
- search با pagination؛
- analytics privacy-aware؛
- content experiments فقط با رضایت و معیار تصمیم مشخص.

---

## 13. نقش‌ها، audit و dashboard

### 13.1 نقش‌های پیشنهادی

| نقش | اختیار |
|---|---|
| Content Editor | ایجاد/ویرایش Draft، بارگذاری رسانه و ارسال برای review |
| Reviewer | review، Needs edit و تأیید انتشار در محدودهٔ مجاز |
| Publisher | schedule/publish/archive و مشاهدهٔ revision |
| Admin | settings، navigation، template library و مدیریت کاربران محدود |
| Site Owner / Super Admin | تغییرات حساس، policy و restoreهای مهم |

تمام این مجوزها باید در backend enforce شوند؛ route guard رابط کاربری کافی نیست.

### 13.2 dashboard مفید

Dashboard باید action-oriented باشد، نه مجموعه‌ای از آمار تزئینی:

- Draftهایی که نیاز به اقدام دارند؛
- scheduled content نزدیک؛
- ترجمه‌های Missing/Incomplete/Outdated؛
- media upload یا processing ناموفق؛
- SEO/accessibility blockerها؛
- conflictها و تغییرات اخیر؛
- contact messageهای جدید یا خوانده‌نشده.

هر widget باید به یک فهرست فیلترشده و اقدام واقعی منتهی شود.

---

## 14. مرز معماری در محصول فعلی Django + Next.js

این بخش مرزهای واقعی محصول فعلی را خلاصه می‌کند و باید با appهای Django و routeهای Next.js همسو بماند.

```text
Next.js Admin (CSR) ───────┐
Next.js Public (SSR) ──────┼── Django/DRF API ── PostgreSQL
                            │          │
                            │          └── media storage
                            └── Celery / background scheduler
```

### 14.1 اصول معماری

- public rendering باید SSR/Hybrid و crawlable باشد؛ Admin می‌تواند CSR باشد.
- API public فقط محتوای Published را برگرداند.
- API Admin با session امن، CSRF، RBAC، rate limit و audit حفاظت شود.
- database relational و translation-table-based باشد؛ JSON فقط برای settings هر block.
- migrationها forward-only و قابل rollback عملیاتی باشند.
- renderer registry در یک shared contract نگه‌داری شود؛ schema و renderer از هم جدا نشوند.
- background scheduler برای publish زمان‌بندی‌شده idempotent، قابل retry و observable باشد.

### 14.2 aggregates پیشنهادی

```text
ContentPage
  ├── ContentPageTranslation
  ├── PageSection
  │     ├── PageBlock
  │     └── PageBlockTranslation
  ├── ContentRevision
  └── PublishingSchedule

MediaAsset
  ├── MediaAssetTranslation
  └── MediaReference

SiteSettings / SiteSettingsTranslation
NavigationItem / NavigationItemTranslation
```

جزئیات فیلدها باید از قراردادهای پروژه و migrationهای واقعی استخراج شوند؛ این diagram مجوز ساخت endpoint یا فیلد جدید نیست.

### 14.3 مرزهای فنی مهم

- renderer public هرگز payload دلخواه client را قبول نکند؛
- rich content ابتدا parse، سپس sanitize و در یک sink محدود render شود؛
- preview غیرقابل index، غیرقابل cache عمومی و مجاز فقط برای نقش/token درست باشد؛
- token preview کوتاه‌عمر، قابل ابطال و محدود به content و locale باشد؛
- asset archived در public نمایش داده نشود؛
- هیچ secret، URL داخلی، file path یا token در log/response لو نرود.

---

## 15. ترتیب اجرا و definition of done

### Release A — رسانه و پایهٔ نویسندگی (P0)

- Media Picker مشترک؛
- metadata دوزبانه و usage report؛
- validation asset، archive و replace؛
- migration/DTO/test لازم به‌صورت افزایشی.

**Done وقتی است که:** انتخاب رسانه در همهٔ مصرف‌کننده‌ها از یک flow انجام شود و raw asset ID در UI نمایش داده نشود.

### Release B — Canvas Composer (P0)

- Section aggregate؛
- block registry و server-side validation؛
- Canvas، Inspector، add/delete/duplicate/reorder؛
- keyboard reorder، dirty guard، conflict dialog؛
- preview locale/device با renderer مشترک.

**Done وقتی است که:** مدیر بتواند یک Home معتبر را بسازد، بعد از refresh ترتیب حفظ شود، preview با public برابر باشد و keyboard flow کامل کار کند.

### Release C — editor مقاله (P1)

- ADR انتخاب editor؛
- adapter و document model versioned؛
- Markdown import؛
- block catalogue مقاله و inline media؛
- preview/SEO/translation panel.

**Done وقتی است که:** محتوای امن، قابل‌دسترس و SSR-safe نوشته، preview و publish شود.

### Release D — workflow و revision (P0)

- state machine، permission و audit؛
- revision timeline، compare و Draft restore؛
- schedule، retry و failure log؛
- translation freshness و queue.

**Done وقتی است که:** انتشار زمان‌بندی‌شده قابل مشاهده و قابل بازیابی باشد و restore، live content را مستقیم overwrite نکند.

### Release E — template library و customization (P1)

- reusable section/template؛
- visual variant selection؛
- Header/Footer controlled templates؛
- global preset/token، export/import کنترل‌شده.

**Done وقتی است که:** مدیر بتواند بدون CSS/JS آزاد، صفحه‌های منسجم و دوزبانه بسازد.

### Release F — کیفیت و عملیات (P1)

- SEO/accessibility/performance audit؛
- CSP و upload defense؛
- backup/restore و runbook؛
- visual regression برای فارسی/انگلیسی و breakpointهای اصلی.

**Done وقتی است که:** blocker مهم SEO، accessibility و security وجود نداشته باشد و rollback عملی تمرین شده باشد.

---

## 16. ماتریس آزمون حداقلی

| حوزه | سناریوهای ضروری |
|---|---|
| Composer | block نامعتبر، settings نامعتبر، reorder، duplicate، keyboard reorder، 409 conflict، offline autosave |
| Preview | parity با public، locale، viewport، no-store، noindex، token expiry/revocation |
| Media | MIME/type/size، upload failure، unauthorized mutation، pagination، asset in use، archive conflict، alt هر locale |
| Workflow | transition نامعتبر، permission، timezone، retry/idempotency، restore، audit |
| Translation | Missing/Incomplete/Complete/Outdated، تغییر source بدون overwrite مقصد، alternate path |
| Public | فقط Published، SSR، H1، RTL/LTR، empty state و translation unavailable |
| SEO/A11y | canonical/hreflang، schema، missing alt، heading order، keyboard، reduced motion، contrast |
| Security | XSS، URL ناامن، CSRF، RBAC، rate limit، token leakage و file upload attack |

---

## 17. ضدالگوهایی که از WordPress وارد نمی‌کنیم

1. وابستگی به چند page builder یا plugin برای یک قابلیت.
2. ذخیره‌سازی ساختار اصلی محتوا فقط در JSON/shortcode.
3. export/import بدون schema version و validation.
4. custom code در اختیار editor.
5. preview قابل index یا cache عمومی.
6. انتشار محتوا بدون translation/SEO/media gate.
7. تکثیر renderer بین Admin preview و public.
8. widgetهای متعدد اما بدون domain owner، test و نیاز واقعی.
9. slider، animation یا metrics تزئینی که عملکرد و دسترس‌پذیری را تضعیف کنند.
10. fallback مخفی بین فارسی و انگلیسی.

---

## 18. منابع بررسی‌شده در workspace

### نمونه‌های WordPress

- `D:/Project/Taha/tahamohamadi-website/sample/Divi/includes/builder-5/server/Packages/ModuleLibrary/`
- `D:/Project/Taha/tahamohamadi-website/sample/Divi/includes/builder/feature/`
- `D:/Project/Taha/tahamohamadi-website/sample/Divi/includes/theme-builder.php`
- `D:/Project/Taha/tahamohamadi-website/sample/Divi/epanel/theme-options-library/`
- `D:/Project/Taha/tahamohamadi-website/sample/Divi/core/admin/js/portability.js`
- `D:/Project/Taha/tahamohamadi-website/sample/Divi/ai-app/`
- `D:/Project/Taha/tahamohamadi-website/sample/phlox-pro/templates/`
- `D:/Project/Taha/tahamohamadi-website/sample/phlox-pro/auxin/images/visual-select/`
- `D:/Project/Taha/tahamohamadi-website/sample/phlox-pro/auxin-content/include/hooks-admin.php`
- `D:/Project/Taha/tahamohamadi-website/sample/Phlox Pro Max Package/2-Plugins/`

### پروژهٔ فعلی

- `frontend/src/components/admin/composer/`
- `frontend/src/components/admin/media/MediaPicker.tsx`
- `frontend/src/components/blocks/BlockRenderer.tsx`
- `backend/apps/cms/{block_registry,serializers,views}.py`
- `backend/apps/workflow/{preview,services,tasks}.py`
- `backend/apps/siteconfig/{models,serializers,views}.py`
- `docs/planning/development-master-plan.md`
- `docs/012-cms-v2-wordpress-capability-task-list.md`
- `.codex/architecture-rules.md`
- `.codex/security-rules.md`
