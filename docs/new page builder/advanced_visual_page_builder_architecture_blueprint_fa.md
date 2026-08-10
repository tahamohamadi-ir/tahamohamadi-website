# Blueprint فنی و معماری Advanced Visual Page Builder

**پشته اصلی:** Django / Python + React / TypeScript  
**نوع سند:** Technical Design Document / System Architecture Blueprint  
**تاریخ:** 2026-08-10

---

## خلاصه اجرایی

این سند حاصل دو مرحله است:

1. **Audit دقیق پرامپت اولیه** و شناسایی خلأها، ابهام‌ها و ریسک‌های معماری.
2. **اجرای تحقیق فنی** و تبدیل نتایج به یک Blueprint قابل استفاده برای شروع توسعه واقعی.

### تصمیم نهایی معماری

**معماری پیشنهادی: `Core-owned Hybrid Architecture`**

یعنی:

- GrapesJS، Puck یا Craft.js مالک Core، Schema یا Persistence سیستم نشوند.
- `Document Model`، `Command Engine`، `Component Registry`، `Plugin API`، `Styling/Responsive Model`، `Data Binding`، `Versioning` و `Renderer Contract` در مالکیت خود پروژه باشند.
- برای زیرسیستم‌های تخصصی از Libraryهای مناسب استفاده شود.
- Dependencyهای مهم پشت Adapter/Port قرار گیرند تا در آینده قابل تعویض باشند.

```text
                        ┌────────────────────┐
                        │   React Admin UI   │
                        └─────────┬──────────┘
                                  │
                     ┌────────────▼────────────┐
                     │      Editor Shell       │
                     │ Inspector / Layers / UI │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────▼───────────────────┐
              │            Editor Domain Core         │
              │                                       │
              │ Document Model      Component Registry│
              │ Command Engine      Selection Engine  │
              │ History             Plugin Host       │
              │ Style Resolver      Data Binding      │
              │ Interaction DSL     Animation DSL     │
              └──────────┬─────────────────┬──────────┘
                         │                 │
               ┌─────────▼───────┐ ┌─────▼───────────┐
               │ Specialist Libs │ │  Renderer Core   │
               │ dnd-kit         │ │ deterministic    │
               │ Moveable        │ │ React renderer   │
               │ Tiptap          │ └────────┬─────────┘
               │ Motion / GSAP   │          │
               └─────────────────┘   ┌──────▼──────────┐
                                     │ iframe Preview  │
                                     │ SSR / Prerender │
                                     │ Static Publish  │
                                     └──────┬──────────┘
                                            │
              ┌─────────────────────────────▼──────────────────────────┐
              │                     Django API                         │
              │ Pages / Versions / Assets / Data / Publish / RBAC    │
              └──────────────────────┬─────────────────────────────────┘
                                     │
              ┌──────────────────────▼─────────────────────────────────┐
              │ PostgreSQL + JSONB / Object Storage / Redis / CDN     │
              └────────────────────────────────────────────────────────┘
```

---

# Part 1 — Audit پرامپت

## ارزیابی

| معیار | نمره |
|---|---:|
| پوشش Requirements | **9.8/10** |
| عمق فنی | **9.7/10** |
| توجه به آینده‌پذیری | **9.8/10** |
| Security / Performance | **9.5/10** |
| قابلیت استفاده برای Deep Research | **9.7/10** |
| قابلیت تبدیل مستقیم به Architecture Contract | **8.8/10** |
| محدودکردن Scope | **8.2/10** |
| تعریف Invariantهای معماری | **8.4/10** |
| **امتیاز کلی** | **9.4/10** |

پرامپت از نظر Inventory نیازمندی‌ها بسیار قوی است؛ حتی مواردی مانند 500 تا 1000+ Node، Command Pattern، Autosave، Collaboration، Plugin SDK، AI و Schema Migration را پوشش می‌دهد.

مشکل اصلی کمبود Feature نیست؛ مشکل این است که **Scope بیش از حد باز است و چند تصمیم بنیادین هنوز به‌صورت Invariant قفل نشده‌اند.**

## 20 خلأ و اصلاح ضروری

### 1. Product Boundary مشخص نیست

Requirements فعلی هم‌زمان به سه محصول نزدیک می‌شوند:

```text
Webflow / Framer
+
Headless CMS
+
Low-code Application Builder
```

**پیشنهاد:** V1 را Website/Page Builder تعریف کن، نه Application Builder.

```text
Allowed:
- marketing pages
- landing pages
- content pages
- CMS pages
- product/category pages
- interactive UI
- forms
- dynamic lists
- authenticated content

Not V1:
- arbitrary business logic
- database mutation workflows
- full internal app builder
- arbitrary backend code
- arbitrary JS automation
```

### 2. Source of Truth صریحاً تعریف نشده

از ابتدا invariant شود:

> **Page Schema تنها Source of Truth محتوای Page Builder است.**

نه HTML، نه DOM، نه JSX، نه React Tree و نه مدل داخلی یک Library خارجی.

DOM فقط Projection از Schema است.

### 3. Persistence نباید Library-specific باشد

ذخیره چیزی مانند:

```json
{
  "puckData": {},
  "grapesModel": {}
}
```

اشتباه معماری است.

Persisted Schema باید مستقل باشد تا در آینده بتوان Dependencyهای زیر را عوض کرد:

```text
dnd-kit → library B
Motion → GSAP
Tiptap → Lexical
React renderer → another renderer
```

بدون Migration عظیم Document.

### 4. Editor Model و Runtime Model باید جدا باشند

سه Domain جدا:

```text
DocumentState
EditorSessionState
RuntimeState
```

Editor Session شامل Selection، Hover، Drag، Open Panels، Guidelines، Clipboard و Zoom است و نباید وارد persisted Page Document شود.

### 5. Component Trust Model وجود ندارد

حداقل سه سطح:

```text
Core Component
Trusted Plugin Component
Untrusted / Sandboxed Component
```

و Permissionهای هر سطح متفاوت باشد.

### 6. Schema Migration Contract باید از روز اول باشد

مثلاً:

```json
{
  "type": "core.button",
  "componentVersion": 4
}
```

اگر Button v5 ساختار متفاوتی پیدا کرد:

```text
v3 → v4
v4 → v5
```

Migration باید deterministic و testable باشد.

### 7. Plugin Compatibility Contract کم‌رنگ است

Plugin باید این metadata را داشته باشد:

```text
pluginId
pluginVersion
sdkVersion
requiredCapabilities
dependencies
migrations
permissions
```

نه صرفاً `registerComponent()`.

### 8. Dynamic Data نیاز به DSL رسمی دارد

سه DSL مستقل:

```text
Binding DSL
Query DSL
Expression DSL
```

### 9. Custom JavaScript باید Policy صریح داشته باشد

**Raw Custom JavaScript در V1 خاموش باشد.**

Developer extensibility از طریق Pluginهای version-controlled انجام شود.

### 10. Absolute Positioning باید محدود شود

اگر همه Componentها آزادانه absolute شوند، Responsive behavior شکننده خواهد شد.

Free positioning فقط داخل:

```text
Freeform
Canvas
Overlay
HeroArtboard
```

فعال باشد.

### 11. Performance Budget باید عدد داشته باشد

نمونه Acceptance Contract:

```text
500 nodes:
- selection response < 50ms
- drag frame target ≈ 60fps
- history command < 30ms

1000 nodes:
- no full document rerender
- layers panel remains interactive
- autosave does not block editor
```

این‌ها SLOهای داخلی و قابل Benchmark هستند.

### 12. Browser Matrix تعیین نشده

پیشنهاد:

```text
Latest Chrome
Latest Edge
Latest Firefox
Latest Safari

Editor:
desktop-first

Published output:
desktop + tablet + mobile
```

### 13. Multi-site / Tenant Strategy مشخص نشده

حتی اگر V1 single-site است، `site_id` را در Domain Model پیش‌بینی کن.

### 14. Environment Promotion تعریف نشده

```text
Development
Staging
Production
```

Theme، Template، Plugin و Page Version در آینده باید قابل Promotion باشند.

### 15. Renderer Deployment Contract کم است

Renderer باید Package مستقل باشد؛ Published Page نباید Editor Runtime را لود کند.

### 16. AI Architecture باید محدودتر شود

به‌جای:

```text
Prompt → Page Schema
```

بهتر است:

```text
Prompt
  ↓
AI Planner
  ↓
Validated Builder Commands
  ↓
Policy Engine
  ↓
Schema Validator
  ↓
Dry-run / Diff
  ↓
Apply
```

AI نباید مستقیم Schema یا DB را mutate کند.

### 17. Collaboration Semantics مشخص نشده

قبل از Yjs باید مشخص شود چه چیزی Collaborative است:

```text
whole document?
component subtree?
rich text?
styles?
tokens?
symbols?
```

### 18. License Policy باید Architecture Decision باشد

Dependency approval باید License Review داشته باشد، مخصوصاً برای AGPL و Commercial SDKها.

### 19. Disaster Recovery / Backup کم‌رنگ است

Page Versions، Assets، Published Artifacts، Themes و Templates باید backup/restore policy داشته باشند.

### 20. Definition of Done برای Architecture Spike لازم است

قبل از Full Implementation باید Proof-of-Architecture اجرا شود.

---

# Part 2 — Market & Technology Research

## Puck

Puck یکی از جذاب‌ترین گزینه‌های **React-first** است. مزیت مهم آن این است که Componentهای React خود پروژه را در Visual Editor استفاده می‌کند و Data به‌صورت JSON باقی می‌ماند.

### مزایا

```text
React-native mental model
+
own React components
+
JSON Data
+
relatively low lock-in
```

همچنین iframe viewport، permission، history، plugins و async data capabilities دارد.

### ریسک

- بخشی از extension surfaces و APIهای embedding در حال تکامل‌اند.
- اگر مدل داده و business logic به internals آن گره بخورد، در بلندمدت migration cost ایجاد می‌شود.

### حکم

**بهترین گزینه برای Prototype و Reference Implementation است.**

اما برای پروژه‌ای که باید خودش Command Bus، Interaction DSL، Animation DSL، Responsive Semantics، Data/Query DSL، Plugin Versioning و Collaboration Semantics را کنترل کند، Puck را authoritative core نمی‌کنم.

**Fit: 8.7/10**

---

## GrapesJS

GrapesJS یک framework بالغ برای web builderهای HTML/CSS-oriented است و Component Manager، Style Manager، Blocks، Layers، Commands، Assets، Storage و Pages را پوشش می‌دهد.

### قوت

برای محصولی مانند:

```text
HTML Website Builder
Email Builder
CMS Template Builder
Visual HTML Composer
```

بسیار قدرتمند است.

### ضعف برای پروژه هدف

پروژه هدف semantic React components، typed data binding، design system، server data و AI-ready contracts می‌خواهد.

### حکم

**Reference/alternative engine عالی؛ Core پیشنهادی نیست.**

**Fit: 7.8/10**

---

## Craft.js

React-based drag-and-drop editor framework با Editor، resolver و User Components.

### حکم

برای editor custom کوچک یا متوسط مناسب است، اما برای یک معماری بلندمدت با semantics پیچیده، Core recommendation نیست.

**Fit: 6.8/10**

---

## Builder.io

Visual development platform کامل با Pages، Sections، Data Models، custom React components و API.

### حکم

**Benchmark تجاری بسیار قوی** و مسیر Buy سریع، اما برای هدفی که core ownership، own backend، own plugin API و low vendor lock-in می‌خواهد، انتخاب اصلی نیست.

---

## Mitosis

Page Builder نیست؛ compiler/component abstraction برای تولید component در frameworkهای مختلف است.

### حکم

برای Core فعلی نیاز نیست. فقط اگر multi-framework output در آینده requirement واقعی شد.

---

## Webstudio

یکی از benchmarkهای جالب برای visual web development، Navigator، Canvas و Style Architecture است.

### حکم

برای مطالعه UX و architecture بسیار ارزشمند؛ برای embedded proprietary admin باید Licensing جداگانه بررسی شود.

---

## Plasmic

Visual builder غنی برای React با custom components، variants، states، interactions و data integrations.

### حکم

Benchmark مهم برای Component Registration، Variants، Slots، Dynamic Data و Interaction، اما Core ownership را به آن واگذار نکن.

---

## React Bricks

در دسته Visual Headless CMS قرار می‌گیرد؛ developerها React components/Bricks تعریف می‌کنند و content editors به شکل visual آن‌ها را ویرایش می‌کنند.

### حکم

اگر محصول «Editor امن برای تیم محتوا» بود بسیار جذاب بود، اما هدف فعلی design freedom حرفه‌ای‌تر است.

---

# Part 3 — Technology Comparison Matrix

| ابزار | React-first | Visual Freedom | Component Registry | Dynamic Data | Plugin / Extension | Lock-in | License Concern | مناسب Core |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Puck** | عالی | خوب | عالی | خوب | خوب | پایین | کم | ★★★★☆ |
| **GrapesJS** | متوسط | عالی | خوب | متوسط | عالی | پایین | کم | ★★★☆☆ |
| **Craft.js** | عالی | خوب | خوب | باید ساخت | خوب | پایین | کم | ★★★☆☆ |
| Builder.io | عالی | عالی | عالی | عالی | عالی | بالا | Commercial | ★★☆☆☆ |
| Plasmic | عالی | عالی | عالی | عالی | عالی | متوسط | mixed | ★★☆☆☆ |
| Webstudio | خوب | عالی | خوب | خوب | خوب | پایین | AGPL review | ★★☆☆☆ |
| React Bricks | عالی | متوسط | عالی | خوب | متوسط | متوسط | Commercial ecosystem | ★★☆☆☆ |

**نتیجه:** هیچ‌کدام به‌تنهایی Core Contract موردنیاز را بدون concession معماری ارائه نمی‌کنند.

---

# Part 4 — Build vs Buy vs Hybrid

| معیار | From Scratch | Framework Core | Core-owned Hybrid |
|---|---:|---:|---:|
| سرعت MVP | ضعیف | عالی | خوب |
| کنترل Core | عالی | متوسط | **عالی** |
| Extensibility | عالی | وابسته به framework | **عالی** |
| هزینه اولیه | بسیار بالا | پایین | متوسط |
| Maintenance | بسیار بالا | متوسط | **متوسط** |
| Vendor/API Risk | پایین | بالا | **پایین** |
| Animation Flexibility | عالی | وابسته | **عالی** |
| Dynamic Data | قابل طراحی | framework-dependent | **عالی** |
| AI Readiness | عالی | متوسط | **عالی** |
| Collaboration Readiness | قابل طراحی | framework-dependent | **عالی** |
| تعویض Library | متوسط | ضعیف | **عالی** |

## Recommended Choice

### Strategy C — Core-owned Hybrid

قانون:

> هر Dependency خارجی مهم باید پشت Adapter/Port قرار گیرد، مگر اینکه صرفاً Presentation-level باشد.

```text
Editor Core
   │
   ├── DragDropPort ───── dnd-kit
   ├── TransformPort ──── Moveable
   ├── RichTextPort ───── Tiptap
   ├── AnimationPort ──── Motion
   │                       └─ GSAP adapter
   ├── ValidationPort ─── Ajv
   └── CollaborationPort ─ Yjs [future]
```

---

# Part 5 — Recommended Technology Stack

| Layer | Primary Choice | Fallback / Secondary |
|---|---|---|
| Editor UI | **React + TypeScript** | — |
| Editor Core | **Custom Domain Core** | — |
| Drag & Drop | **dnd-kit** | custom PointerEvents |
| Resize / Rotate / Handles | **Moveable** | Interact.js |
| Rich Text | **Tiptap** | Lexical |
| Document State | **Zustand vanilla store** | Redux Toolkit |
| Workflow State | **XState** | internal FSM |
| Validation | **JSON Schema + Ajv** | — |
| Developer Schemas | **Zod** | — |
| Animation | **Motion** | GSAP |
| Advanced Timeline | **GSAP** | — |
| Expression | **Typed AST / JSONLogic-like** | JsonLogic |
| API | **REST / DRF** | GraphQL data plane |
| Backend | **Django** | — |
| Database | **PostgreSQL relational + JSONB** | — |
| Cache / Ephemeral | **Redis** | — |
| Collaboration | **Yjs + WebSocket** | later |
| Django Realtime | **Django Channels** | — |
| Assets | **S3-compatible object storage** | local FS for dev |
| Published Pages | **Shared React runtime + prerender/SSR** | — |
| Canvas | **same-origin iframe** | DOM canvas in limited cases |
| Unsafe Code | **cross-origin sandbox iframe** | preferably disabled |

---

# Part 6 — Rich Text Editor

## Primary: Tiptap

دلایل:

```text
tables
links
marks
custom nodes
mentions
embedded components
schema extensions
collaboration path
```

Tiptap برای Builder عمومی feature-completeness خوبی دارد.

## Fallback: Lexical

Lexical برای performance، plugin architecture و collaboration path بسیار قوی است و fallback مناسبی محسوب می‌شود.

---

# Part 7 — Animation Architecture

Schema نباید Motion props یا GSAP timeline raw ذخیره کند.

**بد:**

```json
{
  "animate": {
    "motion": {
      "whileInView": {}
    }
  }
}
```

**درست:**

```json
{
  "animationId": "anim.hero.enter"
}
```

```json
{
  "animations": {
    "anim.hero.enter": {
      "trigger": {
        "type": "viewport.enter",
        "threshold": 0.25
      },
      "timeline": [
        {
          "target": "self",
          "from": {
            "opacity": 0,
            "translateY": 24
          },
          "to": {
            "opacity": 1,
            "translateY": 0
          },
          "duration": 450,
          "easing": "ease-out"
        }
      ]
    }
  }
}
```

Compiler:

```text
Animation DSL
    ↓
Animation Compiler
    ├─ CSS / WAAPI
    ├─ Motion
    └─ GSAP
```

---

# Part 8 — Editor Core

```text
EditorKernel
│
├── DocumentService
├── NodeService
├── SelectionService
├── CommandBus
├── HistoryService
├── ClipboardService
├── ComponentRegistry
├── PluginRegistry
├── StyleEngine
├── ResponsiveEngine
├── GeometryService
├── DragDropService
├── DataBindingService
├── QueryService
├── ConditionService
├── InteractionService
├── AnimationService
├── ValidationService
└── EventBus
```

React باید Consumer این Domain باشد، نه اینکه Business Logic در Componentهای UI پخش شود.

---

# Part 9 — State Architecture

## Document State

Persistable:

```text
nodes
styles
bindings
queries
conditions
animations
interactions
SEO
locales
```

## Editor Session State

Non-persisted:

```text
selection
hover
drag
resize
open panels
zoom
viewport
active breakpoint
guidelines
clipboard metadata
```

## Runtime State

```text
modal states
tabs state
accordion state
form state
query results
user context
interaction state
```

**Zustand** برای granular subscriptions و normalized state.  
**XState** برای workflow/FSMها مانند:

```text
idle
selecting
dragging
resizing
editingText
previewing
publishing
```

---

# Part 10 — Node Model

Normalized Document:

```ts
type NodeId = string;

interface PageNode {
  id: NodeId;
  type: string;
  componentVersion: number;

  props: Record<string, unknown>;

  slots: Record<string, NodeId[]>;

  styleRefs: string[];
  bindingRefs?: Record<string, string>;

  visibility?: VisibilityRule;
  conditionId?: string;

  interactionIds?: string[];
  animationIds?: string[];

  metadata?: {
    name?: string;
    locked?: boolean;
    hiddenInEditor?: boolean;
  };
}
```

State:

```json
{
  "rootNodeId": "page-root",
  "nodes": {
    "page-root": {},
    "hero-1": {},
    "heading-1": {}
  }
}
```

مزایا:

```text
O(1) node lookup
selective subscriptions
smaller patches
clean history
easier collaboration
easier diffing
```

---

# Part 11 — Slot Architecture

به‌جای `children[]` ساده، Slotهای معنایی:

```text
Card
├─ media
├─ header
├─ body
└─ footer
```

```json
{
  "slots": {
    "media": ["image-1"],
    "header": ["heading-1"],
    "body": ["paragraph-1"],
    "footer": ["button-1"]
  }
}
```

این مدل برای AI، Drop Validation، Reusable Components، Design System و Component Composition بهتر است.

---

# Part 12 — Component Definition API

```ts
defineComponent({
  type: "marketing.pricing-card",
  version: 3,

  meta: {
    name: "Pricing Card",
    category: "Marketing",
    icon: "credit-card"
  },

  propsSchema: PricingCardSchema,

  defaults: {
    title: "Pro",
    price: 49
  },

  slots: {
    features: {
      accepts: ["content.*", "ui.icon"],
      min: 0,
      max: 20
    },
    actions: {
      accepts: ["ui.button"],
      max: 2
    }
  },

  capabilities: {
    style: true,
    animation: true,
    interactions: true,
    dataBinding: true,
    responsive: true
  },

  inspector: [
    "content",
    "layout",
    "style",
    "animation",
    "data"
  ],

  render: PricingCardRenderer,

  migrations: {
    1: migrate1To2,
    2: migrate2To3
  }
});
```

---

# Part 13 — Component Registry

Registry صرفاً Map نیست:

```text
ComponentRegistry
├── definitions
├── versions
├── renderer adapters
├── inspector schemas
├── slot constraints
├── migration chain
├── capability flags
├── permissions
└── AI metadata
```

AI metadata نمونه:

```json
{
  "purpose": "Primary call-to-action button",
  "bestFor": ["hero", "pricing", "cta"],
  "avoidInside": ["paragraph"],
  "semanticRole": "button"
}
```

---

# Part 14 — Built-in Component Library

## Layout

```text
Page
Section
Container
Box
Stack
Inline
Flex
Grid
Columns
Masonry
Spacer
Divider
AspectRatio
ScrollArea
StickyRegion
Freeform
Portal
```

## Typography

```text
Heading
Text
Paragraph
RichText
Blockquote
List
Code
CodeBlock
Label
Badge
Kbd
```

## Media

```text
Image
Picture
Video
Audio
Embed
Iframe
Gallery
Carousel
Lightbox
Lottie
SVG
Icon
Avatar
```

## UI

```text
Button
IconButton
Card
Tabs
Accordion
Disclosure
Modal
Drawer
Popover
Tooltip
Dropdown
Menu
Alert
ToastTrigger
Progress
Rating
Badge
Chip
Timeline
Stepper
```

## Navigation

```text
Navbar
NavMenu
MegaMenu
Breadcrumb
Pagination
AnchorNavigation
Footer
LanguageSwitcher
```

## Forms

```text
Form
Field
Input
Textarea
Select
Combobox
Checkbox
RadioGroup
Switch
Slider
DatePicker
TimePicker
FileUpload
HiddenField
Submit
CaptchaAdapter
```

## Marketing

```text
Hero
FeatureGrid
CTA
Pricing
Comparison
Testimonial
LogoCloud
FAQ
Stats
Team
Steps
Newsletter
Contact
SocialLinks
```

## CMS / Dynamic

```text
Collection
Repeater
DynamicGrid
Query
CMSField
Conditional
RelatedContent
PaginationController
SearchResults
EmptyState
```

## Advanced

```text
Chart
MapAdapter
Table
DataTable
Countdown
Share
CookieBanner
AuthBoundary
FeatureFlagBoundary
```

همه این‌ها لازم نیست در MVP ساخته شوند.

---

# Part 15 — Layout Engine

چهار Mode اصلی:

```text
Flow
Flex
Grid
Freeform
```

Resize باید semantic باشد.

مثلاً در Grid:

```css
grid-column: span 6;
```

به‌جای تولید بی‌قاعده:

```css
width: 427px;
```

در Flex ممکن است:

```text
flex-basis
min-width
max-width
```

تغییر کند.

در Freeform:

```text
x
y
width
height
```

---

# Part 16 — Geometry / Snapping Engine

```text
GeometryService
│
├── getRect(node)
├── getVisibleRects()
├── hitTest()
├── nearestEdges()
├── nearestCenters()
├── baselineCandidates()
└── spatialIndex
```

Snap Candidates:

```text
container edges
sibling edges
centers
grid lines
spacing tokens
baselines
custom guides
```

Moveable handleها را بدهد، اما snapping semantics در Core بماند.

---

# Part 17 — Responsive Architecture

Storage Model:

```text
Base Style
+
Breakpoint Overrides
```

```json
{
  "base": {
    "display": "grid",
    "gap": "{spacing.8}",
    "columns": 4
  },
  "breakpoints": {
    "tablet": {
      "columns": 2
    },
    "mobile": {
      "columns": 1,
      "gap": "{spacing.4}"
    }
  }
}
```

## Style Resolution

```text
Component Default
      ↓
Theme / Variant
      ↓
Global Classes
      ↓
Node Base
      ↓
Matching Breakpoint Override
      ↓
Pseudo State
      ↓
Temporary Runtime Interaction
```

Breakpoints با ID ذخیره شوند، نه media-query raw داخل هر Node.

---

# Part 18 — Design Token System

```json
{
  "tokens": {
    "color.primary.500": "#4F46E5",
    "spacing.4": "1rem",
    "radius.md": "0.5rem",
    "font.heading": "Inter"
  }
}
```

Node بهتر است token reference نگه دارد:

```json
{
  "color": {
    "$token": "color.primary.500"
  }
}
```

نه resolved value تکراری.

Output Compiler:

```text
tokens
→ CSS custom properties
```

---

# Part 19 — CSS Architecture

**Recommended: Hybrid Generated CSS + CSS Variables**

Page Schema نباید Tailwind class را Persistence Format کند.

```json
{
  "paddingInline": {
    "$token": "spacing.6"
  }
}
```

Compiler:

```css
:root {
  --spacing-6: 1.5rem;
}

.c_8f321 {
  padding-inline: var(--spacing-6);
}
```

مزایا:

```text
deterministic
deduplicated
cacheable
SSR-friendly
independent from Tailwind
```

Tailwind فقط می‌تواند برای UI خود Editor استفاده شود.

---

# Part 20 — Pseudo States

Supported:

```text
hover
focus
focus-visible
active
disabled
visited — where safe
```

```json
{
  "states": {
    "hover": {
      "background": {
        "$token": "color.primary.600"
      }
    }
  }
}
```

---

# Part 21 — Interaction Engine

مدل:

```text
Trigger
  ↓
Condition
  ↓
Action
```

```json
{
  "id": "interaction-1",
  "trigger": {
    "type": "pointer.click",
    "target": "self"
  },
  "condition": {
    "op": "eq",
    "args": [
      {"ctx": "user.authenticated"},
      true
    ]
  },
  "actions": [
    {
      "type": "modal.open",
      "target": "modal-login"
    }
  ]
}
```

## Trigger Registry

```text
pointer.click
pointer.doubleClick
pointer.enter
pointer.leave
focus
blur
viewport.enter
viewport.leave
scroll.progress
scroll.direction
page.load
page.visible
form.submit
form.success
form.error
keyboard.key
timer
data.loaded
data.changed
component.stateChanged
```

## Action Registry

```text
navigate
scrollTo
modal.open
modal.close
drawer.open
drawer.close
state.set
state.toggle
class.add
class.remove
class.toggle
animation.play
animation.pause
animation.reverse
video.play
video.pause
form.submit
form.reset
query.refresh
copyToClipboard
emitEvent
```

Pluginها بتوانند Trigger و Action جدید Register کنند.

---

# Part 22 — Safe Expression Engine

**`eval()` و `new Function()` ممنوع.**

Typed AST / JSONLogic-like model:

```json
{
  "op": "and",
  "args": [
    {
      "op": "eq",
      "args": [
        {"ctx": "user.authenticated"},
        true
      ]
    },
    {
      "op": "gt",
      "args": [
        {"binding": "product.stock"},
        0
      ]
    }
  ]
}
```

Allowed Operators:

```text
eq neq
gt gte lt lte
and or not
in contains
exists
startsWith
endsWith
isEmpty
```

هیچ arbitrary method call.

---

# Part 23 — Data Binding

Binding باید Reference باشد:

```json
{
  "id": "binding.product-title",
  "source": "query.product",
  "path": ["title"],
  "fallback": "Untitled product"
}
```

Node:

```json
{
  "bindingRefs": {
    "text": "binding.product-title"
  }
}
```

Context Precedence:

```text
Component local variables
Repeater item
Query result
Page variables
Route params
Query params
Current user
Global context
```

---

# Part 24 — Visual Query Builder

```json
{
  "id": "query.products",
  "source": "catalog.products",

  "select": [
    "id",
    "title",
    "slug",
    "price",
    "image"
  ],

  "where": {
    "op": "and",
    "args": [
      {
        "op": "eq",
        "field": "category_id",
        "value": {
          "context": "route.categoryId"
        }
      },
      {
        "op": "gt",
        "field": "stock",
        "value": 0
      }
    ]
  },

  "orderBy": [
    {
      "field": "created_at",
      "direction": "desc"
    }
  ],

  "limit": 12
}
```

Client نباید arbitrary Django app/model/field/relationship را Query کند.

Backend Registry:

```python
register_data_source(
    "catalog.products",
    model=Product,
    fields=[
        "id",
        "title",
        "slug",
        "price",
        "image",
        "category_id",
    ],
    filters=[...],
    permissions=[...],
    max_limit=100,
)
```

Query AST سپس به Django ORM ترجمه شود.

---

# Part 25 — REST vs GraphQL

## Control Plane

**REST + Django REST Framework** برای:

```text
page CRUD
draft
autosave
versions
publish
templates
assets
themes
plugins
audit
```

## Data Plane

GraphQL فقط در صورت نیاز برای:

```text
CMS queries
complex nested projections
third-party GraphQL data sources
```

## نتیجه

```text
REST = mandatory
GraphQL = optional data adapter
```

---

# Part 26 — Canvas Architecture

| معماری | CSS Isolation | Responsive Fidelity | Security | Complexity | Recommendation |
|---|---:|---:|---:|---:|---|
| same DOM | ضعیف | متوسط | ضعیف | کم | نه |
| Shadow DOM | خوب | متوسط | Security boundary نیست | متوسط | نه |
| iframe | **عالی** | **عالی** | خوب | بالا | **بله** |

## انتخاب

### Same-origin iframe برای Trusted Canvas

```text
Editor Shell
      │
      │ MessageChannel
      ▼
Canvas iframe
      │
      └── Shared Renderer Runtime
```

Bridge Events:

```text
SELECT
HOVER
RECT_CHANGED
KEY_EVENT
DROP_TARGET
SCROLL
VIEWPORT_CHANGED
```

هدف این است که Canvas تا حد ممکن همان Environment خروجی نهایی را ببیند.

---

# Part 27 — چرا Fabric.js / Konva Canvas اصلی نباشند؟

Page Builder باید در نهایت:

```text
semantic HTML
CSS Grid
Flex
forms
SEO
ARIA
responsive layout
real browser text flow
```

تولید کند.

اگر Editor را روی Canvas2D بنا کنی، عملاً بخشی از browser layout engine را دوباره شبیه‌سازی می‌کنی.

Fabric/Konva فقط برای Componentهای خاص:

```text
Freeform graphics
poster
diagram
custom graphic canvas
image annotation
```

مناسب‌اند.

---

# Part 28 — Page JSON Schema

نمونه واقعی:

```json
{
  "schemaVersion": "1.0.0",

  "document": {
    "id": "page_home",
    "siteId": "site_main",
    "title": "Home",
    "locale": "fa-IR",
    "direction": "rtl"
  },

  "rootNodeId": "node_page",

  "nodes": {
    "node_page": {
      "id": "node_page",
      "type": "core.page",
      "componentVersion": 1,
      "props": {},
      "slots": {
        "children": ["hero_1"]
      },
      "styleRefs": ["style_page"]
    },

    "hero_1": {
      "id": "hero_1",
      "type": "layout.section",
      "componentVersion": 2,
      "props": {
        "semanticTag": "section"
      },
      "slots": {
        "children": [
          "hero_title",
          "hero_cta"
        ]
      },
      "styleRefs": ["style_hero"],
      "animationIds": ["animation_hero"],
      "metadata": {
        "name": "Hero"
      }
    },

    "hero_title": {
      "id": "hero_title",
      "type": "content.heading",
      "componentVersion": 3,
      "props": {
        "level": 1,
        "text": "عنوان صفحه"
      },
      "slots": {},
      "styleRefs": ["style_heading"]
    },

    "hero_cta": {
      "id": "hero_cta",
      "type": "ui.button",
      "componentVersion": 4,
      "props": {
        "label": "مشاهده محصولات",
        "variant": "primary"
      },
      "slots": {},
      "styleRefs": ["style_button"],
      "interactionIds": ["interaction_cta"]
    }
  },

  "styles": {
    "style_page": {
      "base": {
        "backgroundColor": {
          "$token": "color.background"
        }
      }
    },

    "style_hero": {
      "base": {
        "display": "grid",
        "minHeight": "70vh",
        "paddingBlock": {
          "$token": "spacing.16"
        },
        "gap": {
          "$token": "spacing.8"
        }
      },

      "breakpoints": {
        "bp_tablet": {
          "minHeight": "auto"
        },

        "bp_mobile": {
          "paddingBlock": {
            "$token": "spacing.8"
          }
        }
      }
    },

    "style_heading": {
      "base": {
        "fontSize": {
          "$token": "fontSize.display"
        },
        "color": {
          "$token": "color.text.primary"
        }
      }
    }
  },

  "bindings": {},
  "queries": {},
  "conditions": {},

  "interactions": {
    "interaction_cta": {
      "trigger": {
        "type": "pointer.click",
        "target": "self"
      },
      "actions": [
        {
          "type": "navigate",
          "to": "/products"
        }
      ]
    }
  },

  "animations": {
    "animation_hero": {
      "trigger": {
        "type": "viewport.enter",
        "once": true
      },
      "timeline": [
        {
          "target": "self",
          "from": {
            "opacity": 0,
            "translateY": 24
          },
          "to": {
            "opacity": 1,
            "translateY": 0
          },
          "duration": 500
        }
      ]
    }
  },

  "seo": {
    "title": "صفحه اصلی",
    "description": "..."
  }
}
```

---

# Part 29 — JSON Schema Validation

Canonical Contract:

```text
Persistence contract = JSON Schema 2020-12
Developer ergonomics = Zod
Browser validation = Ajv
```

این تفکیک اجازه می‌دهد persistence cross-language باشد، در حالی که TypeScript DX قوی باقی بماند.

---

# Part 30 — Command Architecture

**هیچ UI Component نباید مستقیم Document را mutate کند.**

بد:

```ts
store.nodes[id].props.text = value;
```

درست:

```ts
commandBus.execute({
  type: "node.updateProps",
  payload: {
    nodeId,
    patch: {
      text: value
    }
  }
});
```

Command Result:

```ts
interface CommandResult {
  patches: Patch[];
  inversePatches: Patch[];
  affectedNodeIds: string[];
}
```

Flow:

```text
Command
  ↓
Validate
  ↓
Apply
  ↓
Patch
  ↓
Inverse Patch
  ↓
History Entry
```

---

# Part 31 — Drag / Resize History

بد:

```text
pointermove → history
pointermove → history
pointermove → history
...
```

درست:

```text
Drag Start
   ↓
Transient state

Pointer Move × N
   ↓
visual update only

Drag End
   ↓
ONE MoveNodeCommand
```

Resize نیز همین الگو را داشته باشد.

---

# Part 32 — History Engine

```ts
HistoryEntry {
  id
  commandType
  patches
  inversePatches
  timestamp
  actor
  affectedNodes
}
```

Capabilities:

```text
Undo
Redo
Transaction
Coalesce
Checkpoint
History Limit
```

Text typing باید Coalesce شود تا هر keystroke یک History Entry مستقل نسازد.

---

# Part 33 — Autosave Architecture

```text
Document Commands
      ↓
Dirty Queue
      ↓
Debounce
      ↓
Patch Batch
      ↓
PATCH /draft
      ↓
Optimistic concurrency
```

Request:

```json
{
  "baseRevision": 193,
  "clientMutationId": "uuid",
  "patches": []
}
```

Server:

```text
currentRevision == baseRevision?
     │
    yes
     ↓
atomic apply
revision = 194
```

اگر mismatch:

```http
409 Conflict
```

Browser Recovery در IndexedDB:

```text
last known draft
uncommitted command queue
timestamp
```

---

# Part 34 — Versioning

Autosave را با immutable Version قاطی نکن.

```text
Page
 ├─ Working Draft
 │
 └─ Versions
     ├─ v1
     ├─ v2
     ├─ v3
     └─ ...
```

### PageDraft

Mutable.

### PageVersion

Immutable Snapshot.

Version در این Eventها ساخته شود:

```text
manual checkpoint
review submission
publish
scheduled publish
restore
important milestone
```

نه روی هر Keystroke.

---

# Part 35 — Database Strategy

| روش | مزیت | مشکل |
|---|---|---|
| فقط JSONB | ساده و Flexible | lifecycle/query/audit/permissions محدودتر |
| Node table per component | Queryable | write amplification و reconstruction پیچیده |
| **Hybrid** | **بهترین تعادل** | کمی Architecture پیچیده‌تر |

## انتخاب

### Hybrid Relational + JSONB Snapshots

Relational:

```text
Page
PageVersion
PageDraft
Site
Theme
Asset
Publish
Template
GlobalComponent
DesignTokenSet
DataSource
Redirect
AuditLog
```

Document Contents:

```text
JSONB
```

---

# Part 36 — Django Models

```python
class Page(models.Model):
    site = models.ForeignKey("Site", on_delete=models.CASCADE)

    slug = models.SlugField()
    title = models.CharField(max_length=255)

    current_published_version = models.ForeignKey(
        "PageVersion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    status = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class PageDraft(models.Model):
    page = models.OneToOneField(
        Page,
        on_delete=models.CASCADE,
        related_name="draft",
    )

    schema = models.JSONField()
    revision = models.PositiveBigIntegerField(default=0)

    schema_version = models.CharField(max_length=32)
    content_hash = models.CharField(max_length=64)

    updated_at = models.DateTimeField(auto_now=True)


class PageVersion(models.Model):
    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="versions",
    )

    version_number = models.PositiveIntegerField()

    schema = models.JSONField()
    schema_version = models.CharField(max_length=32)

    content_hash = models.CharField(max_length=64)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
    )

    created_at = models.DateTimeField(auto_now_add=True)
```

مدل‌های تکمیلی:

```text
Publish
RenderArtifact
PageTemplate
ComponentTemplate
GlobalComponent
GlobalComponentVersion
Theme
DesignTokenSet
Asset
DataSource
AuditLog
Comment
PreviewSession
Redirect
```

---

# Part 37 — Django Version Strategy

برای پروژه Production بلندمدت، LTS در اولویت است.

**Primary:** آخرین Patch از Django 5.2 LTS برای پروژه جدید محافظه‌کارانه مناسب است.

**Migration Target:** LTS بعدی پس از انتشار و تثبیت.

اگر پروژه موجود روی نسخه جدیدتر و پایدار است، صرفاً به‌خاطر این توصیه downgrade لازم نیست.

---

# Part 38 — Publishing Architecture

Workflow:

```text
Draft
  ↓
Review
  ↓
Approved
  ↓
Scheduled
  ↓
Published
  ↓
Archived
```

Publish Operation:

```text
Immutable PageVersion
       ↓
Schema Validation
       ↓
Component Version Validation
       ↓
Binding Validation
       ↓
Security Validation
       ↓
Accessibility Lint
       ↓
SEO Validation
       ↓
Renderer / Compiler
       ↓
HTML
CSS
JS chunks
Asset manifest
       ↓
Object Storage / CDN
       ↓
Atomic release pointer switch
       ↓
Cache invalidation
```

Rollback نباید rebuild کامل باشد؛ با Release Pointer انجام شود.

---

# Part 39 — Rendering Engine

بزرگ‌ترین اصل:

> **Editor Renderer و Published Renderer باید Component Registry مشترک داشته باشند.**

```text
@builder/schema
@builder/registry
@builder/runtime
@builder/style-engine
@builder/data-runtime

Editor
  └── @builder/runtime

Preview
  └── @builder/runtime

SSR
  └── @builder/runtime

Prerender
  └── @builder/runtime
```

اگر Preview و Production Renderer متفاوت باشند، WYSIWYG از بین می‌رود.

---

# Part 40 — CSR vs SSR vs Static

## Static-first

برای:

```text
landing pages
about
marketing
documentation
mostly-static CMS
```

```text
schema
→ prerender
→ HTML/CSS
→ CDN
```

## Dynamic SSR

برای:

```text
personalized content
authenticated content
request-dependent pages
```

## Client Runtime

فقط Componentهای Interactive Hydrate شوند.

**CSR-only برای Published Pages توصیه نمی‌شود.**

---

# Part 41 — Preview Architecture

سه Mode:

```text
Editor Canvas
Draft Preview
Published Preview
```

Draft Preview:

```text
short-lived signed preview token
```

URL:

```text
/preview/{token}
```

Token باید با این contextها مرتبط باشد:

```text
page
draft revision
user
expiration
permissions
```

---

# Part 42 — Symbols / Global Components

```text
GlobalComponent
     │
     ├── Version 1
     ├── Version 2
     └── Version 3
```

Instance:

```json
{
  "type": "symbol.instance",
  "symbolId": "navbar.main",
  "versionPolicy": "latest-compatible",
  "overrides": {
    "cta.label": "ورود"
  }
}
```

Detach:

```text
Symbol Instance
      ↓
materialize resolved subtree
      ↓
regular local nodes
```

---

# Part 43 — Component Variants

```ts
variants: {
  visual: [
    "primary",
    "secondary",
    "outline",
    "ghost"
  ],

  size: [
    "sm",
    "md",
    "lg"
  ]
}
```

Node:

```json
{
  "props": {
    "variant": {
      "visual": "primary",
      "size": "lg"
    }
  }
}
```

---

# Part 44 — Template Architecture

چهار سطح:

```text
PageTemplate
SectionTemplate
BlockTemplate
ComponentPreset
```

Template باید داشته باشد:

```text
schema fragment
required components
required plugins
token references
schemaVersion
```

Import Pipeline:

```text
compatibility check
plugin check
component version migration
token resolution
```

---

# Part 45 — Asset Manager

Metadata در PostgreSQL:

```text
id
site
owner
mime
width
height
duration
size
hash
alt
tags
metadata
created_at
```

Binary:

```text
S3-compatible object storage
```

Pipeline:

```text
upload
 ↓
MIME verify
 ↓
virus scan
 ↓
metadata extraction
 ↓
sanitize SVG
 ↓
image variants
 ↓
AVIF/WebP
 ↓
CDN
```

---

# Part 46 — Security Architecture

## XSS / HTML

Defense in depth:

```text
Browser sanitization
+
Server sanitization
+
CSP
```

## SVG

ممنوع/پاک‌سازی:

```text
script
event handlers
foreignObject
external refs
dangerous URLs
```

برای SVG ناشناس می‌توان حتی Rasterized Variant تولید کرد.

## Custom CSS

Regex کافی نیست:

```text
CSS
→ parser
→ AST
→ validation
→ selector scoping
→ output
```

Policy پیش‌فرض:

```text
@import = deny
javascript-like urls = deny
remote URLs = policy controlled
```

## Custom JS

### Recommendation

**Disabled by default.**

Developer به‌جای آن Trusted Plugin می‌سازد.

اگر Requirement قطعی شد:

```text
separate-origin iframe sandbox
strict CSP
explicit capabilities
network allowlist
no parent DOM access
no auth cookie access
```

## Trusted Types / CSP

CSP و Trusted Types برای کاهش DOM XSS در مرورگرهای پشتیبانی‌شده پیشنهاد می‌شود.

---

# Part 47 — Permission Model

صرفاً RBAC کافی نیست.

Hybrid RBAC + Resource Capabilities:

```text
Admin
Developer
Designer
Editor
Content Manager
Reviewer
Viewer
```

Permission Examples:

```text
page.create
page.edit
page.publish
page.delete

component.insert.*
component.editContent
component.editStyle
component.editInteraction

customCss.edit
customHtml.edit
plugin.install

asset.upload

theme.edit
token.edit

dataSource.manage
```

مثلاً Content Manager:

```text
can edit text/images
cannot change layout
cannot add custom CSS
cannot alter query
cannot install plugin
```

---

# Part 48 — Plugin Architecture

Plugin API نباید دسترسی مستقیم به Store بدهد.

```ts
interface BuilderPlugin {
  id: string;
  version: string;
  sdkVersion: string;

  setup(ctx: PluginContext): void;

  migrations?: PluginMigration[];
}
```

Context:

```ts
ctx.components.register(...)
ctx.inspector.register(...)
ctx.commands.register(...)
ctx.actions.register(...)
ctx.triggers.register(...)
ctx.dataSources.register(...)
ctx.validators.register(...)
ctx.assets.registerProcessor(...)
ctx.toolbar.register(...)
```

ممنوع:

```ts
ctx.store.setState(...)
```

Plugin فقط از Public Service Contract استفاده کند.

---

# Part 49 — Plugin Permissions

Manifest:

```json
{
  "id": "commerce",
  "version": "2.1.0",
  "sdkVersion": "^1.4",

  "capabilities": [
    "component.register",
    "dataSource.register"
  ],

  "network": [
    "api.example.com"
  ]
}
```

این مدل در آینده برای Enterprise Governance مهم است.

---

# Part 50 — AI-ready Architecture

Prompt:

```text
یک Hero Section برای SaaS بساز
```

Flow:

```text
Prompt
  ↓
Intent Parser
  ↓
Registry Context
  ↓
Allowed Components
  ↓
Allowed Design Tokens
  ↓
Plan
  ↓
Command Proposal
  ↓
Schema Validation
  ↓
Policy Validation
  ↓
Preview Diff
  ↓
Command Transaction
```

AI Output:

```json
{
  "commands": [
    {
      "type": "node.insert",
      "parentId": "page",
      "component": "layout.section"
    },
    {
      "type": "node.insert",
      "parentId": "$previous",
      "component": "content.heading",
      "props": {
        "text": "Build faster with..."
      }
    }
  ]
}
```

نه raw HTML و نه direct DB mutation.

---

# Part 51 — Collaboration Architecture

Core از ابتدا Collaboration-ready باشد:

```text
commands
stable node IDs
versioned schema
patches
actor IDs
transaction IDs
```

بعد:

```text
Yjs document
+
Awareness
+
Django Channels gateway
+
Redis
```

**Full Collaboration در MVP ساخته نشود.**

---

# Part 52 — Rich Text Collaboration Roadmap

```text
Phase 1:
single-user page
multi-user comments

Phase 2:
collaborative rich text

Phase 3:
component locking

Phase 4:
full CRDT page editing
```

---

# Part 53 — Editor Performance برای 1000+ Node

اصول کلیدی:

### Normalized State

بله.

### Node-level Subscription

هر Component فقط Node خودش را Subscribe کند.

### Ephemeral Pointer State

Drag/Resize values در global React rerender path نروند.

ترجیح:

```text
ref
external store
requestAnimationFrame
```

### Layers Virtualization

حتماً.

### Inspector Lazy Loading

هر Panel فقط هنگام بازشدن Mount شود.

### Geometry Cache

```text
ResizeObserver
+
cached DOMRects
```

### Web Worker

برای:

```text
schema validation
large diff
search index
template indexing
compression
migration calculation
```

مناسب است.

DOM Measurement را Worker نمی‌تواند انجام دهد.

---

# Part 54 — Canvas Rendering Optimization

Canvas واقعی را بی‌دلیل virtualize نکن؛ چون browser layout relationships ممکن است بشکنند.

به‌جای آن:

```text
memoized node render
stable props
style hash
incremental registry resolution
lazy complex widgets
defer offscreen heavy media
```

---

# Part 55 — Accessibility

Component Definition باید Accessibility Contract داشته باشد.

مثلاً:

Image:

```text
alt required
```

Button:

```text
must have accessible name
```

Heading:

```text
warn heading level jumps
```

Editor Audit:

```text
missing alt
empty button
link without text
color contrast
heading hierarchy
invalid ARIA
focus issues
```

---

# Part 56 — RTL / Internationalization

برای فارسی CSS Logical Properties را native model کن.

بد:

```text
margin-left
padding-right
```

بهتر:

```text
margin-inline-start
padding-inline-end
```

Document:

```json
{
  "locale": "fa-IR",
  "direction": "rtl"
}
```

Translation Strategy پیش‌فرض:

```text
shared structure
+
localized props
```

مثلاً:

```json
{
  "title": {
    "en-US": "About us",
    "fa-IR": "درباره ما"
  }
}
```

Locale-specific structure فقط در موارد استثنایی مجاز باشد.

---

# Part 57 — SEO

Page Model:

```text
meta title
meta description
canonical
robots
Open Graph
Twitter/X metadata
structured data
redirects
```

Renderer باید SEO metadata را server-side تولید کند.

Schema.org JSON-LD نیز باید Validate و safe-serialize شود.

---

# Part 58 — Observability

چهار نوع Telemetry:

```text
Application telemetry
Editor UX telemetry
Publish pipeline telemetry
Audit / security logs
```

Metricهای مهم:

```text
editor load
page node count
command latency
drag frame time
autosave latency
autosave conflicts
schema validation duration
publish duration
publish failure rate
renderer duration
asset processing duration
```

Audit Record:

```text
user
action
resource
beforeVersion
afterVersion
time
IP/session
```

---

# Part 59 — API Specification

```http
GET    /api/v1/pages
POST   /api/v1/pages

GET    /api/v1/pages/{pageId}
PATCH  /api/v1/pages/{pageId}

GET    /api/v1/pages/{pageId}/draft
PATCH  /api/v1/pages/{pageId}/draft

POST   /api/v1/pages/{pageId}/validate

GET    /api/v1/pages/{pageId}/versions
GET    /api/v1/pages/{pageId}/versions/{versionId}

POST   /api/v1/pages/{pageId}/versions/{versionId}/restore

POST   /api/v1/pages/{pageId}/publish
POST   /api/v1/pages/{pageId}/schedule
POST   /api/v1/pages/{pageId}/unpublish

POST   /api/v1/pages/{pageId}/duplicate

GET    /api/v1/component-manifest

GET    /api/v1/templates
POST   /api/v1/templates

GET    /api/v1/symbols
POST   /api/v1/symbols

GET    /api/v1/themes

GET    /api/v1/assets
POST   /api/v1/assets/upload/init
POST   /api/v1/assets/upload/complete

GET    /api/v1/data-sources

POST   /api/v1/queries/validate
POST   /api/v1/queries/preview

POST   /api/v1/preview-sessions

GET    /api/v1/audit-log
```

Command-like APIs:

```text
publish
duplicate
restore
upload finalize
```

باید `Idempotency-Key` پشتیبانی کنند.

---

# Part 60 — Folder / Package Architecture

Monorepo-style package boundaries:

```text
project/
│
├── frontend/
│   │
│   ├── apps/
│   │   └── admin-editor/
│   │
│   └── packages/
│       │
│       ├── builder-schema/
│       │   ├── document/
│       │   ├── nodes/
│       │   ├── styles/
│       │   └── migrations/
│       │
│       ├── builder-core/
│       │   ├── commands/
│       │   ├── history/
│       │   ├── selection/
│       │   ├── clipboard/
│       │   └── events/
│       │
│       ├── builder-registry/
│       ├── builder-state/
│       │
│       ├── builder-canvas/
│       │   ├── bridge/
│       │   ├── geometry/
│       │   ├── selection/
│       │   ├── dnd/
│       │   └── resize/
│       │
│       ├── builder-style-engine/
│       ├── builder-responsive/
│       │
│       ├── builder-data/
│       │   ├── bindings/
│       │   ├── expressions/
│       │   └── queries/
│       │
│       ├── builder-interactions/
│       ├── builder-animations/
│       ├── builder-runtime/
│       ├── builder-renderer/
│       ├── builder-components/
│       ├── builder-richtext/
│       ├── builder-plugin-sdk/
│       └── builder-testing/
│
├── backend/
│   │
│   ├── config/
│   │
│   └── apps/
│       ├── sites/
│       ├── pages/
│       ├── publishing/
│       ├── components/
│       ├── templates/
│       ├── themes/
│       ├── assets/
│       ├── data_sources/
│       ├── permissions/
│       ├── previews/
│       ├── realtime/
│       └── audit/
│
└── render-service/
    ├── runtime/
    ├── prerender/
    ├── ssr/
    └── compiler/
```

---

# Part 61 — Data Flow

```text
                    User Action
                        │
                        ▼
                   Editor UI
                        │
                        ▼
                    Command
                        │
                        ▼
                  Command Bus
                        │
             ┌──────────┴───────────┐
             ▼                      ▼
       Document Store            History
             │
             ▼
       Schema Validator
             │
             ▼
        Autosave Queue
             │
             ▼
          REST API
             │
             ▼
          Django
             │
             ▼
     PostgreSQL PageDraft
```

Publish:

```text
PageDraft
   ↓
immutable PageVersion
   ↓
validation
   ↓
Renderer
   ↓
HTML + CSS + JS + assets
   ↓
Object Store / CDN
   ↓
Published Pointer
```

Editor Preview:

```text
Document Store
   ↓
shared Runtime
   ↓
iframe
```

---

# Part 62 — Testing Architecture

## Unit

```text
commands
history
style resolution
responsive inheritance
expressions
query parser
migrations
component registry
```

## Property / Invariant Tests

```text
node cannot reference missing child
tree cannot cycle
component slot constraints always hold
undo(command(x)) == previous state
```

## Integration

```text
editor + registry
canvas bridge
autosave
publish
asset manager
```

## E2E

```text
insert
drag
resize
copy
paste
undo
redo
breakpoint
binding
preview
publish
restore
```

## Visual Regression

برای:

```text
desktop
tablet
mobile
RTL
LTR
```

## Performance Regression Fixtures

```text
100 nodes
500 nodes
1000 nodes
2000 nodes stress
```

---

# Part 63 — Architectural Invariants

این موارد باید Contract رسمی پروژه شوند:

1. **Page Schema is the canonical source of truth.**
2. Persisted documents must never depend on editor libraries.
3. Persisted documents must never contain executable JavaScript functions.
4. Editor state and page document state must remain separate.
5. All document mutations must pass through the Command Engine.
6. All components must be versioned and migratable.
7. All plugins must be versioned and use a stable public Plugin API.
8. The Renderer must be reusable independently from the Editor.
9. Editor Preview and Published Rendering must use the same Component Registry.
10. Dynamic data access must pass through registered Data Sources.
11. Conditions must use a safe Expression DSL; `eval` is forbidden.
12. Animations and interactions must use library-neutral DSLs.
13. Published PageVersion objects must be immutable.
14. Custom JavaScript is disabled by default.
15. AI changes must be expressed as validated Builder Commands.
16. Layout semantics should remain DOM/CSS-native.
17. Absolute positioning is restricted to explicit freeform contexts.
18. Schema and Plugin compatibility must be testable automatically.
19. Every public extension point must have a versioned contract.
20. Core Architecture must remain usable without Puck، GrapesJS، Tiptap، Motion، GSAP یا dnd-kit.

مورد 20 حیاتی است؛ Libraryها باید قابل تعویض بمانند.

---

# Part 64 — Development Roadmap

## Phase 0 — Architecture Spike

### Tasks

```text
Page schema v0
Component registry
iframe canvas
10 components
dnd-kit
Moveable
selection
resize
command engine
undo/redo
serialization
reload roundtrip
```

### Acceptance Criteria

```text
100 nodes
nested slots
drag/drop
resize
undo
redo
save
reload
render

without architecture-specific hacks
```

اگر Phase 0 شکست خورد، همین‌جا Architecture اصلاح شود.

---

## Phase 1 — Editor Kernel

### Deliverables

```text
normalized document
commands
history
selection
multi-selection
clipboard
keyboard
layers
canvas bridge
autosave
```

### Risks

Command Granularity و synchronization بین Selection و DOM.

### Acceptance

```text
500-node benchmark
no full-document rerender
stable undo/redo
crash recovery
```

---

## Phase 2 — Layout + Style + Responsive

```text
Flex
Grid
Flow
Freeform
spacing
size
position
style engine
tokens
breakpoints
pseudo states
```

### Acceptance

ساخت یک Landing Page نسبتاً پیچیده بدون Custom CSS.

---

## Phase 3 — Component Ecosystem

```text
30–40 core components
Tiptap
media
forms
navigation
component SDK
component migration
```

### Acceptance

Developer بتواند بدون تغییر Editor Core یک Component جدید اضافه کند.

---

## Phase 4 — Design System

```text
tokens
themes
global classes
variants
symbols
templates
presets
```

### Acceptance

Navbar Global در چندین Page تغییر کند و همه Instanceهای مرتبط به‌درستی Update شوند.

---

## Phase 5 — Dynamic Data

```text
DataSource Registry
Binding DSL
Expression DSL
Query DSL
Repeater
Dynamic Grid
Current User
URL Params
```

### Acceptance

یک Product Listing و Product Detail فقط با Builder ساخته شود.

---

## Phase 6 — Interactions + Animation

```text
Interaction DSL
Animation DSL
Motion adapter
GSAP adapter
timeline UI
scroll trigger
hover
click
modal
```

### Acceptance

Landing Page حرفه‌ای با Scroll/Hover/Timeline بدون Custom JS ساخته شود.

---

## Phase 7 — Production Renderer

```text
SSR
prerender
CSS compiler
asset manifest
SEO
CDN
publish
rollback
scheduled publishing
preview
```

### Acceptance

Published App **هیچ Editor Dependency** لود نکند.

---

## Phase 8 — Hardening

```text
RBAC
CSP
sanitization
a11y
RTL
i18n
audit
telemetry
performance
security testing
```

### Acceptance

Production Readiness Checklist کامل شود.

---

## Phase 9 — Collaboration

```text
comments
presence
locks
rich text collaboration
Yjs adapter
full collaboration experiments
```

---

## Phase 10 — AI

```text
AI command generation
layout generation
copy
image
style
accessibility audit
refactoring
responsive fix
```

AI فقط Public SDK / Command APIs را مصرف کند.

---

# Part 65 — چه چیزی در MVP نسازیم؟

برای جلوگیری از Scope Explosion:

```text
full CRDT collaboration
arbitrary JS
WebGL canvas
custom backend logic
marketplace
complex workflow automation
multi-framework renderer
AI generation
advanced GSAP timeline editor
full database builder
```

اصل:

```text
Architect now
Implement later
```

---

# Part 66 — تصمیم نهایی درباره Puck

برای PoC می‌توان Puck را استفاده کرد تا سریع custom React components، slots، iframe و viewport behavior آزمایش شوند.

اما این مسیر توصیه نمی‌شود:

```text
Puck Data
    ↓
6 months
    ↓
Custom Puck extensions
    ↓
12 months
    ↓
business logic depends on Puck internals
```

مسیر بهتر:

```text
Our Page Schema
     │
Our Core
     │
dnd-kit / Moveable / Tiptap / Motion
```

---

# Part 67 — تصمیم نهایی درباره GrapesJS

اگر محصول این بود:

> «کاربر بتواند آزادانه HTML/CSS page بسازد»

GrapesJS Core Candidate جدی‌تری بود.

برای پروژه فعلی:

```text
Study GrapesJS
borrow ideas
do not inherit its document semantics
```

---

# Part 68 — ADRهای اصلی

| ADR | Decision |
|---|---|
| ADR-001 | Core-owned Hybrid Architecture |
| ADR-002 | Semantic JSON is Source of Truth |
| ADR-003 | Normalized node model + semantic slots |
| ADR-004 | REST Control Plane |
| ADR-005 | PostgreSQL relational + JSONB |
| ADR-006 | Same-origin iframe editor canvas |
| ADR-007 | dnd-kit abstraction |
| ADR-008 | Moveable geometry controls |
| ADR-009 | Tiptap rich text |
| ADR-010 | Zustand document/session state |
| ADR-011 | XState only for workflow FSM |
| ADR-012 | Command-only mutations |
| ADR-013 | Library-neutral Animation DSL |
| ADR-014 | Library-neutral Interaction DSL |
| ADR-015 | Typed safe Expression DSL |
| ADR-016 | Registered server-side Data Sources |
| ADR-017 | Generated CSS + CSS variables |
| ADR-018 | Static-first published renderer |
| ADR-019 | Immutable published versions |
| ADR-020 | Raw JS disabled by default |
| ADR-021 | Plugin API is versioned |
| ADR-022 | AI operates through Commands |
| ADR-023 | Collaboration postponed but model CRDT-ready |
| ADR-024 | Editor dependencies excluded from published runtime |

---

# Part 69 — معماری نهایی به زبان ساده

## اشتباه

```text
Install Page Builder Library
      ↓
Customize it
      ↓
Store its JSON
      ↓
Add more hacks
      ↓
Eventually depend on its internals
```

## معماری درست

```text
Our Product Domain
       │
       ├── Our Schema
       ├── Our Commands
       ├── Our Registry
       ├── Our Data DSL
       ├── Our Animation DSL
       ├── Our Plugin API
       └── Our Renderer Contract
                │
                ▼
       Specialist Libraries
```

در این معماری:

```text
اگر dnd-kit مناسب نبود:
replace DragDropAdapter

اگر Tiptap مناسب نبود:
replace RichTextAdapter

اگر Motion کافی نبود:
use GSAP adapter

اگر AI اضافه شد:
AI → Command API

اگر Collaboration اضافه شد:
CRDT → Document transaction layer
```

لازم نیست Core پروژه شکسته یا بازنویسی شود.

---

# جمع‌بندی اجرایی

Stack نهایی پیشنهادی:

> **React + TypeScript + custom Editor Domain Core + dnd-kit + Moveable + Tiptap + Zustand + XState for workflows + JSON Schema/Ajv + Zod + Motion + GSAP adapter + Django/DRF + PostgreSQL relational/JSONB + same-origin iframe renderer + static-first publishing + future Yjs/Django Channels.**

اصل بنیادین:

> **هیچ Library خارجی نباید مالک Page Schema، Command Model، Component Contract یا Plugin Contract پروژه شود.**

اگر این اصل از روز اول رعایت شود، معماری برای Animation، Dynamic Data، AI، Collaboration، Responsive Editing، Symbols، Design Systems و Plugin Ecosystem آینده‌پذیر خواهد بود.

---

# منابع فنی کلیدی

- Puck — https://puckeditor.com/docs
- GrapesJS — https://grapesjs.com/docs/
- GrapesJS GitHub — https://github.com/GrapesJS/grapesjs
- Craft.js — https://craft.js.org/
- Builder.io — https://www.builder.io/c/docs/intro
- Mitosis — https://github.com/BuilderIO/mitosis
- Webstudio — https://github.com/webstudio-is/webstudio
- Plasmic — https://github.com/plasmicapp/plasmic
- React Bricks — https://www.reactbricks.com/
- dnd-kit — https://dndkit.com/
- Moveable — https://github.com/daybrush/moveable
- Tiptap — https://tiptap.dev/docs
- Lexical — https://lexical.dev/docs/intro
- Motion — https://motion.dev/docs/react
- GSAP — https://gsap.com/
- Zustand — https://zustand.docs.pmnd.rs/
- XState — https://stately.ai/docs/xstate
- JSON Logic — https://jsonlogic.com/
- Django REST Framework — https://www.django-rest-framework.org/
- Strawberry GraphQL — https://strawberry.rocks/docs/integrations/django
- Ajv — https://ajv.js.org/
- Zod — https://zod.dev/
- Yjs — https://docs.yjs.dev/
- Django Channels — https://channels.readthedocs.io/
- DOMPurify — https://github.com/cure53/DOMPurify
- nh3 — https://github.com/messense/nh3
- Django Documentation — https://docs.djangoproject.com/
- React Server APIs — https://react.dev/reference/react-dom/server
