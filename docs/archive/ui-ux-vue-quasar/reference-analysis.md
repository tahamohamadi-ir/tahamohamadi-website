# تحلیل مرجع طراحی و محصول سایت Mohammadi-Ali.ir برای پروژه TahaMohamadi.ir

> **مبنای تحلیل:** هشت اسکرین‌شات ارسالی کاربر از صفحات Home، Graph، Work، Research، Manual و Ask AI. ادعای استفاده از Django و React نیز بر اساس توضیح کاربر است. این سند روی استخراج الگوهای قابل‌انتقال به پروژه فعلی TahaMohamadi.ir متمرکز است و توصیه نمی‌کند معماری Vue/Quasar + Spring Boot پروژه صرفاً برای تقلید از ظاهر سایت مرجع تغییر کند.

---

## 1. جمع‌بندی اجرایی

سایت مرجع یک وب‌سایت شخصی معمولی نیست؛ خود را به‌صورت یک **محصول حرفه‌ای شخصی (Personal Product)** معرفی می‌کند. تفاوت اصلی آن با رزومه‌های آنلاین رایج، در پنج محور است:

1. **موضع‌گیری روشن در اولین نگاه**: کاربر بلافاصله می‌فهمد صاحب سایت چه کسی است، چه می‌سازد، در چه حوزه‌ای فعالیت می‌کند و برای چه فرصت‌هایی در دسترس است.
2. **روایت حرفه‌ای به‌جای فهرست رزومه**: تجربه‌ها با استعاره‌ها و مدل‌های اطلاعاتی منسجم مانند Graph و Ledger نمایش داده شده‌اند.
3. **تمایز عملکردی**: صفحه Graph و Ask AI قابلیت‌هایی هستند که سایت را از یک Portfolio استاتیک جدا می‌کنند.
4. **سیستم بصری محدود اما بسیار منسجم**: سفید، مشکی، خاکستری تیره و آبی؛ Typography قوی؛ فضای سفید زیاد؛ کارت‌های ساده؛ Microcopy فنی.
5. **تمرکز بر مخاطب تصمیم‌گیر**: Hiring Manager، Research Collaborator، استاد، مدیر محصول یا همکار می‌تواند در زمان کوتاه به پاسخ پرسش‌های مهم برسد.

برای پروژه TahaMohamadi.ir، مهم‌ترین درس این نیست که همین ظاهر کپی شود؛ بلکه باید سایت طه نیز یک **مدل ذهنی منحصربه‌فرد** پیدا کند. پیشنهاد مناسب برای پروژه طه:

- هویت مرکزی: **Human-Centered AI Systems**
- تمایز تعاملی: **Research/Systems Map**
- روایت حرفه‌ای: **Impact Ledger**
- لایه اعتماد: **Evidence-backed Research & Publications**
- راهنمای همکاری: **How I Work**
- دستیار: **Ask Taha — grounded in CV, projects, publications and approved content**

---

## 2. دامنه و محدودیت تحلیل

### صفحات مشاهده‌شده

- Home
- Graph
- Work
- Research
- Manual
- Ask AI

### مواردی که از اسکرین‌شات‌ها قابل اثبات نیستند

- رفتار کامل Mobile و Tablet
- جزئیات واقعی Animation و Transition
- ساختار API و Database
- روش Authentication
- کیفیت واقعی SEO، Performance و Accessibility
- منبع داده Graph
- کیفیت پاسخ‌دهی Assistant
- پنل مدیریت و قابلیت ویرایش محتوا

بنابراین بخش‌های فنی این سند سه سطح دارند:

- **مشاهده مستقیم**: چیزی که در تصویر دیده می‌شود.
- **استنباط طراحی**: نتیجه منطقی از الگوی رابط.
- **پیشنهاد برای پروژه طه**: نسخه‌ای که باید در Stack فعلی اجرا شود.

---

# بخش اول — تحلیل محصول و تجربه کاربری سایت مرجع

## 3. جایگاه‌یابی و Brand Strategy

### 3.1 هویت برند در Header

Header در تمام صفحات ساختار ثابتی دارد:

- لوگوی مربعی بسیار ساده با حرف `A.`
- نام کامل
- یک Descriptor کوتاه و Mono-spaced:
  - `FINTECH PRODUCT · AI RESEARCHER`
- Navigation مرکزی
- Dark mode toggle
- CTA واضح و دائمی `Contact →`

### ارزش این الگو

- هویت فرد در تمام Scrollها در دسترس است.
- Descriptor نقش Elevator Pitch بسیار کوتاه را دارد.
- Contact از یک لینک عادی به Conversion Goal تبدیل شده است.
- Header به‌جای Brand decoration، اطلاعات عملی ارائه می‌دهد.

### پیشنهاد برای طه

Header پروژه طه می‌تواند به‌صورت زیر بازطراحی شود:

- لوگوی Typographic یا Monogram اختصاصی `T.`
- `Taha Mohammadi`
- Descriptor نمونه:
  - `HUMAN-CENTERED AI · WEARABLE SYSTEMS · XAI`
- Navigation:
  - Home
  - Systems Map
  - Work
  - Research
  - Writing
  - Resume
  - Ask Taha
- CTA:
  - `Collaborate →` یا `Contact →`
- Language switch و Theme switch باید با هم تداخل بصری نداشته باشند.

---

## 4. سیستم بصری

## 4.1 Color System

رنگ‌ها بسیار محدودند:

- Background: سفید یا نزدیک به سفید
- Text primary: مشکی
- Text secondary: خاکستری-سرمه‌ای
- Accent: آبی روشن و اشباع
- Border: خاکستری بسیار کمرنگ
- Semantic green: وضعیت Session یا Availability
- Semantic red: Negative list در Manual

### مزیت

- تمرکز از محتوا منحرف نمی‌شود.
- رنگ آبی به CTA، Highlight، Metric و Active state معنا می‌دهد.
- صفحه Research و Graph با وجود داده زیاد شلوغ نمی‌شوند.

### ریسک

- اگر Typography یا محتوا ضعیف باشد، چنین طراحی مینیمالی سریعاً خالی و ناقص به نظر می‌رسد.
- Contrast متن‌های Mono و خاکستری کمرنگ باید سنجیده شود.

### پیشنهاد Token برای پروژه طه

```scss
:root {
  --color-canvas: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0a0a0a;
  --color-text-muted: #334155;
  --color-border: #e2e8f0;
  --color-accent: #2563eb;
  --color-accent-soft: #dbeafe;
  --color-success: #059669;
  --color-danger: #dc2626;
  --radius-sm: 10px;
  --radius-md: 16px;
  --shadow-subtle: 0 1px 2px rgb(15 23 42 / 0.04);
}
```

این مقادیر فقط نقطه شروع‌اند و باید با Design System فعلی پروژه همگرا شوند.

---

## 4.2 Typography

سه لایه Typography دیده می‌شود:

1. **Display Sans بزرگ و سنگین** برای عنوان‌ها
2. **Body Sans خوانا** برای توضیحات
3. **Monospace کوچک و Uppercase** برای Metadata، Status، Label و Tag

### نمونه کاربردها

- Hero headline: بسیار بزرگ، Bold و با Line break کنترل‌شده
- Research title: بزرگ اما نه نمایشی
- Eyebrow: Mono و Letter-spacing بالا
- Tags: Mono، کوچک و پس‌زمینه آبی بسیار روشن
- Metrics: عدد یا Keyword بزرگ با Caption کوچک

### مزیت

این ترکیب حس «محصول فنی + روایت Editorial» می‌سازد.

### پیشنهاد برای فارسی

در نسخه فارسی نباید Mono را برای متن طولانی یا حروف فارسی به‌صورت گسترده استفاده کرد. کاربرد مناسب:

- اعداد
- Keyها
- Version
- Tagهای انگلیسی
- تاریخ‌ها
- وضعیت‌ها

برای متن فارسی، یک Sans فارسی با وزن‌های واقعی و Line-height مناسب لازم است. در RTL باید تفاوت عرض و ریتم فونت فارسی در Hero دوباره طراحی شود، نه اینکه فقط `direction: rtl` اضافه شود.

---

## 4.3 Spacing و Layout

الگوهای غالب:

- Container مرکزی عریض
- فضای سفید بسیار زیاد بین Header و محتوای اصلی
- محتوا در Grid دو ستونه
- خطوط Border باریک برای جداسازی
- استفاده کم از Shadow
- ارتفاع بخش‌ها بر اساس محتوا، نه کارت‌های فشرده

### نکته مهم

فضای سفید در این سایت صرفاً زیبایی نیست؛ نقش **Hierarchy** دارد. هر صفحه یک عنوان بزرگ، توضیح کوتاه و سپس یک Interaction یا Dataset اصلی دارد.

### ریسک برای پروژه طه

سایت فعلی طه در بعضی صفحات Empty state دارد. اگر همین فضای سفید زیاد بدون Content density کافی استفاده شود، صفحه ناتمام به نظر می‌رسد. بنابراین قبل از مهاجرت کامل به این الگو باید حداقل محتوای واقعی هر صفحه آماده باشد.

---

## 5. Information Architecture

Navigation مرجع:

- Home
- Graph
- Work
- Research
- Manual
- Ask AI

این ترتیب از «معرفی» به «مدل ذهنی»، سپس «شواهد حرفه‌ای»، «شواهد علمی»، «نحوه همکاری» و در نهایت «پرسش تعاملی» حرکت می‌کند.

### چرا این IA خوب است؟

- به‌جای دسته‌های عمومی About/Portfolio/Resume، از نام‌هایی استفاده می‌کنند که کنجکاوی ایجاد می‌کنند.
- مسیرهای مخاطب‌محور دارد:
  - Recruiter → Home → Work → Contact
  - Researcher → Home → Graph → Research → Contact
  - Collaborator → Manual → Ask AI → Contact
- AI Assistant یک قابلیت فرعی پنهان نیست؛ در سطح اول Navigation قرار دارد.

### ریسک

- نام‌هایی مثل Graph و Manual بدون Context ممکن است برای مخاطب عمومی مبهم باشند.
- نبود Resume مستقل در Navigation ممکن است برای برخی Recruiterها اصطکاک ایجاد کند.

### نسخه پیشنهادی برای طه

```text
Home
Systems Map
Work
Research
Writing
Resume
Ask Taha
```

در Mobile:

- Home
- Work
- Research
- More
  - Systems Map
  - Writing
  - Resume
  - Ask Taha
  - Contact

---

# بخش دوم — تحلیل صفحه‌به‌صفحه

## 6. Home Page

## 6.1 ساختار مشاهده‌شده

Home از یک Hero دو ستونه تشکیل شده است:

### ستون چپ

- Availability badge
- عنوان بسیار بزرگ:
  - معرفی نام
  - Statement هویتی
  - تأکید Italic و Accent color
- یک Paragraph روشن درباره نقش، حوزه، تحصیل و تمرکز

### ستون راست

یک Status card با بخش‌های مستقل:

- Currently
- Studying
- Teaching
- Based in

### Header

- Brand + descriptor
- Navigation
- Theme toggle
- Contact CTA

## 6.2 نقاط قوت

### First impression بسیار قوی

در کمتر از چند ثانیه پاسخ این پرسش‌ها داده می‌شود:

- این فرد کیست؟
- چه کاری انجام می‌دهد؟
- چه چیز متفاوتی می‌سازد؟
- اکنون مشغول چیست؟
- کجا قرار دارد؟
- برای چه فرصت‌هایی باز است؟

### Hero به‌جای شعار عمومی، Positioning دارد

عبارت اصلی فقط «I am a developer» نیست؛ یک موضع حرفه‌ای و فکری ارائه می‌کند.

### Status card اطلاعات زنده و قابل اقدام می‌دهد

این کارت رزومه نیست؛ Snapshot فعلی است و به مخاطب کمک می‌کند وضعیت فعلی فرد را بفهمد.

## 6.3 مشکلات و ریسک‌ها

- Display text بسیار بزرگ است و ممکن است در لپ‌تاپ‌های کوچک یا فارسی به شکست نامناسب خطوط منجر شود.
- Cursor-like vertical bar در Hero اگر Animation واقعی باشد، ممکن است دائماً حواس‌پرت‌کن باشد.
- اگر محتوا به‌روز نشود، عبارت Currently به ضد‌اعتماد تبدیل می‌شود.
- متن Hero به‌شدت بر Copywriting متکی است.

## 6.4 نسخه مناسب برای طه

### Eyebrow پیشنهادی

```text
OPEN TO PhD RESEARCH · HUMAN-CENTERED AI · WEARABLE INTELLIGENCE
```

### الگوی Hero، نه متن نهایی

```text
Hi — I’m Taha.
I turn human signals
into interpretable systems.
```

### Supporting paragraph باید به این مؤلفه‌ها وصل شود

- Human-centered AI
- Wearables / Edge AI
- Explainable AI
- Mental-health self-management systems
- پژوهش، طراحی سیستم و Production implementation

### Status card پیشنهادی

- `CURRENTLY` — نقش یا پروژه اصلی
- `RESEARCHING` — موضوعات فعال
- `BUILDING` — پروژه شاخص جاری
- `LEARNING` — DL / RL یا دوره‌های مرتبط
- `BASED IN` — Location و collaboration mode
- `AVAILABLE FOR` — PhD, research collaboration, selected product work

### الزام CMS

هر ردیف Status باید:

- Locale مستقل
- Label
- Rich text کوتاه
- Link اختیاری
- Sort order
- Visibility
- Last updated date

داشته باشد.

---

## 7. Graph Page

## 7.1 ساختار مشاهده‌شده

- Eyebrow فنی با Version: `SEPG V0.3`
- عنوان مفهومی بزرگ
- توضیح کاربرد Graph
- Canvas یا SVG تعاملی داخل کارت بزرگ
- Nodeهای رنگی
- Edgeهای خاکستری
- Legend در پایین
- شمارش Node/Edge و Drift metric
- قابلیت‌های اعلام‌شده:
  - Click node
  - Drag to pan
  - Scroll to zoom
  - Pinch on touch

## 7.2 ارزش محصولی

این صفحه مهم‌ترین Differentiator سایت است. به‌جای نمایش Skill list، هویت حرفه‌ای را به‌صورت یک **Knowledge/Persona Graph** نمایش می‌دهد.

مزیت‌ها:

- ارتباط میان مهارت، نقش، پروژه، سازمان، آموزش و Trait دیده می‌شود.
- قابلیت Exploration ایجاد می‌کند.
- مفهوم پژوهشی فرد را به Demo زنده تبدیل می‌کند.
- خود سایت به نمونه‌کار تحقیق و طراحی محصول تبدیل می‌شود.

## 7.3 ریسک‌ها

- Graph بدون راهنمای خوب می‌تواند به Visualization نمایشی و کم‌فایده تبدیل شود.
- Node labelها در Zoom پایین ناخوانا می‌شوند.
- Touch، Keyboard و Screen reader نیاز به طراحی مستقل دارند.
- Force simulation ممکن است Layout را در هر بار ورود تغییر دهد و Orientation کاربر را از بین ببرد.
- در Mobile، Interaction پیچیده می‌شود.
- اگر Graph دستی باشد، نگهداری آن دشوار است؛ اگر خودکار باشد، کنترل کیفیت داده دشوارتر می‌شود.

## 7.4 نسخه پیشنهادی برای طه: Systems Map

به‌جای Persona Graph مشابه، ویژگی منحصربه‌فرد پروژه طه می‌تواند **Human-Centered AI Systems Map** باشد.

### گروه Nodeها

- Research Domains
  - Anxiety
  - ADHD
  - Depression
  - OCPD
  - Human-AI Interaction
- Signals
  - HR
  - HRV
  - SpO2
  - Temperature
  - Motion
  - Sleep
  - EDA / Stress
- Methods
  - ML
  - DL
  - RL
  - XAI
  - Edge AI
- Stakeholders
  - Self-management
  - Clinician
  - Parent/Caregiver
- Projects
- Publications
- Certificates
- Tools / Technologies

### Interaction پیشنهادی

- Hover: Highlight neighborhood
- Click: Side panel با Summary و Link
- Filter by type
- Search node
- Reset view
- Zoom controls
- `Open related project`
- `Open related publication`
- Deep-link هر Node

### داده پیشنهادی

```json
{
  "id": "xai",
  "type": "method",
  "label": { "en": "Explainable AI", "fa": "هوش مصنوعی توضیح‌پذیر" },
  "summary": { "en": "...", "fa": "..." },
  "slug": "explainable-ai",
  "weight": 0.82,
  "status": "active",
  "links": [
    { "target": "mental-health-dashboard", "relation": "used_in" }
  ]
}
```

### توصیه فنی Frontend

با توجه به Stack فعلی:

- Vue component مستقل
- D3-force یا Cytoscape.js
- Simulation یک‌بار Stabilize و سپس Position ذخیره شود
- Canvas برای Node زیاد، SVG برای Node محدود و Accessibility بهتر
- Lazy-load فقط هنگام ورود به صفحه
- IntersectionObserver برای شروع Rendering
- Prefers-reduced-motion
- Snapshot ثابت برای SEO و Print

### توصیه CMS

Admin باید اجازه دهد:

- ایجاد Node
- انتخاب Type و Color semantic
- ایجاد Edge
- تعیین Relation
- Link به Project / Publication / Skill
- Preview graph
- Validate orphan nodes
- Publish version

---

## 8. Work Page — Career Ledger

## 8.1 ساختار مشاهده‌شده

- Eyebrow استعاری: `CAREER LEDGER · DOUBLE-ENTRY SHIPPING`
- عنوان بزرگ با مفهوم Ledger
- توضیح کوتاه
- Filter chips:
  - All
  - Roles
  - Research
  - Shipped
  - Learning
- Timeline یا Table با ستون‌های:
  - Date
  - Title + Organization
  - Tags
  - Description / Impact
  - Metric / Result

## 8.2 نقاط قوت

### تجربه‌ها به Outcome متصل شده‌اند

به‌جای Bulletهای رزومه، هر Entry یک Transaction حرفه‌ای است:

- چه زمانی؟
- چه چیزی؟
- در چه Contextی؟
- چه چیزی تحویل شد؟
- اثر قابل‌سنجش چه بود؟

### Filter باعث کاهش Cognitive load می‌شود

مخاطب می‌تواند فقط Research یا Shipped work را ببیند.

### Metric در ستون راست

نمایش Result مانند درصد کاهش Drift، توجه را از عنوان شغلی به Impact منتقل می‌کند.

## 8.3 ریسک‌ها

- ساختار Table در Mobile دشوار است.
- Metric بدون Source یا Method می‌تواند تبلیغاتی به نظر برسد.
- استعاره Ledger اگر بیش‌از‌حد استفاده شود، محتوا را مصنوعی می‌کند.
- همه تجربه‌ها Metric عددی ندارند؛ نباید اعداد ساختگی تولید شود.

## 8.4 نسخه پیشنهادی برای طه: Impact Ledger

Filterها:

- All
- Roles
- Projects
- Research
- Publications
- Learning
- Certifications
- Talks

هر Entry:

```text
Date range
Type
Title
Organization / Context
One-line outcome
Evidence links
Technologies / Methods
Metric or proof
Related project/publication
```

### Mobile adaptation

در Mobile جدول باید به Card تبدیل شود:

- Date و Type در Header کارت
- Title
- Context
- Outcome
- Metric
- Expand details

### CMS model

```text
career_event
- id
- event_type
- start_date
- end_date
- is_current
- organization
- title
- localized_summary
- localized_details
- metric_value
- metric_label
- metric_context
- evidence_url
- sort_order
- visibility
- related_project_ids
- related_publication_ids
- related_skill_ids
```

---

## 9. Research Page

## 9.1 ساختار مشاهده‌شده

- Grid دو ستونه
- Cardهای بزرگ با Border کمرنگ
- تاریخ یا بازه زمانی
- عنوان
- Summary
- Tags
- Divider
- یک Keyword یا Result بزرگ در پایین
- Caption کوچک برای Keyword

نمونه الگو:

- `GPT · LLaMA` / `model families`
- `Subgraph` / `detection`
- `CAN` / `automotive`
- `JOSS` / `submitted`

## 9.2 نقاط قوت

- Research به‌صورت مجموعه‌ای قابل Scan نمایش داده می‌شود.
- Tagها حوزه و Method را سریع نشان می‌دهند.
- Keyword بزرگ هر Card را به یک Visual identity کوچک تبدیل می‌کند.
- Grid منظم و آرام است.

## 9.3 ضعف‌ها

- Keyword پایین بعضی کارت‌ها ممکن است معنای کافی نداشته باشد.
- CTA مستقیم مانند `View details`، `Paper`، `Code` یا `Dataset` در تصویر مشخص نیست.
- Statusهایی مانند Ongoing، Submitted و Published باید Semantic و قابل اعتماد باشند.
- Cardها در صورت Summary طولانی ممکن است ارتفاع نابرابر پیدا کنند.

## 9.4 پیشنهاد برای طه

### Card fields

- Year / Date range
- Status
- Research title
- Research question
- 2–3 line summary
- Methods
- Dataset
- Role / Contribution
- Result یا Current stage
- Paper / Preprint / Code / Poster / Dataset links
- Related system-map nodes

### CTAهای ضروری

- `Read research note`
- `View publication`
- `View code`
- `View dataset`
- `See related project`

### Filterها

- Human-Centered AI
- Wearables
- Mental Health
- XAI
- Edge AI
- ML/DL/RL
- Published / Ongoing

### نکته محتوایی مهم

برای مخاطب PhD، Research page باید فقط «موضوعات موردعلاقه» نباشد. هر مورد باید حداقل یکی از این Evidenceها را داشته باشد:

- Problem statement
- Method
- Artifact
- Experiment
- Result
- Publication
- Dataset
- Code
- Next step

---

## 10. Manual Page

## 10.1 ساختار مشاهده‌شده

- عنوان: User manual for working with me
- توضیح که محتوا از Assessment data ترکیب شده
- دو ستون
- Listهای مثبت و منفی:
  - At my best
  - When I struggle
- Clifton domains با Progress bar
- Snapshot cardها:
  - Rank
  - DISC
  - Type
  - Core drive
- بخش‌های پایین‌تر:
  - Brief me like this
  - Give me more of

## 10.2 ارزش محصولی

این صفحه به یک مسئله واقعی پاسخ می‌دهد: «چگونه با این فرد بهتر کار کنیم؟»

برای مدیر، همکار یا استاد، این صفحه می‌تواند اصطکاک همکاری را کاهش دهد و Self-awareness را نشان دهد.

## 10.3 ریسک‌های جدی

- آزمون‌های شخصیت نباید به‌عنوان حقیقت علمی قطعی عرضه شوند.
- داده‌های شخصیتی ممکن است Privacy یا Bias ایجاد کنند.
- درصدها بدون توضیح Methodology ممکن است بیش‌از‌حد دقیق به نظر برسند.
- نمایش ضعف‌ها اگر Context و Mitigation نداشته باشد، ممکن است برداشت منفی ایجاد کند.
- Sticky header در اسکرین‌شات هنگام Scroll روی بخشی از محتوا افتاده و خوانایی Header/Content را مختل کرده است.

## 10.4 نسخه پیشنهادی برای طه: How I Work

بهتر است از مدل «راهنمای همکاری» استفاده شود، نه صفحه آزمون شخصیت.

بخش‌ها:

- At my best
- I work best when
- How to brief me
- Decision-making style
- Communication preferences
- Feedback preferences
- What slows me down
- How I handle uncertainty
- Collaboration boundaries
- Current availability

### الگوی نوشتن نقاط ضعف

بد:

```text
I am impatient.
```

بهتر:

```text
When goals or ownership remain vague for too long, I may push for premature closure. Clear decision rights and a short written brief help me stay rigorous without rushing the team.
```

### Privacy

- انتشار هر Assessment باید Opt-in باشد.
- داده خام آزمون در سایت ذخیره نشود مگر ضروری.
- منبع و تاریخ Assessment مشخص باشد.
- Disclaimer واضح اضافه شود.

---

## 11. Ask AI Page

## 11.1 ساختار مشاهده‌شده

### Intro

- عنوان بزرگ: Ask the assistant
- توضیح مخاطب و دامنه دانش
- جمله مهم: `It will tell you what it doesn't know.`

### ستون چپ

Suggested prompts:

- توضیح Thesis
- کارهای تحویل‌داده‌شده
- نقش‌های مورد‌نظر
- نحوه Brief کردن
- شرح یک Stack یا Project

### ستون راست

Chat workspace:

- Session indicator
- Grounded indicator
- Direct API indicator
- Question count
- Intro message
- فضای مکالمه

## 11.2 نقاط قوت

- Assistant به‌عنوان یک ویژگی نمایشی معرفی نشده؛ Use case روشن دارد.
- Suggested prompts اضطراب Blank state را کم می‌کنند.
- وعده «نمی‌دانم» Trust را بالا می‌برد.
- اشاره به Grounded بودن دامنه، انتظار کاربر را مدیریت می‌کند.

## 11.3 ریسک‌ها

- Assistant ممکن است اطلاعات رزومه را اشتباه یا اغراق‌آمیز بازگو کند.
- Prompt injection از طریق محتوای CMS یا فایل‌های بارگذاری‌شده ممکن است رخ دهد.
- هزینه API و Abuse باید کنترل شود.
- داده‌های Chat ممکن است شخصی باشند.
- نبود Citation پاسخ‌ها اعتماد را کاهش می‌دهد.
- واژه `Trained on CV` ممکن است از نظر فنی نادرست باشد؛ اغلب سیستم RAG است نه Fine-tuning.

## 11.4 نسخه پیشنهادی برای طه: Ask Taha

### مخاطبان

- استادان و Supervisorهای PhD
- Research collaborators
- Recruiters
- Product/AI teams
- بازدیدکنندگان علاقه‌مند به پروژه‌ها

### Corpus مجاز

- CV تأیید‌شده
- Publications و Projects منتشرشده
- Research notes تأیید‌شده
- How I Work
- Resume entries
- Public site pages
- FAQهای دستی

### پاسخ باید شامل باشد

- پاسخ کوتاه
- Source chips
- Link به صفحه مرتبط
- Confidence یا coverage indication
- Refusal برای موضوع خارج از دامنه
- `I do not have enough evidence` در نبود داده

### Policy پیشنهادی

```text
ALLOWED:
- Public CV and published portfolio facts
- Research interests and public project details
- Collaboration and availability information
- Navigation assistance

NOT ALLOWED:
- Invented achievements
- Private contact data
- Medical, legal or financial advice
- Guessing unpublished work
- Claims not present in approved sources
```

### Architecture متناسب با پروژه فعلی

بدون تغییر Stack:

```text
Vue/Quasar Chat UI
        ↓
Spring Boot Assistant API
        ↓
Query classifier
        ├── Structured DB retrieval
        ├── RAG over approved documents
        └── Unsupported-domain response
        ↓
LLM provider through server-side API
        ↓
Cited response + related links
```

### الزامات امنیتی

- API key فقط Server-side
- Rate limit بر اساس IP و Session
- Input length limit
- Output token limit
- Prompt injection filtering
- Public-only corpus
- Log redaction
- Opt-out analytics
- CSRF/CORS policy متناسب با Same-origin

---

# بخش سوم — Interaction و Motion

## 12. Navigation State

Active nav item در یک Pill خاکستری یا Border مشکی نمایش داده می‌شود.

### مزیت

- Position کاربر روشن است.
- State بدون رنگ Accent شدید مشخص می‌شود.

### پیشنهاد

در پروژه طه:

- Active state باید برای Keyboard و Screen reader نیز مشخص باشد.
- `aria-current="page"`
- Focus ring مستقل از Active state
- در RTL ترتیب Nav و Arrowها بازطراحی شود.

---

## 13. Dark Mode

Theme toggle دائمی در Header دیده می‌شود.

### پیشنهاد

- System default در اولین ورود
- ذخیره Preference
- بدون Flash of incorrect theme
- تصاویر و Graph نیز برای Dark theme تست شوند
- در CMS، رنگ‌های Custom به کاربر داده نشود؛ فقط Presetهای کنترل‌شده

---

## 14. Motion پیشنهادی

از تصاویر نمی‌توان Motion واقعی را تأیید کرد، اما ظاهر برای Micro-interactionهای محدود مناسب است.

### Motionهایی که برای طه ارزش دارند

- Page enter: opacity + translateY بسیار کم، 180–240ms
- Card hover: border/accent shift، 120–160ms
- Filter change: layout transition بدون پرش
- Graph node focus: neighborhood fade
- Metric reveal فقط یک بار و با reduced-motion support
- CTA arrow: translateX یا translate-inline-start محدود
- Sticky header: compact on scroll

### Motionهایی که بهتر است استفاده نشوند

- Typewriter دائمی در Hero
- Parallax سنگین
- Scroll hijacking
- Cursor follower
- Background particles دائمی
- Animationهایی که Reading را به تأخیر می‌اندازند

---

# بخش چهارم — Content Strategy

## 15. اصل مهم: هر صفحه یک سؤال را پاسخ می‌دهد

| صفحه | سؤال اصلی مخاطب |
|---|---|
| Home | تو کی هستی و چرا باید بیشتر بررسی‌ات کنم؟ |
| Systems Map | حوزه‌ها و پروژه‌هایت چگونه به هم متصل‌اند؟ |
| Work | چه چیزی واقعاً ساخته و تحویل داده‌ای؟ |
| Research | چه سؤال‌هایی را با چه روش‌هایی دنبال می‌کنی؟ |
| Writing | چگونه فکر می‌کنی و توضیح می‌دهی؟ |
| Resume | سابقه رسمی و قابل دانلود چیست؟ |
| How I Work | همکاری با تو چگونه بهتر پیش می‌رود؟ |
| Ask Taha | پاسخ سریع و مستند به سؤال من چیست؟ |
| Contact | قدم بعدی چیست؟ |

این اصل باید در Page Composer نیز حفظ شود؛ آزادی چیدمان نباید باعث شود هر صفحه هدف خود را از دست بدهد.

---

## 16. الگوی Content hierarchy

برای صفحات اصلی:

```text
Eyebrow / context
H1 outcome-oriented
Short explanatory paragraph
Primary interaction or evidence
Secondary evidence
CTA / next step
```

### مثال برای Research detail

```text
Research question
Why it matters
Data/signals
Method
Experiment design
Results
Limitations
Artifacts
Related work
Next steps
```

---

## 17. Microcopy

ویژگی Microcopy سایت مرجع:

- کوتاه
- فنی اما قابل فهم
- Outcome-oriented
- دارای واژه‌های عملی مانند build، ship، inspect، brief

### پیشنهاد برای طه

Microcopy باید بین سه مخاطب تعادل برقرار کند:

- استاد و پژوهشگر
- Recruiter/Manager
- مخاطب عمومی

بنابراین هر مفهوم تخصصی باید یک توضیح Plain-language نیز داشته باشد.

---

# بخش پنجم — نقاط قوت و ضعف کلی

## 18. نقاط قوت اصلی

1. **Brand clarity بسیار بالا**
2. **First impression قوی**
3. **Navigation محدود و هدفمند**
4. **Consistency بصری بالا**
5. **استفاده مؤثر از Typography و فضای سفید**
6. **ویژگی تعاملی منحصربه‌فرد Graph**
7. **روایت Impact-based در Work**
8. **Research cards قابل Scan**
9. **صفحه How I Work برای Collaboration**
10. **AI Assistant با Use case روشن**
11. **CTA دائمی و مشخص**
12. **امکان Dark mode**

---

## 19. ضعف‌ها و ریسک‌ها

1. عنوان‌های بسیار بزرگ ممکن است در Responsive مشکل ایجاد کنند.
2. بعضی Labelهای استعاری برای مخاطب عمومی مبهم‌اند.
3. Sticky header در Scroll می‌تواند روی محتوا بیفتد.
4. Graph از نظر Accessibility و Mobile پرریسک است.
5. Research cardها CTA و Evidence واضح‌تری می‌خواهند.
6. Manual ممکن است داده‌های شخصیت را بیش‌از‌حد قطعی نشان دهد.
7. Ask AI بدون Citation و Governance قابل اعتماد نیست.
8. فضای سفید زیاد در صفحات کم‌محتوا حس ناتمام بودن می‌دهد.
9. تمرکز زیاد روی Copywriting، نگهداری محتوا را مهم می‌کند.
10. نبود Footer یا مسیرهای ثانویه در تصاویر، Discovery را محدود می‌کند.
11. Active navigation با Border مشکی ممکن است در حالت Focus اشتباه شود.
12. Metadataهای بسیار کوچک ممکن است Contrast یا خوانایی ضعیفی داشته باشند.

---

# بخش ششم — آنچه باید برای پروژه TahaMohamadi.ir اقتباس شود

## 20. اقتباس مستقیم، اقتباس تعدیل‌شده و موارد نامناسب

### اقتباس مستقیم

- Header ثابت و ساده
- Descriptor زیر نام
- CTA دائمی
- Eyebrowهای Mono
- Hero دو ستونه
- Status card
- Filter chips
- Research grid
- Evidence/metric emphasis
- Suggested prompts در Assistant
- Light/Dark themes

### اقتباس با تغییر

- Graph → Systems Map متناسب با Human-Centered AI
- Work Ledger → Impact Ledger با Evidence links
- Manual → How I Work بدون ادعاهای روان‌سنجی افراطی
- Ask AI → RAG با Citation، Refusal و Source control
- Huge typography → Fluid typography سازگار با فارسی

### بهتر است کپی نشود

- Copywriting و استعاره‌های عیناً مشابه
- Persona Graph با همان دسته‌ها و رنگ‌ها
- ادعای Assessmentهای شخصیتی بدون Context
- Typewriter یا Cursor دائمی
- Metricهای بدون Source
- صفحات بسیار Sparse قبل از آماده‌شدن محتوا

---

## 21. معماری اطلاعات پیشنهادی نهایی برای سایت طه

```text
Home
├── Positioning hero
├── Current status
├── Selected systems/projects
├── Research focus
├── Latest writing
├── Evidence strip
└── Contact CTA

Systems Map
├── Interactive graph
├── Filters
├── Search
├── Node details
└── Related content

Work
├── Impact ledger
├── Filters
├── Projects
└── Evidence links

Research
├── Research themes
├── Active projects
├── Publications
├── Methods/datasets
└── Research statement

Writing
├── Blog
├── Research notes
├── Technical notes
└── Categories/tags

Resume
├── Experience
├── Education
├── Skills
├── Certifications
├── Downloadable CV
└── Print view

How I Work
├── Collaboration principles
├── Communication preferences
├── Briefing guide
├── Feedback
└── Availability

Ask Taha
├── Suggested prompts
├── Grounded chat
├── Sources
├── Related links
└── Contact handoff

Contact
├── Form
├── Context selector
├── Availability
└── Social links
```

---

# بخش هفتم — Design System و Component Inventory

## 22. Primitive components

- `AppContainer`
- `AppStack`
- `AppGrid`
- `AppDivider`
- `AppSurface`
- `AppButton`
- `AppIconButton`
- `AppTag`
- `AppChip`
- `AppBadge`
- `AppProgress`
- `AppEmptyState`
- `AppSkeleton`
- `AppErrorState`
- `AppLocaleSwitch`
- `AppThemeSwitch`

## 23. Composite components

- `IdentityMark`
- `PublicHeader`
- `PrimaryNavigation`
- `ContactCTA`
- `SectionEyebrow`
- `DisplayHeadline`
- `AvailabilityBadge`
- `CurrentStatusCard`
- `StatusRow`
- `ImpactMetric`
- `FilterChipGroup`
- `CareerLedger`
- `CareerLedgerRow`
- `ResearchCard`
- `EvidenceLinks`
- `SystemsMap`
- `SystemsMapLegend`
- `SystemsMapDetailPanel`
- `HowIWorkList`
- `AssessmentSummaryCard`
- `SuggestedPromptList`
- `AssistantWorkspace`
- `AssistantSourceChip`
- `AssistantFallback`

## 24. CMS Page blocks موردنیاز

حداقل Blockهای جدید یا تکمیل‌شده:

1. `split_hero`
2. `availability_badge`
3. `status_card`
4. `rich_text`
5. `metric_strip`
6. `featured_projects`
7. `research_grid`
8. `impact_ledger`
9. `filterable_collection`
10. `systems_map`
11. `how_i_work`
12. `progress_metrics`
13. `cta_band`
14. `assistant_embed`
15. `evidence_links`
16. `latest_writing`
17. `logo_cloud` فقط در صورت وجود Evidence واقعی

### ویژگی مشترک همه Blockها

- Locale-independent configuration
- Localized content
- Visibility
- Anchor ID
- Width preset
- Background preset
- Spacing preset
- Alignment
- Sort order
- Optional animation preset
- Preview
- Validation

### محدودیت مهم

Admin نباید Custom CSS آزاد ارائه کند. فقط Presetهای Design System باید انتخاب شوند تا سایت در طول زمان یکپارچه بماند.

---

# بخش هشتم — پیشنهاد Backend/Data Model در Spring Boot

## 25. مدل‌های اصلی

### `site_status_item`

```text
id
stable_key
icon
link_type
link_value
sort_order
visible
created_at
updated_at
```

### `site_status_item_translation`

```text
status_item_id
locale
label
content_markdown
```

### `career_event`

مطابق مدل بخش Work.

### `research_project`

```text
id
stable_key
status
start_date
end_date
year
hero_metric
hero_metric_label
sort_order
published
```

### `research_project_translation`

```text
research_project_id
locale
title
summary
research_question
methods_markdown
results_markdown
limitations_markdown
slug
seo_title
seo_description
```

### `knowledge_node`

```text
id
stable_key
node_type
weight
status
x_position
y_position
published
```

### `knowledge_edge`

```text
id
source_node_id
target_node_id
relation_type
weight
published
```

### `assistant_source`

```text
id
source_type
source_id
locale
public_only
approved_at
content_hash
last_indexed_at
```

---

## 26. APIهای پیشنهادی

```text
GET /api/public/v1/home
GET /api/public/v1/status
GET /api/public/v1/work?type=&page=
GET /api/public/v1/research?topic=&status=&page=
GET /api/public/v1/systems-map
GET /api/public/v1/how-i-work
POST /api/public/v1/assistant/sessions
POST /api/public/v1/assistant/sessions/{id}/messages
GET /api/public/v1/assistant/sessions/{id}/messages
```

Admin:

```text
/api/admin/v1/status-items
/api/admin/v1/career-events
/api/admin/v1/research-projects
/api/admin/v1/knowledge-nodes
/api/admin/v1/knowledge-edges
/api/admin/v1/assistant-sources
/api/admin/v1/assistant-index-jobs
```

### API contract requirements

- Pagination
- Stable error envelope
- Locale validation
- ETag/Last-Modified برای Public content
- Validation errors قابل نمایش در Admin
- Draft/Published separation
- Optimistic locking برای Content editing

---

# بخش نهم — Frontend Implementation در Vue/Quasar

## 27. Routing

```text
/:locale
/:locale/systems-map
/:locale/work
/:locale/research
/:locale/writing
/:locale/resume
/:locale/how-i-work
/:locale/ask
/:locale/contact
```

### الزامات

- Route metadata برای SEO
- Canonical + hreflang
- Locale-aware slugs در صورت نیاز
- Noindex برای Admin و Assistant session URLs
- Route-level code splitting

---

## 28. State management

Pinia storeهای پیشنهادی:

- `useSiteChromeStore`
- `useHomeStore`
- `useWorkStore`
- `useResearchStore`
- `useSystemsMapStore`
- `useAssistantStore`
- `useThemeStore`

Server data باید تا حد امکان در composableهای صفحه نگه داشته شود و Store فقط برای State مشترک یا Session استفاده شود.

---

## 29. Responsive rules

### Desktop

- Hero: 7/5 یا 8/4 columns
- Research: 2 columns
- Manual: 2 columns
- Work: table/ledger

### Tablet

- Hero: 1 column + Status card پایین
- Research: 2 columns در عرض کافی
- Ledger: simplified grid

### Mobile

- Typography با `clamp()`
- Header compact
- CTA داخل menu یا per
