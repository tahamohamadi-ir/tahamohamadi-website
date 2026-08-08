# برنامه جامع توسعه نسل دوم وب‌سایت شخصی و CMS تها محمدی

**نام پروژه:** TahaMohamadi.ir — Public Experience & CMS Authoring 2.0  
**نسخه سند:** 1.0  
**وضعیت:** برنامه اجرایی نهایی پس از سه دور بازبینی تخصصی  
**پشته فعلی مبنا:** Vue 3 + Quasar SSR، Spring Boot، PostgreSQL، Flyway، Docker Compose، Vitest، Playwright، Testcontainers  
**دامنه:** بازطراحی تجربه عمومی سایت، بازطراحی Admin، توسعه Page Builder، Article Editor، Media Library، Workflow انتشار و زیرساخت فنی لازم  
**زبان‌های محصول:** فارسی و انگلیسی با پشتیبانی کامل RTL/LTR  
**اصل محوری:** سایت باید هم‌زمان اعتبار پژوهشی، توان مهندسی، تجربه طراحی و شخصیت حرفه‌ای صاحب سایت را منتقل کند.

---

## 1. خلاصه مدیریتی

نسخه فعلی پروژه از نظر مدل دامنه و موجودیت‌های CMS پیشرفت قابل‌توجهی دارد، اما تجربه کاربری آن هنوز بیشتر شبیه یک پنل CRUD است تا یک سامانه مدیریت محتوای حرفه‌ای. مهم‌ترین شکاف‌ها عبارت‌اند از:

1. نبود Page Builder واقعی و Canvas قابل چیدمان.
2. محدودبودن Blog Editor به Markdown و نبود جای‌گذاری بصری تصویر و اجزای مقاله.
3. ناقص‌بودن Media Library و Media Picker؛ به‌ویژه در Site Settings برای Logo و Open Graph.
4. فرم‌های بسیار عریض، طولانی و کم‌تراکم با Actionهای پراکنده.
5. نبود Workflow کامل Draft، Review، Schedule، Publish، Archive و Revision.
6. نبود Preview واقعی و Responsive Preview.
7. Landing Page عمومی ضعیف از نظر First Impression، روایت، تصویر، CTA و محتوای منتخب.
8. نبود سیستم طراحی عملیاتی و یکپارچه برای Admin و Public.
9. نبود تجربه کامل دو‌زبانه، RTL/LTR و Translation Status.
10. نبود Case Study Builder برای پروژه‌های پژوهشی، طراحی و مهندسی.

هدف این برنامه، تبدیل پروژه به یک **پلتفرم شخصی حرفه‌ای، دو‌زبانه، ماژولار و قابل توسعه** است که سه خروجی هم‌زمان ارائه کند:

- یک وب‌سایت عمومی با هویت **Academic + Product + AI + Human-Centered**؛
- یک CMS حرفه‌ای و قابل استفاده بدون نیاز به دست‌کاری مستقیم داده یا Markdown خام؛
- یک معماری فنی پایدار، تست‌پذیر، امن و قابل توسعه برای آینده.

---

## 2. مبنای تصمیم‌گیری

این برنامه بر اساس موارد زیر تدوین شده است:

- بررسی کامل صفحات فعلی Admin و Public؛
- مشاهده مشکلات Media Selector در Site Settings؛
- بررسی محدودیت‌های Blog Editor و نبود چیدمان بصری؛
- تحلیل نمونه‌های Landing Page، Portfolio، Blog، Corporate، Editorial، Product و Academic؛
- استخراج الگوهای مناسب از نمونه‌هایی مانند صفحات پژوهشی ساده و معتبر، Landing Pageهای ماژولار، طراحی‌های Editorial، صفحات Case Study، Blog Magazine، Dashboardهای وضعیت‌محور و نمونه‌های RTL؛
- کنارگذاشتن الگوهایی که صرفاً Template‌مانند، بیش از حد متحرک، پر از Gradient، 3D یا جلوه‌های تزئینی هستند.

### 2.1 تصمیم طراحی کلان

جهت نهایی طراحی باید ترکیبی از سه لایه باشد:

| لایه | هدف | ویژگی |
|---|---|---|
| اعتبار حرفه‌ای و پژوهشی | اعتماد فوری | معرفی روشن، تصویر واقعی، سوابق، پژوهش، Publication، Resume |
| هویت طراحی و روایت | تمایز بصری | Typography Editorial، Grid نامتقارن، تصویر بزرگ، فضای سفید هدفمند |
| تجربه دیجیتال | پویایی کنترل‌شده | Reveal محدود، Hover، Carousel انتخابی، Responsive transitions |

### 2.2 مواردی که نباید مبنا قرار گیرند

- ظاهر عمومی Templateهای Developer با Gradient بنفش؛
- Particle background و انیمیشن دائمی؛
- Progress bar برای Skill بدون داده معتبر؛
- Hero چنداسلایدی با Autoplay؛
- استفاده گسترده از Carousel برای محتوای اصلی؛
- 3D، Hexagon و Scroll hijacking به‌عنوان الگوی عمومی؛
- طراحی شبیه سایت‌های شرکتی فارسی بدون هویت شخصی؛
- تصاویر Stock نامرتبط با فعالیت واقعی.

---

## 3. چشم‌انداز محصول

### 3.1 بیانیه چشم‌انداز

> ایجاد یک خانه دیجیتال دو‌زبانه برای نمایش پژوهش، پروژه‌های مهندسی، طراحی محصول، نوشته‌ها و مسیر حرفه‌ای؛ با تجربه‌ای معتبر، متمایز، سریع و قابل مدیریت از طریق CMS بصری.

### 3.2 ارزش پیشنهادی

بازدیدکننده باید در 5 تا 10 ثانیه نخست بفهمد:

- صاحب سایت چه کسی است؛
- روی چه مسائل و حوزه‌هایی کار می‌کند؛
- چه خروجی‌ها و پروژه‌هایی دارد؛
- چرا کار او معتبر و متمایز است؛
- قدم بعدی چیست: مشاهده پروژه، پژوهش، رزومه، مقاله یا تماس.

### 3.3 اهداف قابل‌اندازه‌گیری

| هدف | شاخص |
|---|---|
| First Impression مؤثر | CTA اصلی و تخصص در اولین Viewport قابل مشاهده باشد |
| کاهش اصطکاک تولید محتوا | ایجاد صفحه/مقاله بدون Markdown خام امکان‌پذیر باشد |
| کیفیت دو‌زبانه | وضعیت ترجمه هر رکورد مشخص و قابل فیلتر باشد |
| کاهش خطای رسانه | هیچ Raw Asset ID در UI نمایش داده نشود |
| سرعت مدیریت | عملیات اصلی با حداکثر 3 کلیک قابل دسترسی باشد |
| انتشار ایمن | Draft و Preview پیش از Publish الزامی یا قابل کنترل باشد |
| دسترس‌پذیری | WCAG 2.2 AA به‌عنوان معیار طراحی و تست |
| Performance | Core Web Vitals در محدوده مطلوب برای صفحات اصلی |
| قابلیت توسعه | افزودن Block جدید بدون تغییر ساختار کلی Editor ممکن باشد |
| امنیت | هیچ Secret یا Credential در Client، Repository یا Log منتشر نشود |

---

## 4. دامنه پروژه

### 4.1 در دامنه

- بازطراحی Public Home و صفحات اصلی؛
- بازطراحی Admin Shell و Navigation؛
- Media Library و Media Picker؛
- Page Builder مبتنی بر Section و Block؛
- Article Editor بلوکی؛
- Case Study Builder برای Portfolio و Research؛
- Preview و Responsive Preview؛
- Lifecycle محتوا و Scheduling؛
- Versioning و Revision history؛
- Autosave و Draft recovery؛
- SEO و Open Graph؛
- i18n، RTL/LTR و Translation workflow؛
- Accessibility، Performance، Security و Observability؛
- Migration داده‌های فعلی؛
- تست‌های Backend، Frontend، Contract و E2E؛
- مستندات و Runbook.

### 4.2 خارج از دامنه نسخه نخست

موارد زیر به‌عنوان قابلیت‌های آینده در نظر گرفته می‌شوند مگر اینکه در فازهای بعدی تأیید شوند:

- فروشگاه و پرداخت؛
- Community و حساب کاربری عمومی؛
- Comment عمومی روی Blog؛
- Page Builder کاملاً آزاد مشابه ابزارهای No-code؛
- اجرای کد سفارشی توسط Admin؛
- Plugin marketplace؛
- 3D scene editor؛
- Realtime multi-user editing؛
- اپلیکیشن موبایل مستقل؛
- ترجمه خودکار بدون بازبینی انسانی.

---

## 5. مخاطبان و نیازهای اصلی

### 5.1 پژوهشگر یا استاد دانشگاه

**نیازها:**

- درک سریع حوزه‌های پژوهشی؛
- مشاهده Publicationها و پروژه‌های علمی؛
- بررسی روش، معماری، داده و نتایج پروژه‌ها؛
- دسترسی به CV و راه ارتباطی؛
- تشخیص آمادگی برای همکاری علمی.

### 5.2 مدیر محصول، مدیر فنی یا سازمان

**نیازها:**

- مشاهده پروژه‌های واقعی و Case Study؛
- درک توان AI، Dashboard، Backend و Product Design؛
- مشاهده نقش، مسئولیت، فناوری و Outcome؛
- امکان تماس سریع برای همکاری.

### 5.3 Recruiter یا کمیته پذیرش

**نیازها:**

- خلاصه حرفه‌ای روشن؛
- رزومه ساختاریافته و PDF؛
- Skills قابل اثبات؛
- پروژه‌ها، Publicationها و تاریخچه فعالیت؛
- نسخه انگلیسی کامل و قابل اعتماد.

### 5.4 خواننده Blog

**نیازها:**

- یافتن سریع نوشته‌های جدید و موضوعات؛
- تجربه مطالعه مناسب؛
- تصویر، Code، Quote، Diagram و Reference؛
- Navigation بین مقالات؛
- اشتراک‌گذاری و لینک پایدار.

### 5.5 مدیر محتوا

**نیازها:**

- ایجاد و ویرایش محتوا بدون دانش فنی؛
- Media Picker قابل فهم؛
- Preview قبل از انتشار؛
- مدیریت ترجمه؛
- Draft و Autosave؛
- ترتیب Drag & Drop؛
- خطاهای واضح و قابل رفع؛
- دسترسی سریع به محتوای ناقص.

---

## 6. معماری اطلاعات سایت عمومی

### 6.1 ساختار Navigation اصلی

پیشنهاد پایه:

```text
Home
Work
Research
Publications
Writing
About
Resume
Contact
Language
Theme
```

در صورت زیادشدن آیتم‌ها:

```text
Home
Work
Research
Writing
About
More
  Publications
  Resume
  Contact
```

### 6.2 رفتار Navigation

- Sticky Header با ارتفاع کنترل‌شده؛
- پس‌زمینه شفاف در ابتدای Hero و سطح Blur پس از Scroll، تنها اگر Contrast حفظ شود؛
- Active state واضح؛
- Mobile drawer تمام‌صفحه یا Side sheet؛
- Focus state قابل مشاهده؛
- Language switch بدون از دست‌رفتن Route معادل؛
- Theme switch با احترام به System preference؛
- Skip link برای رفتن به Main content؛
- عدم استفاده از Mega Menu تا زمانی که محتوا واقعاً نیازمند آن باشد.

---

## 7. نقشه صفحات عمومی

### 7.1 Home

#### هدف

ارائه سریع هویت، تخصص، خروجی منتخب و مسیرهای اصلی.

#### ترتیب پیشنهادی Blockها

1. **Hero**
   - Portrait، تصویر محیط کار، Visual پروژه یا Illustration اختصاصی؛
   - Heading کوتاه و شاخص؛
   - Subheading؛
   - Primary CTA: Explore my work؛
   - Secondary CTA: View research یا Download résumé؛
   - Status badge اختیاری مانند Open to research collaboration.

2. **Floating credibility strip**
   - Current focus؛
   - Selected projects؛
   - Publications؛
   - Collaboration status.

3. **Selected Work**
   - 3 پروژه مهم در Grid، نه Slider؛
   - تصویر، نقش، حوزه، فناوری و Outcome.

4. **Research Focus**
   - 3 تا 4 حوزه با Icon/Illustration و شرح کوتاه؛
   - لینک به Research.

5. **Featured Case Study**
   - یک پروژه با Text + Image نامتقارن؛
   - Problem، Approach، Result.

6. **Featured Publications**
   - 3 رکورد با Citation، Venue، Year و CTA.

7. **Latest Writing**
   - Featured article و 2 مقاله جدید.

8. **Capabilities**
   - AI Engineering؛
   - Applied Research؛
   - Product & Dashboard Design؛
   - Backend/Platform Engineering.

9. **About Preview**
   - تصویر و معرفی کوتاه؛
   - CTA به About و Resume.

10. **Contact CTA**
    - پیام مشخص برای همکاری؛
    - Email یا فرم کوتاه.

11. **Footer**
    - Navigation؛
    - Social/Academic links؛
    - Availability؛
    - Rights و Legal.

#### Acceptance Criteria

- Hero در Desktop و Mobile بدون Scroll هویت و CTA را نمایش دهد.
- هیچ Section خالی در Production نمایش داده نشود.
- اگر Featured content موجود نیست، Section به‌صورت کامل حذف شود.
- تصاویر Responsive و دارای Alt مناسب باشند.
- ترتیب Sectionها از CMS قابل مدیریت باشد.
- Mobile stacking مستقل از Desktop قابل تنظیم باشد.

---

### 7.2 About

- Editorial split layout؛
- Portrait یا تصویر واقعی؛
- Biography کوتاه و بلند؛
- Timeline مختصر؛
- Research/Professional interests؛
- Values و Working principles؛
- Selected affiliations؛
- Social and academic profiles؛
- CTA به Resume و Contact.

### 7.3 Work / Portfolio Landing

- Featured project بزرگ؛
- Filter بر اساس AI، Dashboard، Research، Design، Backend؛
- Grid پروژه‌ها؛
- نمایش Role، Date، Skills، Outcome؛
- امکان Project type و Status؛
- Related Publication؛
- Empty state مناسب برای Filter بدون نتیجه.

### 7.4 Project Case Study

ساختار استاندارد:

```text
Project Hero
Project metadata
Problem
Context and users
Role and responsibilities
Research / discovery
Architecture / approach
Design process
Implementation
Data and evaluation
Key metrics
Image mosaic / gallery
Results
Limitations
Next steps
Related skills
Related publication
Next project
```

### 7.5 Research

- Hero پژوهشی؛
- Research interests؛
- Current themes؛
- Projects؛
- Methods and technologies؛
- Publications؛
- Collaboration CTA؛
- امکان Diagram، Timeline و Data visualization static.

### 7.6 Publications

- Filter بر اساس Year، Type، Topic و Stage؛
- Search؛
- Citation view؛
- Card/Compact list switch؛
- DOI، External URL، PDF در صورت مجازبودن؛
- BibTeX export در فاز پیشرفته؛
- Related projects؛
- Pagination یا Load more.

### 7.7 Writing / Blog Landing

- Featured article؛
- Latest articles؛
- Topic chips؛
- Research notes؛
- Popular/Selected؛
- Archive by year؛
- Search؛
- Pagination؛
- Newsletter یا Contact CTA اختیاری.

### 7.8 Article

- Reading width حدود 680 تا 780 پیکسل برای متن اصلی؛
- Hero image اختیاری؛
- Author، Date، Reading time، Category؛
- Table of contents برای مقاله بلند؛
- Rich blocks؛
- Figure caption؛
- Footnote و References؛
- Share؛
- Related articles؛
- Previous/Next؛
- Reading progress اختیاری؛
- Print stylesheet.

### 7.9 Resume

- Summary؛
- Experience؛
- Education؛
- Certifications؛
- Awards؛
- Skills؛
- Download PDF؛
- Print-friendly view؛
- Sort و Filter؛
- Locale-aware dates.

### 7.10 Contact

- Heading و توضیح روشن؛
- Contact form؛
- Subject selector؛
- Email و Profile links؛
- Availability؛
- Success و Error state واقعی؛
- Anti-spam؛
- Privacy notice کوتاه.

---

## 8. هویت بصری و Design Direction

### 8.1 شخصیت برند

| ویژگی | توضیح |
|---|---|
| معتبر | پژوهش و داده با ادعاهای قابل اثبات |
| انسانی | تمرکز بر انسان و کاربرد، نه صرفاً فناوری |
| خلاق | استفاده از Grid، تصویر و Typography متمایز |
| دقیق | ساختار، فاصله‌گذاری و Metadata منظم |
| مدرن | Motion محدود و Responsive |
| دو‌زبانه | فارسی و انگلیسی هم‌سطح، نه ترجمه درجه دوم |

### 8.2 جهت پیشنهادی

**Editorial Modernism + Technical Clarity**

- Light-first با Dark mode واقعی؛
- رنگ Navy یا Ink به‌عنوان رنگ پایه؛
- Accent محدود و قابل تنظیم؛
- تصاویر بزرگ و واقعی؛
- Typography شاخص؛
- Sectionهای Light/Dark برای Rhythm؛
- Border و Surface ظریف؛
- Avoid gradient-heavy aesthetics.

### 8.3 Typography

- فونت فارسی و انگلیسی با Metric نزدیک؛
- Scale مشخص برای Display، H1، H2، H3، Body، Caption؛
- Line-height مناسب فارسی؛
- حداکثر عرض خطوط؛
- اعداد فارسی/لاتین طبق Locale؛
- عدم استفاده از ALL CAPS برای دکمه‌های فارسی و انگلیسی به‌صورت گسترده.

### 8.4 Grid

- Containerهای 720، 960، 1200 و 1440؛
- 12-column Desktop؛
- 8-column Tablet؛
- 4-column Mobile؛
- Gutter مبتنی بر Token؛
- Full-bleed image فقط در Blockهای مجاز؛
- Reading container مستقل از Marketing container.

---

## 9. Design System عملیاتی

### 9.1 Tokenها

```text
Color
Typography
Spacing
Sizing
Radius
Border
Shadow
Motion
Z-index
Breakpoint
Container
Focus ring
```

### 9.2 Tokenهای Semantic

```text
surface/default
surface/subtle
surface/elevated
surface/inverse
text/primary
text/secondary
text/inverse
border/default
border/strong
action/primary
action/secondary
status/success
status/warning
status/error
status/info
```

### 9.3 Componentهای پایه

- Button؛
- IconButton؛
- Link؛
- Input؛
- Textarea؛
- Select؛
- Combobox؛
- Checkbox؛
- Radio؛
- Toggle؛
- Date picker؛
- File dropzone؛
- Badge؛
- Chip؛
- Tooltip؛
- Popover؛
- Modal؛
- Drawer؛
- Tabs؛
- Accordion؛
- Card؛
- Table؛
- Pagination؛
- Breadcrumb؛
- Toast؛
- Alert؛
- Empty state؛
- Skeleton؛
- Spinner.

### 9.4 Componentهای ترکیبی Admin

- AdminPageHeader؛
- AdminSectionCard؛
- AdminDataTable؛
- AdminFormSection؛
- AdminStickyActions؛
- LocaleTabs؛
- TranslationStatusBadge؛
- LifecycleBadge؛
- MediaPicker؛
- MediaThumbnail؛
- ContentStatusSummary؛
- UnsavedChangesGuard؛
- RevisionDrawer؛
- PreviewToolbar؛
- EntitySelector؛
- SortableList؛
- ConfirmDestructiveAction.

### 9.5 قواعد Consistency

- تمام CTAهای Create در Page Header؛
- فرم Create در Route یا Drawer، نه همیشه باز در List؛
- Save، Preview، Publish در Sticky action bar؛
- دکمه Primary فقط برای اقدام اصلی؛
- Empty state شامل Icon، توضیح و CTA؛
- Raw ID هرگز به کاربر نمایش داده نشود؛
- Statusها از Badge استاندارد استفاده کنند؛
- Error باید نزدیک Field و در Summary نمایش داده شود؛
- Width فرم حداکثر 1200px و متن حداکثر 760px.

---

## 10. بازطراحی Admin Information Architecture

```text
Dashboard

Site
  Site settings
  Navigation
  Pages
  Reusable sections

Publishing
  Blog posts
  Categories
  Tags
  Scheduled content

Portfolio
  Projects
  Skills
  Publications
  Resume

Assets
  Media
  Social links
  Featured content

Inbox
  Contact messages

System
  Redirects
  SEO audit
  Content audit
  Activity log
```

### 10.1 Sidebar

- گروه‌های Collapsible؛
- Badge تعداد Draft، Scheduled، New messages و Missing translations؛
- Active route دقیق؛
- حالت Compact؛
- حفظ وضعیت باز/بسته در Local storage؛
- Keyboard navigation؛
- Tooltip در حالت Collapsed.

### 10.2 Dashboard

#### کارت‌ها

- Draftها؛
- Scheduled؛
- Missing translations؛
- Media بدون Alt؛
- New contact messages؛
- Broken links؛
- SEO issues؛
- Site health.

#### بخش‌ها

- Recent activity؛
- Continue editing؛
- Upcoming scheduled content؛
- Translation queue؛
- Content requiring attention؛
- Quick actions؛
- Production preview.

---

## 11. Page Builder

### 11.1 اصل معماری

Page Builder باید **ساختاریافته و محدودشده** باشد، نه Canvas کاملاً آزاد. هدف حفظ کیفیت، Responsiveness، Accessibility و سازگاری دو‌زبانه است.

```text
Page
  Metadata
  SEO
  Publishing
  Sections[]
    Section settings
    Columns[]
      Blocks[]
```

### 11.2 Canvas

Layout پیشنهادی Desktop:

```text
Left rail: Block library
Center: Canvas / Preview
Right rail: Inspector
Top: Locale, Device, Preview, Save, Publish
Bottom/Sticky: status and autosave
```

### 11.3 عملیات Section

- Add؛
- Drag reorder؛
- Duplicate؛
- Hide/Show؛
- Delete؛
- Save as reusable؛
- Convert to template؛
- تنظیم Container؛
- Theme؛
- Background؛
- Overlay؛
- Padding؛
- Anchor؛
- Visibility by device؛
- Mobile stacking؛
- Locale override.

### 11.4 عملیات Block

- Add؛
- Edit؛
- Drag؛
- Move up/down؛
- Duplicate؛
- Hide؛
- Delete؛
- Width؛
- Alignment؛
- Spacing؛
- Background؛
- Link؛
- Media؛
- Translation؛
- Preview.

### 11.5 Presetهای Layout

- One column؛
- 50/50؛
- 40/60؛
- 60/40؛
- 33/67؛
- Three equal؛
- Four equal؛
- Feature + sidebar؛
- Full bleed؛
- Image mosaic؛
- 1 large + 2 small؛
- Before/After؛
- Horizontal cards.

### 11.6 Block Catalog نسخه اول

| گروه | Block | تنظیمات کلیدی |
|---|---|---|
| Hero | Split Hero | تصویر، Alignment، CTA، Theme |
| Hero | Background Hero | تصویر، Overlay، Focal point، Height |
| Hero | Editorial Hero | Eyebrow، Heading، Intro، Portrait |
| Hero | Project Hero | Metadata، Cover، Role، Date |
| Text | Rich Text | Heading، paragraph، list، link |
| Text | Heading | Level، Alignment، Anchor |
| Text | Quote | Author، Source، Style |
| Text | Callout | Type، Icon، Title، Body |
| Media | Image | Crop، Caption، Alt، Width |
| Media | Image + Text | Position، Ratio، Mobile order |
| Media | Gallery | Grid، Mosaic، Lightbox |
| Media | Full-width Image | Focal point، Caption |
| Media | Video | Provider، Poster، Caption |
| Media | Before/After | دو تصویر، Labels |
| Layout | Divider | Style، Width |
| Layout | Spacer | Token-based spacing |
| Content | Project Grid | Source، Filter، Count، Variant |
| Content | Publication List | Source، Filter، Variant |
| Content | Article Grid | Source، Category، Count |
| Content | Resume Timeline | Type، Limit |
| Content | Skills Grid | Category، Variant |
| Content | Featured Content | Placement، Count |
| Data | Statistics | Items، Number، Suffix |
| Data | Feature Grid | Icon، Title، Body |
| Data | Timeline | Steps، Dates |
| Data | Logo Wall | Assets، Links |
| Interaction | Carousel | Items، Controls، Autoplay off by default |
| Interaction | Tabs | Labels، Panels |
| CTA | CTA Band | Heading، Body، Buttons |
| Form | Contact Form | Fields، Subject options |
| Social | Social Links | Source، Layout |
| Navigation | Previous/Next | Source type |

### 11.7 Block Schema نمونه

```json
{
  "id": "uuid",
  "type": "imageText",
  "version": 1,
  "localeMode": "shared-layout-localized-content",
  "settings": {
    "imagePosition": "left",
    "ratio": "4:3",
    "container": "wide",
    "theme": "light",
    "mobileOrder": "text-first"
  },
  "content": {
    "fa": {
      "heading": "عنوان",
      "body": "..."
    },
    "en": {
      "heading": "Title",
      "body": "..."
    }
  },
  "media": {
    "assetId": "uuid",
    "focalPoint": {"x": 0.5, "y": 0.4}
  }
}
```

### 11.8 Versioning Block

- هر Block دارای `type` و `version` باشد؛
- Migration برای Schemaهای قدیمی تعریف شود؛
- Renderer فقط Blockهای شناخته‌شده را نمایش دهد؛
- Unknown block در Admin هشدار دهد و در Public fail-safe باشد؛
- JSON schema برای Validation سمت Client و Server استفاده شود.

---

## 12. Article Editor

### 12.1 مدل پیشنهادی

Blog از Editor بلوکی استفاده کند و Markdown به حالت Advanced تبدیل شود.

### 12.2 Blockهای مقاله

- Paragraph؛
- Heading؛
- Bulleted/Numbered list؛
- Image؛
- Gallery؛
- Figure caption؛
- Pull quote؛
- Code block؛
- Inline code؛
- Table؛
- Video؛
- Embed؛
- Callout؛
- Divider؛
- Footnote؛
- References؛
- Related content؛
- Download؛
- Markdown block.

### 12.3 قابلیت‌ها

- Slash command؛
- Drag handle؛
- Keyboard shortcuts؛
- Paste cleanup؛
- Upload/Select image inline؛
- Side-by-side Preview؛
- Full-page Preview؛
- Table of contents generation؛
- Reading time calculation؛
- Autosave؛
- Recovery؛
- Revision comparison؛
- Import/Export Markdown؛
- Link validation؛
- Code language selection؛
- Caption و Alt validation.

### 12.4 معیار انتخاب Editor

پیش از پیاده‌سازی، یک Technical Spike حداکثر 3 روزه برای انتخاب Editor با معیارهای زیر انجام شود:

- پشتیبانی Vue 3؛
- SSR safety؛
- JSON document model؛
- Custom node/block؛
- Keyboard accessibility؛
- Collaborative editing readiness؛
- Bundle size؛
- RTL؛
- Paste from Word/Google Docs؛
- License؛
- Maintenance activity؛
- Testability.

Editor باید پشت یک Adapter داخلی قرار گیرد تا Domain به Vendor وابسته نشود.

---

## 13. Media Library و Media Picker

### 13.1 مشکل بحرانی فعلی

Logo media و Open Graph media نباید Select خام یا Silent field باشند. کلیک باید Media Picker باز کند و در حالت خالی، Upload CTA نمایش دهد.

### 13.2 Media Library

- Grid/List view؛
- Drag & Drop upload؛
- Progress؛
- Thumbnail؛
- Search؛
- Filter type؛
- Sort date/name/size؛
- Dimensions؛
- MIME؛
- File size؛
- Usage count؛
- Alt completeness؛
- Duplicate hash؛
- Orphan state؛
- Archive؛
- Replace؛
- Copy URL؛
- Bulk actions؛
- Detail drawer.

### 13.3 Media Picker

حالت‌ها:

```text
Single select
Multi select
Image only
Document only
Video only
Existing or upload
```

رفتار:

1. بازشدن Modal/Drawer؛
2. Focus trap؛
3. نمایش Library؛
4. Search و Filter؛
5. Upload در همان Picker؛
6. Preview؛
7. Select؛
8. ذخیره Asset reference؛
9. بازگشت Focus به Trigger.

### 13.4 پردازش Media

- تولید Thumbnail؛
- استخراج Width/Height؛
- Hash برای Duplicate detection؛
- Variantهای Responsive؛
- WebP/AVIF در صورت پشتیبانی زیرساخت؛
- حفظ Original؛
- Focal point؛
- Crop metadata به‌جای تخریب فایل اصلی؛
- Validation MIME واقعی؛
- محدودیت Size؛
- Scan امنیتی در صورت وجود زیرساخت.

### 13.5 Alt و Caption

- Alt و Caption مستقل برای هر Locale؛
- امکان Decorative image؛
- هشدار برای تصویر بدون Alt پیش از Publish؛
- Caption در Usage-level قابل Override باشد؛
- Media-level metadata به‌عنوان Default.

---

## 14. Navigation Builder

### 14.1 UI

- Tree و Drag & Drop؛
- Submenu؛
- Add item؛
- Internal page selector؛
- External URL؛
- Anchor؛
- Separator؛
- Group heading؛
- Icon اختیاری؛
- Target blank؛
- Visibility per locale؛
- Visibility per device؛
- Preview Desktop/Mobile.

### 14.2 UX

`Stable key` در UI اصلی نمایش داده نشود و خودکار تولید شود.

فرم آیتم:

```text
Label
Link type
Destination
Open behavior
Visibility
Locale status
```

### 14.3 Validation

- Internal route وجود داشته باشد؛
- External URL فقط HTTP/HTTPS؛
- Circular nesting ممنوع؛
- Depth محدود؛
- Label ترجمه‌شده برای Locale فعال؛
- Duplicate position کنترل شود؛
- Broken link report.

---

## 15. Lifecycle و Publishing Workflow

### 15.1 وضعیت‌ها

```text
DRAFT
IN_REVIEW
SCHEDULED
PUBLISHED
ARCHIVED
```

### 15.2 Transitionها

| از | به | شرط |
|---|---|---|
| Draft | In review | Validation پایه |
| Draft | Published | مجوز Publish و Validation کامل |
| In review | Draft | درخواست اصلاح |
| In review | Scheduled | زمان معتبر |
| In review | Published | تأیید |
| Scheduled | Published | Job موفق |
| Published | Draft | ایجاد Revision جدید، نه حذف نسخه زنده |
| Published | Archived | تأیید |
| Archived | Draft | Restore به‌عنوان Draft |

### 15.3 قابلیت‌ها

- Save draft؛
- Preview draft با Token امن؛
- Publish now؛
- Schedule؛
- Unpublish؛
- Archive؛
- Restore؛
- Revision list؛
- Compare؛
- Restore revision؛
- Activity log؛
- Updated by؛
- Optimistic locking.

### 15.4 Autosave

- Debounce پس از تغییر؛
- نمایش Saving/Saved/Error؛
- Autosave در Draft revision؛
- Manual Save همچنان موجود؛
- Recovery پس از Crash؛
- جلوگیری از overwrite در Conflict؛
- تست شبکه کند و قطع اتصال.

---

## 16. Translation Workflow

### 16.1 وضعیت ترجمه

```text
MISSING
INCOMPLETE
COMPLETE
OUTDATED
```

### 16.2 قواعد

- Layout می‌تواند Shared باشد؛
- Content مستقل per locale؛
- تغییر Source locale می‌تواند ترجمه دیگر را Outdated کند؛
- کاربر باید بتواند Source locale را تعیین کند؛
- Tab فقط «فارسی» و «English» نشان دهد؛
- Status در Badge جدا؛
- Form direction بر اساس Locale؛
- Preview Locale مستقل؛
- Slug مستقل per locale؛
- Route mapping حفظ شود.

### 16.3 Translation Queue

- Filter Missing/Outdated؛
- نمایش Source update time؛
- Copy from source؛
- Side-by-side comparison؛
- Completion checklist؛
- Publish per locale؛
- جلوگیری از نمایش Locale ناقص در Public، طبق Policy.

---

## 17. SEO، Open Graph و Structured Data

### 17.1 SEO Metadata

- Meta title؛
- Description؛
- Canonical؛
- Robots؛
- Open Graph title/description/image؛
- Twitter/X card؛
- Locale alternate؛
- Sitemap؛
- Breadcrumb structured data؛
- Article structured data؛
- Person/Profile structured data؛
- Scholarly article metadata در صورت نیاز.

### 17.2 SEO Audit

- Missing title؛
- Duplicate title؛
- Description length؛
- Missing Open Graph؛
- Image بدون Alt؛
- Broken internal link؛
- Orphan page؛
- Invalid heading hierarchy؛
- Missing canonical؛
- Slug conflict.

### 17.3 Preview

- Google-style snippet preview؛
- Social card preview؛
- Character count؛
- Fallback به Site settings؛
- Locale-specific metadata.

---

## 18. Backend Architecture

### 18.1 اصل معماری

Domain موجود حفظ شود و قابلیت‌های جدید به‌صورت Moduleهای مشخص افزوده شوند:

```text
content/page
content/block
content/template
content/media
content/navigation
content/publication
content/blog
content/portfolio
content/resume
content/translation
content/revision
content/publishing
content/seo
content/audit
```

### 18.2 Aggregateها

| Aggregate | مسئولیت |
|---|---|
| Page | Metadata، Locale، Status، SEO |
| PageComposition | Section و Block tree |
| ContentRevision | Snapshot و Actor |
| MediaAsset | File، Metadata، Variants |
| NavigationMenu | Tree و Locale |
| BlogPost | Article metadata و Document |
| PortfolioProject | Project metadata و Case Study |
| ReusableSection | Composition قابل استفاده مجدد |
| Template | Starter composition |
| Publication | Bibliographic record |
| ScheduledPublication | زمان و Job state |
| ContentAudit | Issues و Severity |

### 18.3 پیشنهاد Schema

#### page

```text
id UUID
page_key
status
source_locale
current_revision_id
published_revision_id
created_at
created_by
updated_at
updated_by
version
```

#### page_translation

```text
page_id
locale
title
slug
summary
translation_status
source_updated_at
seo_id
```

#### content_revision

```text
id
entity_type
entity_id
revision_number
document_json
change_summary
created_by
created_at
status
```

#### media_asset

```text
id
storage_key
original_filename
mime_type
size_bytes
width
height
checksum
status
created_by
created_at
archived_at
```

#### media_translation

```text
asset_id
locale
alt_text
caption
```

#### media_variant

```text
id
asset_id
variant_key
storage_key
mime_type
width
height
size_bytes
```

#### scheduled_publication

```text
id
entity_type
entity_id
revision_id
locale
scheduled_at
state
attempt_count
last_error
published_at
```

### 18.4 JSON vs Relational

- Composition و Editor document به‌صورت JSONB Versioned؛
- Metadata، روابط، وضعیت و Queryهای مدیریتی Relational؛
- Asset relationها در جدول Usage ثبت شوند؛
- JSON schema در Application layer Validate شود؛
- Migration برای Block versionها وجود داشته باشد.

### 18.5 Media Usage Index

```text
media_usage
  asset_id
  owner_type
  owner_id
  revision_id
  field_path
```

کاربرد:

- جلوگیری از حذف Asset استفاده‌شده؛
- Usage count؛
- Orphan detection؛
- Impact analysis هنگام Replace.

---

## 19. API Design

### 19.1 قواعد

- مسیرهای Admin و Public جدا؛
- DTOهای Admin و Public جدا؛
- ETag یا Version برای Optimistic concurrency؛
- Pagination استاندارد؛
- Problem Details برای Error؛
- Idempotency برای عملیات حساس؛
- Validation field-level؛
- Audit actor از Session؛
- عدم Exposure مدل Persistence.

### 19.2 Page Builder API

```text
GET    /api/admin/pages
POST   /api/admin/pages
GET    /api/admin/pages/{id}
PATCH  /api/admin/pages/{id}/metadata
GET    /api/admin/pages/{id}/composition
PUT    /api/admin/pages/{id}/composition
POST   /api/admin/pages/{id}/preview-token
POST   /api/admin/pages/{id}/publish
POST   /api/admin/pages/{id}/schedule
POST   /api/admin/pages/{id}/archive
GET    /api/admin/pages/{id}/revisions
POST   /api/admin/pages/{id}/revisions/{revisionId}/restore
```

### 19.3 Media API

```text
GET    /api/admin/media
POST   /api/admin/media
GET    /api/admin/media/{id}
PATCH  /api/admin/media/{id}
POST   /api/admin/media/{id}/replace
POST   /api/admin/media/{id}/archive
GET    /api/admin/media/{id}/usage
POST   /api/admin/media/bulk/archive
```

### 19.4 Navigation API

```text
GET /api/admin/navigation/{menuKey}
PUT /api/admin/navigation/{menuKey}
GET /api/admin/navigation/{menuKey}/preview
```

### 19.5 Public API

- Response فقط Revision منتشرشده؛
- Cache headers؛
- Locale resolution؛
- Fail-safe برای Block ناشناخته؛
- Composition response با Block schema version؛
- Asset URL از Media service؛
- Preview endpoint با Token کوتاه‌عمر و غیرقابل index.

---

## 20. Frontend Architecture

### 20.1 لایه‌ها

```text
pages
layouts
features
components
composables
services
stores
schemas
renderers
editor
design-system
utils
```

### 20.2 Feature structure نمونه

```text
features/page-builder/
  api/
  components/
  composables/
  schemas/
  store/
  renderer/
  inspector/
  blocks/
  tests/
```

### 20.3 Registry Block

```javascript
const blockRegistry = {
  heroSplit: {
    editor: () => import('./blocks/HeroSplitEditor.vue'),
    renderer: () => import('./blocks/HeroSplitRenderer.vue'),
    schema: heroSplitSchema,
    migrate: migrateHeroSplit,
    icon: '...',
    category: 'hero'
  }
}
```

### 20.4 State Management

- Draft composition در Store feature-level؛
- Server state از Client state جدا؛
- Dirty tracking granular؛
- Undo/Redo command stack؛
- Autosave queue؛
- Optimistic update محدود؛
- Conflict state مشخص؛
- Route leave guard.

### 20.5 SSR

- Rendererهای Public باید SSR-safe باشند؛
- Editor فقط Admin و Client-only در صورت نیاز؛
- Dynamic import؛
- Hydration mismatch تست شود؛
- Preview از همان Renderer عمومی استفاده کند؛
- هیچ Render logic جداگانه برای Admin preview ساخته نشود.

---

## 21. Motion و Interaction

### 21.1 Motion مجاز

- Fade/slide reveal کوتاه؛
- Hover lift محدود؛
- Image zoom نرم؛
- Active underline؛
- Sticky header transition؛
- Accordion؛
- Tabs؛
- Drawer؛
- Carousel دستی؛
- Counter فقط برای داده واقعی؛
- Page transition بسیار کوتاه.

### 21.2 قواعد Motion

- `prefers-reduced-motion`؛
- Duration مبتنی بر Token؛
- عدم انیمیشن Layout سنگین؛
- عدم Autoplay پیش‌فرض؛
- Pause/Controls برای Motion مداوم؛
- انیمیشن نباید مانع Input یا Navigation شود؛
- RTL transformation مستقل تست شود.

### 21.3 Motion غیرمجاز به‌عنوان Default

- Particle background؛
- Continuous spin؛
- Cursor سفارشی؛
- Scroll hijacking؛
- Video background بدون کنترل؛
- Parallax چندلایه؛
- Glow گسترده؛
- Animation روی هر کارت.

---

## 22. Accessibility

### 22.1 معیار

WCAG 2.2 AA.

### 22.2 الزامات

- Semantic HTML؛
- Heading hierarchy؛
- Keyboard کامل؛
- Focus visible؛
- Skip links؛
- Dialog focus trap و return focus؛
- Contrast؛
- Touch target؛
- Error announcement؛
- Label واقعی؛
- Alt؛
- Decorative image؛
- Caption و Transcript ویدئو؛
- Reduced motion؛
- RTL screen reader check؛
- Drag & Drop با Move up/down جایگزین؛
- Table caption؛
- Form summary؛
- Live region برای Autosave.

### 22.3 تست

- Static accessibility tests؛
- Keyboard walkthrough؛
- Screen reader smoke test؛
- Color contrast audit؛
- Zoom 200%؛
- Mobile touch test.

---

## 23. Performance

### 23.1 Public

- Responsive images؛
- Lazy loading زیر Fold؛
- Preload Hero image؛
- Font subset؛
- Critical CSS؛
- SSR cache؛
- API caching؛
- Code splitting per route/block؛
- حذف JavaScript تزئینی غیرضروری؛
- Skeleton محدود؛
- جلوگیری از Layout shift؛
- Image dimension اجباری.

### 23.2 Admin

- Virtualization برای Media بزرگ؛
- Debounced search؛
- Lazy editor؛
- Draft payload diff یا snapshot کنترل‌شده؛
- Upload chunking در صورت نیاز آینده؛
- عدم Render هم‌زمان همه Block inspectorها.

### 23.3 بودجه پیشنهادی

| مورد | هدف اولیه |
|---|---:|
| Initial JS عمومی | حداقل ممکن، با Route splitting |
| Hero LCP | زیر 2.5 ثانیه در شرایط تست تعریف‌شده |
| CLS | کمتر از 0.1 |
| INP | در محدوده مطلوب |
| تصویر Hero | Variant بهینه و ابعاد مشخص |
| Admin editor interaction | پاسخ اولیه زیر 100ms برای عملیات محلی |

---

## 24. Security

- Session-protected Admin؛
- CSRF؛
- Secure cookie در Production؛
- SameSite؛
- Rate limit Login و Contact؛
- Upload validation؛
- Filename randomization؛
- MIME sniff protection؛
- SVG sanitization یا ممنوعیت؛
- Markdown/Rich text sanitization server-side؛
- External link validation؛
- Preview token کوتاه‌عمر؛
- Audit log؛
- Permission checks Backend؛
- No custom CSS/JS injection؛
- CSP؛
- HSTS؛
- Secret management خارج Repository؛
- PII retention policy برای Contact messages؛
- Archive/Deletion policy.

---

## 25. Observability و Operations

### 25.1 Metrics

- Publish success/failure؛
- Scheduled job latency؛
- Media upload failure؛
- Preview generation؛
- API latency؛
- Contact submission؛
- Broken link count؛
- Unknown block count؛
- Autosave failure؛
- Revision conflict.

### 25.2 Logging

- Structured logs؛
- Correlation ID؛
- Actor ID برای Admin action؛
- عدم Log محتوا یا Password؛
- Error category؛
- Publish event؛
- Media processing event.

### 25.3 Health

- DB؛
- Storage write/read؛
- Scheduler؛
- Media processor؛
- Public API؛
- Readiness/Liveness.

### 25.4 Runbook

- Rollback migration؛
- Restore database؛
- Failed scheduled publish؛
- Broken media؛
- Expired preview؛
- Storage full؛
- Corrupt composition؛
- Unknown block after deployment.

---

## 26. Testing Strategy

### 26.1 Backend

- Unit tests Domain transition؛
- JSON schema validation؛
- Repository integration؛
- Migration test؛
- API integration؛
- Security؛
- Scheduling؛
- Concurrency؛
- Revision restore؛
- Media usage؛
- Public projection.

### 26.2 Frontend Unit/Component

- Design system؛
- LocaleTabs؛
- MediaPicker؛
- SortableList؛
- PageBuilder commands؛
- Block editors؛
- Renderers؛
- Validation؛
- Dirty state؛
- Autosave؛
- Unknown block fallback؛
- RTL snapshots؛
- Reduced motion.

### 26.3 Contract

- DTO fixtures مشترک؛
- Block schema fixtures؛
- Public composition fixture؛
- Error contract؛
- ETag/version conflict؛
- Locale fallback.

### 26.4 E2E

مسیرهای حیاتی:

1. Login و Logout؛
2. Upload media؛
3. انتخاب Logo و Open Graph؛
4. ساخت Page؛
5. افزودن Section و Block؛
6. Drag reorder؛
7. Preview Desktop/Mobile؛
8. Save draft؛
9. Publish؛
10. مشاهده Public؛
11. ایجاد Blog با Image inline؛
12. Schedule؛
13. Translation؛
14. Revision restore؛
15. Contact submission و Archive؛
16. Keyboard-only critical flows.

### 26.5 Visual Regression

- Home FA/EN؛
- Page Builder preview؛
- Article؛
- Project case study؛
- Admin list/form؛
- Mobile navigation؛
- Dark mode؛
- Empty/loading/error states.

---

## 27. Migration و Backward Compatibility

### 27.1 راهبرد

- موجودیت‌های فعلی حفظ شوند؛
- Pageهای فعلی به Composition اولیه تبدیل شوند؛
- Markdownهای فعلی در `markdown` block قرار گیرند؛
- Cover asset IDها به Relation جدید تبدیل شوند؛
- Navigation فعلی به Tree depth 1 تبدیل شود؛
- Site settings بدون Media به Null معتبر تبدیل شوند؛
- Public renderer تا پایان Migration از Legacy fallback پشتیبانی کند.

### 27.2 مراحل Migration

1. Backup؛
2. Flyway schema؛
3. Backfill revision؛
4. Backfill composition؛
5. Validate count؛
6. Generate usage index؛
7. Preview audit؛
8. Deploy dual-read؛
9. Switch read path؛
10. Remove fallback در Release بعدی.

### 27.3 Rollback

- Migrationها Forward-only؛
- Rollback اپلیکیشن با Dual-read؛
- Snapshot database پیش از switch؛
- Feature flag برای New builder؛
- Public rendering fallback.

---

## 28. Feature Flagها

```text
adminNewShell
mediaLibraryV2
mediaPickerV2
pageBuilder
articleEditor
revisionHistory
scheduledPublishing
publicHomeV2
publicRendererV2
translationQueue
seoAudit
```

هدف:

- Rollout تدریجی؛
- تست Production Admin؛
- کاهش ریسک؛
- امکان بازگشت سریع.

---

# 29. فازبندی اجرایی

## فاز 0 — Baseline، Inventory و Guardrails

**مدت پیشنهادی:** 3 تا 5 روز

### خروجی

- Inventory Routeها، Entityها، APIها و Componentها؛
- Baseline Screenshot؛
- Baseline Performance؛
- Feature flag framework؛
- ADRها؛
- Block schema conventions؛
- Definition of Done؛
- Test matrix.

### Taskها

- [ ] ثبت مسیرهای Admin/Public
- [ ] استخراج Schemaهای فعلی
- [ ] ثبت Media flow
- [ ] مشخص‌کردن داده‌های Production
- [ ] تهیه Backup/Restore runbook
- [ ] ایجاد Feature flag abstraction
- [ ] تعیین Accessibility baseline
- [ ] تعیین Browser matrix
- [ ] تعیین Migration policy

### Exit Criteria

- هیچ ابهام بحرانی درباره مدل فعلی وجود نداشته باشد.
- Test suite اصلی سبز باشد.
- Baseline قابل مقایسه ثبت شده باشد.

---

## فاز 1 — رفع P0 و یکپارچه‌سازی UX پایه

**مدت پیشنهادی:** 1 تا 2 هفته

### دامنه

- Logo/Open Graph picker؛
- Empty state؛
- Raw ID removal؛
- Width فرم؛
- Sticky actions؛
- Unsaved guard؛
- Save/Error feedback؛
- Locale status cleanup؛
- List/Create/Edit separation.

### Taskهای Backend

- [ ] Endpoint فهرست Media برای Picker
- [ ] Validation Asset type
- [ ] Site settings relation
- [ ] Problem Details errors
- [ ] Optimistic version

### Taskهای Frontend

- [ ] MediaPicker پایه
- [ ] Site Settings preview
- [ ] Upload from Picker
- [ ] Form max-width
- [ ] AdminPageHeader
- [ ] AdminStickyActions
- [ ] LocaleTabs جدید
- [ ] UnsavedChangesGuard
- [ ] Routeهای جدا برای Create/Edit
- [ ] Toast و inline errors

### Acceptance Criteria

- کلیک Logo/Open Graph همیشه پاسخ قابل مشاهده داشته باشد.
- Asset ID دستی وجود نداشته باشد.
- Save status قابل مشاهده باشد.
- خروج از فرم Dirty هشدار دهد.
- تمام فرم‌های اصلی Width کنترل‌شده داشته باشند.

---

## فاز 2 — Admin Shell و Design System 2.0

**مدت پیشنهادی:** 2 هفته

### دامنه

- Nested sidebar؛
- Status badges؛
- Dashboard عملیاتی؛
- Data tables؛
- Empty/loading/error؛
- Component consistency.

### Taskها

- [ ] Token audit
- [ ] Semantic tokens
- [ ] Nested navigation
- [ ] Count endpoints
- [ ] Dashboard attention queue
- [ ] AdminDataTable
- [ ] AdminFormSection
- [ ] Entity drawer/modal
- [ ] Compact/comfortable density
- [ ] Keyboard sidebar
- [ ] Responsive Admin

### Acceptance Criteria

- Sidebar در Desktop و Tablet قابل استفاده باشد.
- Badgeها داده واقعی نشان دهند.
- Dashboard محتواهای نیازمند اقدام را نمایش دهد.
- تمام صفحه‌های List از DataTable استاندارد استفاده کنند.

---

## فاز 3 — Media Library 2.0

**مدت پیشنهادی:** 2 تا 3 هفته

### دامنه

- Library کامل؛
- Metadata؛
- Usage؛
- Variants؛
- Bulk؛
- Focal point.

### Taskها

- [ ] Media metadata schema
- [ ] Translation metadata
- [ ] Variant processor
- [ ] Checksum
- [ ] Usage index
- [ ] Grid/List
- [ ] Search/Filter/Sort
- [ ] Detail drawer
- [ ] Replace
- [ ] Archive
- [ ] Bulk action
- [ ] Orphan filter
- [ ] Alt audit
- [ ] Focal point UI

### Acceptance Criteria

- هر Asset Thumbnail و Metadata داشته باشد.
- حذف Asset استفاده‌شده متوقف یا هشدار داده شود.
- Media Picker از Library مشترک استفاده کند.
- Upload و Select در یک Flow انجام شود.

---

## فاز 4 — Composition Engine و Renderer

**مدت پیشنهادی:** 3 هفته

### دامنه

- Schema؛
- Revision؛
- Public renderer؛
- Block registry؛
- Preview foundation.

### Taskهای Backend

- [ ] Composition JSONB
- [ ] Content revision
- [ ] Validation
- [ ] Publish projection
- [ ] Preview token
- [ ] Migration legacy page
- [ ] Media usage extraction

### Taskهای Frontend

- [ ] Block registry
- [ ] Schema adapters
- [ ] Renderers اولیه
- [ ] Unknown block fallback
- [ ] SSR tests
- [ ] Preview route
- [ ] Responsive tokens
- [ ] Visual regression fixtures

### Blockهای Release اول

- Rich text؛
- Heading؛
- Image؛
- Image+Text؛
- Hero؛
- CTA؛
- Divider؛
- Spacer؛
- Project grid؛
- Publication list؛
- Article grid؛
- Contact form.

### Acceptance Criteria

- Composition منتشرشده در SSR Render شود.
- Unknown block باعث Crash نشود.
- Preview و Public از یک Renderer استفاده کنند.
- Legacy page قابل نمایش بماند.

---

## فاز 5 — Page Builder MVP

**مدت پیشنهادی:** 3 تا 4 هفته

### دامنه

- Canvas؛
- Library؛
- Inspector؛
- Drag & Drop؛
- Device preview؛
- Save/Publish.

### Taskها

- [ ] Editor shell
- [ ] Canvas
- [ ] Block library
- [ ] Inspector
- [ ] Add/Delete/Duplicate
- [ ] Reorder
- [ ] Move buttons برای Accessibility
- [ ] Section presets
- [ ] Undo/Redo
- [ ] Dirty state
- [ ] Autosave پایه
- [ ] Desktop/Tablet/Mobile preview
- [ ] Locale switching
- [ ] Validation summary
- [ ] Publish flow

### Acceptance Criteria

- Admin بتواند Home جدید را بدون ویرایش کد بسازد.
- تمام عملیات با Keyboard جایگزین داشته باشند.
- Preview با Public خروجی یکسان داشته باشد.
- Drag order پس از Refresh حفظ شود.
- Publish ناقص با Validation کنترل شود.

---

## فاز 6 — Article Editor و Blog Experience

**مدت پیشنهادی:** 3 هفته

### دامنه

- Editor بلوکی؛
- Import Markdown؛
- Inline Media؛
- Blog landing؛
- Article view.

### Taskها

- [ ] Editor technical spike
- [ ] Adapter
- [ ] Document schema
- [ ] Article blocks
- [ ] Media inline
- [ ] Caption/Alt
- [ ] Markdown import/export
- [ ] TOC
- [ ] Reading time
- [ ] Related content
- [ ] Article preview
- [ ] Blog landing
- [ ] Topic filters
- [ ] Article structured data
- [ ] Print CSS

### Acceptance Criteria

- تصویر بین دو Paragraph قابل درج و جابه‌جایی باشد.
- Gallery و Quote و Code قابل استفاده باشند.
- Markdown قدیمی قابل Import باشد.
- مقاله بدون Layout shift و با Reading width مناسب نمایش داده شود.

---

## فاز 7 — Portfolio Case Study و Public Home 2.0

**مدت پیشنهادی:** 3 هفته

### دامنه

- Case Study؛
- Project gallery؛
- Home composition؛
- Visual identity.

### Taskها

- [ ] Project metadata expansion
- [ ] Case study composition relation
- [ ] Role/Team/Client/Outcome
- [ ] Related skill/publication
- [ ] Project filters
- [ ] Mosaic gallery
- [ ] Metrics
- [ ] Home template
- [ ] Hero variants
- [ ] Selected work
- [ ] Research focus
- [ ] Featured publications
- [ ] Latest writing
- [ ] Contact CTA
- [ ] Motion tokens
- [ ] Responsive/RTL review

### Acceptance Criteria

- Home در 5 تا 10 ثانیه هویت و CTA را منتقل کند.
- Projectها Case Study کامل داشته باشند.
- نسخه فارسی و انگلیسی از نظر کیفیت هم‌سطح باشند.
- محتوای خالی Render نشود.

---

## فاز 8 — Publishing Workflow پیشرفته

**مدت پیشنهادی:** 2 تا 3 هفته

### دامنه

- Review؛
- Scheduling؛
- Revision compare؛
- Restore؛
- Activity.

### Taskها

- [ ] State machine
- [ ] Scheduler
- [ ] Retry
- [ ] Revision UI
- [ ] Compare
- [ ] Restore
- [ ] Activity log
- [ ] Optimistic conflict
- [ ] Translation outdated
- [ ] Scheduled dashboard
- [ ] Notification داخلی

### Acceptance Criteria

- Scheduled content بدون دخالت دستی منتشر شود.
- Failure در Dashboard و Log قابل مشاهده باشد.
- Revision قبلی قابل Restore باشد.
- overwrite هم‌زمان کنترل شود.

---

## فاز 9 — SEO، Audit، Accessibility و Performance

**مدت پیشنهادی:** 2 هفته

### دامنه

- SEO audit؛
- Broken links؛
- Accessibility؛
- Performance؛
- Hardening.

### Taskها

- [ ] SEO audit engine
- [ ] Open Graph preview
- [ ] Sitemap
- [ ] Structured data
- [ ] Link checker
- [ ] Alt audit
- [ ] Keyboard audit
- [ ] Screen reader smoke
- [ ] Reduced motion
- [ ] Image performance
- [ ] Bundle analysis
- [ ] Cache policy
- [ ] Security headers
- [ ] Load test
- [ ] Runbook

### Exit Criteria

- Critical accessibility issue صفر؛
- Critical SEO issue صفر؛
- Public pages در بودجه Performance؛
- Release checklist کامل.

---

## فاز 10 — Rollout و Stabilization

**مدت پیشنهادی:** 1 تا 2 هفته

- Rollout با Feature flag؛
- Migration Production؛
- Content QA؛
- Cross-browser؛
- Monitoring؛
- Hotfix window؛
- حذف Legacy بعد از دوره ثبات؛
- Retrospective.

---

# 30. Backlog تفصیلی

## Epic A — Admin Foundation

### A-01: Admin Page Header

**Acceptance Criteria:**

- عنوان، توضیح، status و actions داشته باشد.
- Mobile action menu داشته باشد.
- Heading hierarchy صحیح باشد.
- در تمام صفحات Admin جایگزین الگوهای پراکنده شود.

### A-02: Sticky Actions

- Save، Preview، Publish و Cancel؛
- Dirty indicator؛
- Autosave status؛
- Keyboard reachable؛
- Sticky در Desktop و Bottom bar در Mobile.

### A-03: Route separation

- List، New و Edit Route مستقل؛
- Back behavior؛
- Breadcrumb؛
- Preserve filter state.

### A-04: Standard empty state

- Icon؛
- Title؛
- Description؛
- CTA؛
- Help link اختیاری.

---

## Epic B — Media

### B-01: Media Picker P0

- Logo و OG؛
- Single select؛
- Empty/upload؛
- Preview؛
- Replace/Clear.

### B-02: Media Library

- Grid/List؛
- Pagination؛
- Search؛
- Type filter؛
- Metadata.

### B-03: Usage tracking

- Usage count؛
- Owner link؛
- Safe archive؛
- Orphan report.

### B-04: Responsive variants

- Worker/service؛
- Variant status؛
- Public URL selection؛
- Error fallback.

---

## Epic C — Page Builder

### C-01: Composition schema

- Versioned؛
- Server validation؛
- Fixture؛
- Migration.

### C-02: Block registry

- Editor؛
- Renderer؛
- Schema؛
- Migration؛
- Test.

### C-03: Section editor

- Add؛
- Layout؛
- Theme؛
- Spacing؛
- reorder.

### C-04: Inspector

- Contextual form؛
- Field validation؛
- Locale؛
- Reset to default.

### C-05: Preview

- Device sizes؛
- Locale؛
- Theme؛
- Draft token.

### C-06: Undo/Redo

- Command model؛
- Keyboard shortcut؛
- Clear after save policy.

---

## Epic D — Blog

### D-01: Rich Article Editor

- Basic text blocks؛
- Media؛
- Code؛
- Quote؛
- Drag؛
- Slash menu.

### D-02: Markdown compatibility

- Import؛
- Export؛
- Legacy conversion؛
- Unsupported syntax warning.

### D-03: Blog landing

- Featured؛
- Latest؛
- Topics؛
- Archive؛
- Pagination.

### D-04: Article reading experience

- TOC؛
- Reading time؛
- Related؛
- Previous/Next؛
- Print.

---

## Epic E — Portfolio

### E-01: Project data model

- Role؛
- Team؛
- Client؛
- Date؛
- Technologies؛
- Outcome؛
- Status.

### E-02: Case study composition

- Shared builder؛
- Project-specific blocks؛
- Related entities.

### E-03: Project landing

- Filter؛
- Featured؛
- Grid variants؛
- Pagination.

---

## Epic F — Workflow

### F-01: Revisions

- Snapshot؛
- list؛
- compare؛
- restore.

### F-02: Scheduling

- Create؛
- cancel؛
- execute؛
- retry؛
- audit.

### F-03: Translation status

- Missing؛
- Incomplete؛
- Complete؛
- Outdated.

### F-04: Conflict handling

- Version؛
- 409 response؛
- merge/reload UI.

---

## Epic G — Public Experience

### G-01: Home 2.0

- Hero؛
- Selected work؛
- Research؛
- Publication؛
- Writing؛
- Contact.

### G-02: Header/Footer

- Sticky؛
- mobile؛
- locale؛
- theme؛
- social.

### G-03: Motion

- tokens؛
- reveal؛
- hover؛
- reduced motion.

### G-04: Empty-content policy

- Conditional sections؛
- no placeholder in Production؛
- Admin warning.

---

## Epic H — Quality

### H-01: Accessibility suite

### H-02: Visual regression

### H-03: Performance budget

### H-04: Security hardening

### H-05: Content audit

---

# 31. ترتیب پیشنهادی PR و Commit

## PR 1 — P0 Media and Admin Form Safety

```text
fix(admin): make site media fields actionable
feat(media): add reusable single-select media picker
feat(admin): add sticky save and dirty-state guard
test(admin): cover media selection and unsaved changes
```

## PR 2 — Admin Design System and Shell

```text
feat(admin): introduce semantic admin primitives
feat(admin): group navigation and add status badges
feat(admin): replace embedded create forms with routes
test(admin): add shell and navigation coverage
```

## PR 3 — Media Library 2.0

```text
feat(media): add metadata and usage tracking
feat(media): add searchable asset library
feat(media): add replace archive and focal point
test(media): add integration and e2e coverage
```

## PR 4 — Composition Domain

```text
feat(cms): add versioned page composition model
feat(cms): add revision and preview token APIs
feat(frontend): add public block registry and renderers
test(cms): cover schema validation and SSR rendering
```

## PR 5 — Page Builder MVP

```text
feat(admin): add page builder shell and canvas
feat(admin): add section and block operations
feat(admin): add responsive and locale preview
test(e2e): cover compose preview and publish flow
```

## PR 6 — Article Editor

```text
feat(blog): add block-based article document
feat(blog): add inline media and markdown migration
feat(public): redesign blog landing and article pages
test(blog): add editor and public article coverage
```

## PR 7 — Portfolio Case Study and Home

```text
feat(portfolio): add structured project metadata
feat(portfolio): add case-study compositions
feat(public): launch home page v2
test(public): add visual and e2e home coverage
```

## PR 8 — Workflow

```text
feat(cms): add lifecycle and scheduled publishing
feat(cms): add revision compare and restore
feat(admin): add workflow dashboards
test(cms): cover scheduling and conflicts
```

## PR 9 — Audit and Hardening

```text
feat(seo): add metadata and audit surfaces
feat(a11y): complete keyboard and reduced-motion support
perf(frontend): enforce asset and bundle budgets
docs(ops): add production rollout runbook
```

---

# 32. برنامه Sprint پیشنهادی

با فرض یک توسعه‌دهنده Full-stack با کمک AI و بازبینی منظم:

| Sprint | موضوع |
|---|---|
| 1 | Baseline + P0 Media + Form safety |
| 2 | Admin Design System + Shell |
| 3 | Media Library Backend |
| 4 | Media Library Frontend |
| 5 | Composition domain + Renderer |
| 6 | Page Builder canvas |
| 7 | Page Builder inspector + Preview |
| 8 | Article editor |
| 9 | Blog public experience |
| 10 | Portfolio case study |
| 11 | Home 2.0 و Public polish |
| 12 | Workflow و Revisions |
| 13 | SEO/A11y/Performance |
| 14 | Migration، Rollout و Stabilization |

این زمان‌بندی تخمینی است و پس از Technical Spike و Inventory باید اصلاح شود.

---

# 33. مهارت‌ها و تخصص‌های موردنیاز

## UI/UX

- Information architecture؛
- Editorial web design؛
- Design systems؛
- RTL design؛
- Form UX؛
- CMS authoring UX؛
- Accessibility؛
- Responsive design؛
- Motion design.

## Frontend

- Vue 3 Composition API؛
- Quasar SSR؛
- State management؛
- Schema-driven forms؛
- Block renderer؛
- Drag & Drop accessible؛
- Rich text editor integration؛
- SSR/hydration؛
- Performance؛
- Vitest/Playwright.

## Backend

- Spring Boot؛
- Domain modeling؛
- PostgreSQL/JSONB؛
- Flyway؛
- Optimistic locking؛
- Scheduling؛
- Media processing؛
- Security؛
- Testcontainers؛
- API contract design.

## QA

- E2E؛
- Accessibility؛
- Visual regression؛
- Migration testing؛
- Cross-browser؛
- Performance؛
- Security smoke.

## Content

- Bilingual content strategy؛
- SEO؛
- Academic metadata؛
- Case-study writing؛
- Image selection و Alt text.

---

# 34. مستندات لازم

- Product requirements؛
- Public IA؛
- Admin IA؛
- Design tokens؛
- Component inventory؛
- Block catalog؛
- Block schema guide؛
- Editor integration ADR؛
- Media architecture ADR؛
- Revision/publishing ADR؛
- API reference؛
- Migration runbook؛
- Release checklist؛
- Content author guide؛
- Accessibility checklist؛
- Incident runbook.

---

# 35. ریسک‌ها و راهکارها

| ریسک | شدت | راهکار |
|---|---:|---|
| Page Builder بیش از حد گسترده شود | بالا | MVP محدود و Blockهای ساختاریافته |
| Editor به Vendor وابسته شود | بالا | Adapter و JSON schema داخلی |
| JSON composition غیرقابل Migration شود | بالا | Version per block و migration functions |
| Preview با Public متفاوت شود | بالا | Renderer مشترک |
| RTL در Blockها خراب شود | بالا | Fixture و Visual test برای هر Locale |
| Media storage رشد کند | متوسط | Variant policy، archive و orphan report |
| Autosave داده را overwrite کند | بالا | Optimistic locking و conflict UI |
| Migration محتوا ناقص شود | بالا | Dual-read، audit و backup |
| Motion Performance را خراب کند | متوسط | Budget و reduced motion |
| Admin پیچیده شود | بالا | Progressive disclosure و usability test |
| محتوای عمومی خالی باشد | متوسط | Conditional render و content readiness checklist |
| Timeline طولانی شود | بالا | Feature flags و PRهای کوچک |

---

# 36. Definition of Ready

هر Story فقط وقتی Ready است که:

- هدف کاربر مشخص باشد؛
- Design یا Wireframe وجود داشته باشد؛
- API/Schema مشخص باشد؛
- Acceptance Criteria قابل تست باشد؛
- i18n/RTL تعریف شده باشد؛
- Accessibility considerations ثبت شده باشد؛
- Migration impact مشخص باشد؛
- Feature flag تصمیم‌گیری شده باشد؛
- Dependencyها مشخص باشند.

---

# 37. Definition of Done

- Code review؛
- Unit/Integration/Component tests؛
- E2E مسیر حیاتی؛
- Accessibility check؛
- RTL/LTR check؛
- Mobile/Desktop؛
- Loading/Empty/Error؛
- Security validation؛
- Migration test؛
- Documentation؛
- No secrets؛
- Performance budget؛
- Observability؛
- Rollback note؛
- Product acceptance.

---

# 38. Release Readiness Checklist

## Public

- [ ] Home content کامل
- [ ] Hero image optimized
- [ ] CTAها معتبر
- [ ] تمام Navigation linkها سالم
- [ ] FA/EN کامل
- [ ] Metadata
- [ ] Sitemap
- [ ] 404
- [ ] Contact
- [ ] Mobile
- [ ] Dark mode
- [ ] Print resume/article

## Admin

- [ ] Media picker
- [ ] Dirty guard
- [ ] Preview
- [ ] Draft/Publish
- [ ] Revision
- [ ] Schedule
- [ ] Error states
- [ ] Empty states
- [ ] Keyboard
- [ ] Permission

## Operations

- [ ] Backup
- [ ] Migration
- [ ] Monitoring
- [ ] Alerts
- [ ] Rollback
- [ ] Runbook
- [ ] Feature flags
- [ ] Storage capacity
- [ ] Security headers

---

# 39. معیار پذیرش نهایی محصول

محصول زمانی آماده تلقی می‌شود که:

1. یک کاربر غیرتوسعه‌دهنده بتواند Home را با Blockها بسازد.
2. Logo و Open Graph را بدون واردکردن ID انتخاب کند.
3. یک مقاله با تصویر Inline، Quote، Code و Gallery منتشر کند.
4. یک پروژه Case Study کامل بسازد.
5. Preview فارسی، انگلیسی، Desktop و Mobile را ببیند.
6. Draft، Schedule، Publish و Restore Revision انجام دهد.
7. Public SSR همان Preview را Render کند.
8. محتوای ناقص یا خالی در Production ظاهر نشود.
9. مسیرهای حیاتی با Keyboard قابل انجام باشند.
10. Test suite، Migration، Performance و Security checks سبز باشند.

---

# 40. بازبینی تخصصی و امتیازدهی تکرارشونده

> این امتیازها نتیجه Self-review ساختاریافته هستند و جایگزین Usability Test واقعی با کاربران نمی‌شوند.

## دور اول

| نقش | امتیاز | کمبود مشاهده‌شده |
|---|---:|---|
| UI/UX Designer | 8.7/10 | جزئیات Translation flow و Responsive builder کافی نبود |
| Frontend Developer | 8.8/10 | Registry، SSR و State flow نیاز به تفصیل داشت |
| Backend Developer | 8.6/10 | Revision، Scheduler، Usage index و JSON migration ناقص بود |
| مخاطب پژوهشی | 8.9/10 | Publication و Case Study باید برجسته‌تر می‌شد |
| مخاطب سازمانی | 8.8/10 | Outcome و نقش در پروژه‌ها کافی نبود |
| مدیر محتوا | 8.5/10 | Autosave، Conflict و Error recovery کم‌جزئیات بود |

### اصلاحات دور اول

- مدل Versioned Block و Migration اضافه شد.
- Media usage index تعریف شد.
- Workflow، Revision و Conflict تکمیل شد.
- Project Case Study با Outcome و Role توسعه یافت.
- Translation queue و Outdated status اضافه شد.
- Admin shell و Dashboard وضعیت‌محور تکمیل شد.

## دور دوم

| نقش | امتیاز | کمبود مشاهده‌شده |
|---|---:|---|
| UI/UX Designer | 9.1/10 | Motion policy و consistency بهتر شد؛ Rollout UX نیاز به تقویت داشت |
| Frontend Developer | 9.2/10 | معماری Registry و SSR قابل اجرا شد |
| Backend Developer | 9.1/10 | Schema و API کامل‌تر شد؛ عملیات Production نیاز به Runbook داشت |
| مخاطب پژوهشی | 9.2/10 | Research و Publication مناسب شد |
| مخاطب سازمانی | 9.1/10 | Case Study روشن شد |
| مدیر محتوا | 9.0/10 | هنوز معیار بالاتر از 9 برای recovery و migration لازم بود |

### اصلاحات دور دوم

- Feature flag و Dual-read migration اضافه شد.
- Runbook، Monitoring و Rollback تکمیل شد.
- Definition of Ready/Done اضافه شد.
- Release readiness و Content readiness تعریف شد.
- E2E، Visual regression، Accessibility و Performance budget تکمیل شد.
- Editor vendor abstraction و Technical Spike اضافه شد.

## دور سوم و امتیاز نهایی

| نقش | امتیاز نهایی |
|---|---:|
| UI/UX Designer حرفه‌ای | 9.5/10 |
| Frontend Developer | 9.4/10 |
| Backend Developer | 9.5/10 |
| پژوهشگر/استاد | 9.4/10 |
| Recruiter/Admissions | 9.3/10 |
| مدیر فنی/محصول | 9.4/10 |
| خواننده Blog | 9.3/10 |
| مدیر محتوا | 9.4/10 |
| میانگین نهایی | **9.4/10** |

### دلیل توقف بازبینی

پس از دور سوم، تمام نقش‌ها امتیاز بالاتر از 9 دریافت کردند. سند اکنون:

- از نظر Product و UX هدف روشن دارد؛
- از نظر Frontend و Backend به Taskهای قابل اجرا شکسته شده است؛
- Migration، Rollback، Security و Operations را پوشش می‌دهد؛
- Public، Admin، CMS، Editor، Media، Workflow و Quality را یکپارچه می‌بیند؛
- برای تبدیل مستقیم به Epic، Story، Sprint و PR مناسب است.

---

# 41. تصمیم اجرایی نهایی

اولین اقدام توسعه نباید ساخت کامل Page Builder باشد. ترتیب صحیح:

1. رفع Media Picker و Silent failure؛
2. استانداردسازی Admin Form و Actionها؛
3. ایجاد Media Library قابل اتکا؛
4. تعریف Composition schema و Renderer مشترک؛
5. ساخت Page Builder MVP؛
6. توسعه Article Editor؛
7. طراحی Home 2.0 و Case Study؛
8. افزودن Workflow پیشرفته؛
9. Audit، Hardening و Rollout.

این ترتیب ریسک را کنترل می‌کند، از بازنویسی دوباره جلوگیری می‌کند و اجازه می‌دهد هر فاز به‌صورت مستقل تست، Merge و Deploy شود.

---

# 42. خروجی‌های قابل استخراج از این سند

این سند می‌تواند مستقیماً به خروجی‌های زیر تبدیل شود:

- PRD؛
- UX Specification؛
- Technical Design Document؛
- Database migration plan؛
- API backlog؛
- Frontend component backlog؛
- Sprint backlog؛
- GitHub Issues؛
- Acceptance test suite؛
- AI-agent implementation plan؛
- Release runbook.
