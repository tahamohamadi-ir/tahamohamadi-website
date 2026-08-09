# پلن پیاده‌سازی جامع — TahaMohamadi.ir

**نسخه:** 1.2  
**تاریخ:** 2026-08-09  
**منابع:** `.kiro/specs/react-django-rewrite`, `.kiro/specs/ui-ux-overhaul`, `.kiro/specs/ui-animations-page-builder`, `docs/wordpress-capability-extraction-and-cms-reference.md`, `docs/012-cms-v2-wordpress-capability-task-list.md`, `docs/planning/development-master-plan.md`  
**وضعیت:** در حال اجرا تا فاز نهایی استقرار (Phase 15 / Release 8)

---

## 1. خلاصه اجرایی

این پلن، اسناد تخصصی زیرساخت، UI/UX، Composer، انیمیشن و CMS V2 را در یک نقشه راه یکپارچه ادغام می‌کند:

1. **React + Django Rewrite** — بازنویسی کامل از Java Spring Boot + Vue/Quasar به Django DRF + Next.js App Router
2. **UI/UX Overhaul** — مدرن‌سازی بصری با design tokens، dark mode، typography دوزبانه، component library، motion design و accessibility
3. **UI Animations Page Builder** — ابزار بصری admin برای ساخت صفحات انیمیشنی بدون کد
4. **CMS V2 & WordPress Capability Extraction** — ساختار تکامل‌یافتهٔ CMS ریلیشنال (کلاس `Page → Section → Block`) با قابلیت‌های کنترل‌شدهٔ مدیریت محتوا، مدیریت پیشرفتهٔ رسانه (`MediaPicker` / `MediaAsset`)، مدیریت پیشرفتهٔ انتشار و زمان‌بندی (Workflow/Revisions/Freshness) و Quality Gates انتشار.

### استک فنی نهایی

| لایه | تکنولوژی | نسخه |
|------|----------|------|
| Backend Framework | Django + DRF | 5.x |
| Backend Language | Python | 3.12+ |
| Frontend Framework | Next.js (App Router + RSC) | 15.x |
| Frontend Language | TypeScript | 5.x |
| UI Components | shadcn/ui (New York) + Radix UI | Latest |
| CSS Framework | Tailwind CSS | 4.x |
| Database | PostgreSQL | 16 |
| Task Queue | Celery + celery-beat | Latest |
| Editor | Tiptap | Latest |
| DnD | @dnd-kit | Latest |
| State (Admin) | @tanstack/react-query + zustand | Latest |
| i18n | next-intl | Latest |
| Theme | next-themes | Latest |
| Validation | zod + react-hook-form | Latest |
| Animation | Framer Motion / GSAP (Page Builder) | Latest |
| Testing Backend | pytest + pytest-django + hypothesis | Latest |
| Testing Frontend | vitest + @testing-library/react + fast-check | Latest |
| E2E | Playwright | Latest |
| Deployment | Docker Compose (Nginx + Next.js + Django + PostgreSQL) | Latest |

### محدودیت‌ها (Constraints)

- PostgreSQL تنها دیتابیس (بدون document store)
- معماری Modular Monolith (نه microservices)
- Docker Compose روی VPS
- Session-based auth + CSRF (نه JWT)
- فارسی و انگلیسی مستقل (بدون cross-locale fallback)
- مدل CMS ریلیشنال تایپ‌شده (Composer)
- هیچ draft/archived content در public نمایش داده نمی‌شود
- SSR الزامی برای صفحات عمومی

---

## 2. معماری سطح بالا

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                       │
├──────────────────────────┬──────────────────────────────────┤
│   Public Pages (SSR)     │     Admin Panel (CSR)            │
│   React Server Comps     │     Client Components            │
│   Theme: light/dark      │     Composer + Editors           │
└──────────────────────────┴──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                       │
│   /api/* → Django    |    /* → Next.js                      │
└─────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────────┐         ┌──────────────────────────┐
│   Django + DRF       │         │     Next.js 15 App Router │
│   (Gunicorn)         │         │     (Standalone)          │
│                      │         │                           │
│  apps/               │         │  src/                     │
│  ├── core/           │         │  ├── app/[locale]/        │
│  ├── cms/            │         │  ├── app/admin/           │
│  ├── media/          │         │  ├── components/ui/       │
│  ├── blog/           │         │  ├── components/blocks/   │
│  ├── portfolio/      │         │  ├── components/admin/    │
│  ├── workflow/       │         │  ├── lib/                 │
│  └── auth/           │         │  └── hooks/               │
└──────────────────────┘         └──────────────────────────┘
          │
          ▼
┌──────────────────────┐
│   PostgreSQL 16      │
└──────────────────────┘
```

---

## 3. فازهای پیاده‌سازی

### فاز 1: Project Setup & Infrastructure (هفته 1-2)

**هدف:** راه‌اندازی monorepo با Django، Next.js، Docker Compose و زیرساخت تست.

#### 1.1 ساختار دایرکتوری
- ایجاد ساختار monorepo: `/backend` (Django), `/frontend` (Next.js), `/docker`, `/docs`, `/e2e`, `/scripts`, `/infra`
- فایل‌های root: `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`, `.gitignore`, `README.md`

#### 1.2 پروژه Django
- ایجاد Django 5.x project با split settings (`config/settings/base.py`, `dev.py`, `prod.py`)
- نصب DRF + django-cors-headers + django-filter + Pillow
- تنظیم `INSTALLED_APPS` و DRF default settings
- ایجاد `config/urls.py` با prefix `/api/public/` و `/api/admin/`

#### 1.3 پروژه Next.js
- ایجاد با `create-next-app` (App Router, TypeScript, ESLint)
- نصب Tailwind CSS 4 + shadcn/ui (New York style)
- تنظیم `tsconfig.json` با path aliases (`@/`)
- ایجاد ساختار `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`

#### 1.4 Docker Compose
- ایجاد `docker-compose.yml` با 4 سرویس: nginx, nextjs, django, postgres
- `docker-compose.dev.yml` با hot reload
- `docker-compose.prod.yml` با health checks و resource limits
- Volume mounts: `postgres_data`, `media_data`
- `.env.example` با تمام متغیرهای محیطی

#### 1.5 Nginx Configuration
- فایل `docker/nginx/nginx.conf`:
  - `/api/*` و `/admin-api/*` → Django
  - `/_next/static/*` → static files
  - `/*` → Next.js
- SSL/TLS setup (production)
- Security headers

#### 1.6 Base Models (Django)
```python
# apps/core/models.py
class TimestampedModel(Model):
    id = UUIDField(primary_key=True, default=uuid4, editable=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    created_by = ForeignKey(User, null=True, blank=True, on_delete=SET_NULL, related_name='+')
    updated_by = ForeignKey(User, null=True, blank=True, on_delete=SET_NULL, related_name='+')

class VersionedModel(TimestampedModel):
    version = IntegerField(default=1)
```

#### 1.7 Authentication & Security
- Session-based auth با CSRF enforcement
- `django-cors-headers` configuration
- Custom exception handler با RFC 7807 Problem Details
- Rate limiting middleware

#### 1.8 Testing Infrastructure
- **Backend:** pytest + pytest-django + hypothesis + conftest.py
- **Frontend:** vitest + @testing-library/react + fast-check + vitest.config.ts
- **E2E:** Playwright setup در `/e2e/`

#### 1.9 Linting & Formatting
- Backend: `ruff.toml` (formatter + linter)
- Frontend: `.eslintrc`, `.prettierrc`
- Pre-commit hooks

#### 1.10 CI/CD
- `.github/workflows/ci.yml`: lint → test → build → push images
- GHCR image registry

**خروجی:** `docker compose up` همه سرویس‌ها بالا می‌آیند؛ تست‌ها سبز؛ CI پاس.

---

### فاز 2: Design Token System & Theming (هفته 2-3)

**هدف:** سیستم token سه‌لایه‌ای با dark mode و typography دوزبانه.

> **منبع:** `ui-ux-overhaul/design.md` + `docs/design-system.md`

#### 2.1 Semantic Color Tokens (`globals.css`)
```css
@layer base {
  :root {
    --canvas: 0 0% 100%;
    --surface: 0 0% 98%;
    --primary: 220 70% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 220 14% 96%;
    --destructive: 0 84% 60%;
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
    --info: 217 91% 60%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 220 70% 50%;
    --background: 0 0% 100%;
    --foreground: 220 40% 6%;
    --card: 0 0% 100%;
    --card-foreground: 220 40% 6%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 40% 6%;
    --radius: 0.5rem;
  }

  .dark {
    --canvas: 220 30% 5%;
    --surface: 220 25% 8%;
    /* ... complete dark tokens */
  }
}
```

#### 2.2 Spacing & Radius Scale (`@theme`)
- spacing: 4px base (space-1 → space-24)
- radius: sm (4px), md (6px), lg (8px), xl (12px), full (9999px)

#### 2.3 Tailwind CSS 4 Integration
- Map CSS custom properties to Tailwind via `@theme`
- Font family tokens (heading, body, mono) for both locales
- Semantic tokens consumable as Tailwind utilities

#### 2.4 next-themes Provider
- Install `next-themes`
- Configure: `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
- Wrap app in ThemeProvider
- Flash prevention via inline script

#### 2.5 ThemeToggle Component
- Sun/Moon icon toggle (shadcn/ui Button ghost)
- Placement: site header
- localStorage persistence
- No page reload on switch

#### 2.6 Typography System
- Vazirmatn Variable via `next/font/google` (Persian, display: swap)
- Inter via `next/font/google` (English, display: swap)
- JetBrains Mono (code blocks)
- Locale-aware line-height: fa = 1.8-2.0, en = 1.5-1.6
- Prose max-width: 65ch
- Type scale: xs (12px) → 5xl (48px)
- One H1 per page rule

**خروجی:** Token system کامل، dark mode عملیاتی، fonts بارگذاری شده.

---

### فاز 3: CMS Core — Composer System (هفته 3-5)

**هدف:** سیستم تایپ‌شده ریلیشنال برای composition صفحات.

> **منبع:** `react-django-rewrite/design.md` + `react-django-rewrite/requirements.md`

#### 3.1 Models & Migrations

**Page Model:**
- slug_fa (SlugField, unique, allow_unicode)
- slug_en (SlugField, unique)
- title_fa, title_en (CharField)
- page_type: "home" | "custom"
- status: "draft" | "in_review" | "scheduled" | "published" | "archived"
- published_at (DateTimeField, nullable)
- VersionedModel fields (version, UUID pk, audit)

**Section Model:**
- page FK → Page (CASCADE)
- ordering (IntegerField)
- enabled (BooleanField, default=True)
- layout: "default" | "full-width" | "grid" | "sidebar"

**Block Model:**
- section FK → Section (CASCADE)
- block_type: "hero" | "text" | "gallery" | "cta" | "collection" | "quote" | "divider" | "research_focus"
- settings (JSONField)
- ordering (IntegerField)

**Indexes:** slug, status, ordering, locale, published_at

#### 3.2 Block Type Registry
- JSON schema per block_type
- Validation on save
- Unknown types rejected with Problem Details error
- Registry extensible for Animation blocks (Phase 11)

#### 3.3 Serializers (DRF)
- PageSerializer with nested SectionSerializer
- SectionSerializer with nested BlockSerializer
- Writable nested representations
- Version field for optimistic locking

#### 3.4 Services
- `validate_page_composition()` — ordering, media refs, URL safety
- `save_with_optimistic_lock()` — version check, 409 on conflict
- `get_public_page()` — published + enabled sections + known block types only

#### 3.5 API Endpoints

**Admin:** `/api/admin/cms/`
- `GET/POST /pages/` — list/create
- `GET/PUT/DELETE /pages/{id}/` — detail/update/delete
- Session auth + CSRF enforcement

**Public:** `/api/public/pages/`
- `GET /pages/{slug}/?locale=fa` — published only, filtered

#### 3.6 Tests
- Unit: block validation, optimistic locking, public projection
- Integration: API endpoints (success, conflict, validation error)
- Property-based: hypothesis for workflow transitions

**خروجی:** صفحات قابل ساخت، validate و serve عمومی.

---

### فاز 4: Media Library (هفته 4-5، موازی با فاز 3)

**هدف:** مدیریت کامل media با upload، metadata و usage tracking.

#### 4.1 MediaAsset Model
- file (FileField)
- original_filename, mime_type, file_size
- width, height (nullable, for images)
- checksum (SHA-256)
- alt_text_fa, alt_text_en
- caption_fa, caption_en
- status: "active" | "archived"
- Indexes: mime_type, status

#### 4.2 Upload Service
- MIME type validation (whitelist)
- File extension validation
- File size limit (default 10MB)
- Content-hash naming (dedup)
- Image dimension extraction (Pillow)

#### 4.3 Usage Tracking
- Generic relation to track references across CMS, blog, portfolio
- Archive with usage impact warning
- Orphan detection report

#### 4.4 API Endpoints

**Admin:** `/api/admin/media/`
- `POST /upload/` — multipart upload
- `GET /` — paginated listing with search/filter/sort
- `GET/{id}/` — detail with usage info
- `PATCH/{id}/` — update metadata
- `POST/{id}/archive/` — archive with usage check
- `GET /orphans/` — orphan detection report

#### 4.5 Tests
- Upload validation (MIME, size, extension)
- Archive with usage protection
- Orphan detection accuracy

**خروجی:** Media قابل upload، جستجو، archive؛ usage ردیابی شده.

---

### فاز 5: Blog Module (هفته 5-7)

**هدف:** سیستم مقاله block-based با lifecycle کامل.

#### 5.1 Models
- **Article:** slug_fa/en, title_fa/en, excerpt_fa/en, featured_image FK, topics M2M, status, published_at, reading_time_fa/en, version
- **ArticleBlock:** article FK, locale, block_type, content (JSONField), ordering
  - Block types: paragraph, heading, list, image, gallery, caption, quote, code, divider, callout, reference
- **Topic:** slug, name_fa, name_en

#### 5.2 Services
- Content sanitization (no raw HTML, script, unsafe URLs)
- Reading time calculation per locale
- Markdown import with warnings
- TOC generation from heading blocks

#### 5.3 API Endpoints
- **Admin:** CRUD articles, manage topics
- **Public:** list (paginated, filterable by topic), detail, related content, prev/next navigation

#### 5.4 Tests
- Sanitization rules
- Reading time accuracy
- Public-only-published behavior

**خروجی:** مقالات قابل ساخت، sanitize و serve با TOC و related.

---

### فاز 6: Portfolio Module (هفته 6-7، موازی با فاز 5)

**هدف:** Case study با narrative blocks و gallery.

#### 6.1 CaseStudy Model
- slug_fa/en, title_fa/en, narrative blocks (same block system)
- role_fa/en, client_fa/en, date_range, technologies (ArrayField)
- outcome_fa/en, gallery M2M → MediaAsset, featured (bool)
- status, version

#### 6.2 API Endpoints
- **Admin:** CRUD case studies
- **Public:** list (filterable, paginated), detail

**خروجی:** Portfolio با narrative غنی، gallery و technology metadata.

---

### فاز 7: Workflow & Revisions (هفته 7-8)

**هدف:** مدیریت lifecycle محتوا با state machine، scheduling و revisions.

#### 7.1 Models
- **Revision:** immutable snapshot (GenericFK, snapshot JSONField)
- **ScheduledPublish:** content FK, scheduled_at, timezone, status, attempts, last_error
- **AuditEvent:** user, timestamp, action, entity reference, reason

#### 7.2 State Machine
```
ALLOWED_TRANSITIONS = {
    "draft": ["in_review", "published"],
    "in_review": ["draft", "scheduled", "published"],
    "scheduled": ["draft", "published"],
    "published": ["draft", "archived"],
    "archived": ["draft"],
}
```

#### 7.3 Features
- Permission-checked transitions
- Immutable revision on publish
- Revision comparison and restore (as new draft)
- Celery-beat scheduled publishing (timezone-aware, idempotent, retry)
- Preview token generation (15min, locale-specific, revocable)
- Translation status: Missing | Incomplete | Complete | Outdated
- Audit event on every transition

#### 7.4 API Endpoints
- **Admin:** transition, list revisions, compare, restore, schedule, cancel

**خروجی:** Content lifecycle کامل با audit، scheduling و versioning.

---

### فاز 8: Responsive Layout & Navigation (هفته 8-9)

**هدف:** Layout responsive با RTL/LTR و navigation کامل.

> **منبع:** `ui-ux-overhaul/design.md`

#### 8.1 Layout Container
```tsx
<div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
```
- CSS logical properties (`ps-`, `pe-`, `ms-`, `me-`)
- Mobile-first breakpoints: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- Max content width: 1280px

#### 8.2 Header Component
- Logo + nav links + LanguageSwitcher + ThemeToggle
- Desktop nav at md (768px)+
- Active nav item: border/underline (not color only)

#### 8.3 MobileNavDrawer
- Sheet-based drawer (below 768px)
- Hamburger menu trigger
- Focus trap + Escape dismiss + scroll lock

#### 8.4 SkipToContent
- First focusable element
- `sr-only focus:not-sr-only` styling
- Link to `#main-content`

#### 8.5 LanguageSwitcher
- Navigate to equivalent page in alternate locale
- No action if no translation exists
- hreflang support in responses

#### 8.6 Footer
- Secondary navigation + copyright
- Token-based spacing

**خروجی:** Navigation کامل، responsive، RTL/LTR aware.

---

### فاز 9: Public Pages — SSR (هفته 9-11)

**هدف:** صفحات عمومی SSR با SEO کامل و bilingual support.

#### 9.1 Locale Routing
- `app/[locale]/layout.tsx` — locale shell
- Middleware: locale detection from URL
- `html[lang]` و `html[dir]` بر اساس locale
- Font loading per locale

#### 9.2 BlockRenderer
- Map block_type to React component
- Type-safe dispatch
- Unknown blocks excluded (fail-closed)

#### 9.3 Home Page
- Composed sections from CMS API
- Hero, research focus, selected work, featured publications, latest writing, contact CTA
- Real published data only — no placeholders
- Fallback: owner name + loading message

#### 9.4 Blog Pages
- **Listing:** article cards (title, excerpt, date, reading time, topics), pagination, topic filter, URL-state
- **Detail:** TOC sidebar, reading time, related content, prev/next, BlogPosting JSON-LD

#### 9.5 Portfolio Pages
- **Listing:** project cards (title, thumbnail, tech tags, description), filter, pagination
- **Detail:** semantic facts, gallery, technology tags, outcome, SEO metadata

#### 9.6 Other Pages
- **About:** profile information with structured content
- **Resume:** experience, education, skills, certifications (semantic grouping)
- **Research:** research interests and focus areas
- **Publications:** citation-style entries (title, authors, venue, date, DOI)
- **Contact:** form with name, email, subject, message + CSRF + validation + single-submit

#### 9.7 SEO & Structured Data
- `generateMetadata()` per route — title, description, OG, Twitter Card
- hreflang alternate links
- `app/sitemap.ts` — dynamic, published URLs
- `app/robots.ts` — exclude admin/preview/draft/archive
- JSON-LD: BlogPosting, CreativeWork
- Canonical URLs

**خروجی:** تمام صفحات عمومی SSR با SEO، RTL/LTR و bilingual صحیح.

---

### فاز 10: Component Library Expansion (هفته 10-11)

**هدف:** Component library کامل بر اساس shadcn/ui.

> **منبع:** `ui-ux-overhaul/requirements.md` — Requirement 8

#### 10.1 Core Components (shadcn/ui)
- **Button:** default, secondary, outline, ghost, link, destructive variants
- **Card:** header, content, footer slots + hover state (200ms ease-out)
- **Form:** Input, Textarea, Select, Checkbox, Switch — with error/disabled states
- **Feedback:** Badge, Alert, Skeleton, Progress — semantic color variants
- **Overlay:** Dialog, Drawer, Popover — focus trap + keyboard dismiss

#### 10.2 New Components
- **ThemeToggle** — Sun/Moon toggle
- **MobileNavDrawer** — Sheet-based mobile nav
- **SkipToContent** — Accessibility skip link
- **TableOfContents** — Blog article sidebar
- **EmptyState** — Icon + message + action
- **PageHeader** — Consistent H1 + subtitle pattern
- **MediaPicker** — Shared media selection (admin)

#### 10.3 Component Rules
- All components use semantic tokens (no hardcoded colors)
- Disabled: reduced opacity + no pointer events + aria-disabled
- Focus indicators: 3:1 contrast ratio
- Touch targets: ≥44×44px

**خروجی:** Component library کامل، accessible و themed.

---

### فاز 11: Admin CMS Frontend (هفته 11-14)

**هدف:** Admin panel کامل با Composer Canvas، editors و media management.

#### 11.1 Auth & Dashboard
- Client-side `/admin` routes with auth guard
- Dashboard: content stats, recent activity, quick actions

#### 11.2 Composer Canvas
- Section library + block library panel
- @dnd-kit drag-and-drop + keyboard move-up/move-down
- Block Inspector panel (typed settings per block_type)
- Undo/redo command stack (reset on save)
- Autosave for Draft only (debounced, saving/saved/error indicators)
- Dirty guard + 409 conflict dialog
- Device/locale preview (desktop/tablet/mobile, fa/en)

#### 11.3 MediaPicker & Library
- **MediaPicker:** preview, search, filter, select, clear, replace, inline upload with progress
- **Media Library page:** grid/list view, metadata editing, usage detail

#### 11.4 Article Editor
- Tiptap-based block editing
- Slash commands + keyboard shortcuts
- Inline MediaPicker
- Block types: paragraph, heading, list, image, gallery, caption, quote, code, divider, callout, reference

#### 11.5 Portfolio Editor
- Narrative blocks (same block system as Composer)
- Gallery management
- Technology tags

#### 11.6 Workflow UI
- Status transitions with permission checks
- Revision timeline + compare/restore
- Scheduling interface
- Translation queue with status indicators + side-by-side compare

#### 11.7 Admin Design System
- shadcn/ui + Tailwind CSS
- Dense spacing for dashboard
- Utility + status-heavy colors
- Functional feedback animations

**خروجی:** Admin می‌تواند صفحات compose کند، مقاله بنویسد، media مدیریت کند و content publish کند.

---

### فاز 12: Animation Page Builder (هفته 14-16)

**هدف:** ابزار بصری admin برای ساخت صفحات انیمیشنی.

> **منبع:** `ui-animations-page-builder/requirements.md`

#### 12.1 Animation Block Library
حداقل 8 نوع block:
- scroll-reveal, parallax, text-stagger, fade-in-sequence
- hover-card, counter-animation, image-reveal, section-transition
- هر block: name, description, animated preview thumbnail
- فیلتر بر اساس category (entrance, scroll, hover, text, media)
- Extensible: block جدید بدون تغییر interface

#### 12.2 Page Composition Interface
- Canvas area با drag-and-drop عمودی
- Insert block at drop position
- Reorder via DnD + keyboard (move-up/move-down)
- Configuration panel per block
- Undo/redo (20+ history depth)
- Invalid drop → revert + informational message

#### 12.3 Animation Block Configuration
- Duration: 50ms–3000ms (validated)
- Delay: 0ms–2000ms (validated)
- Easing: 6 predefined options
- Trigger: scroll | load | hover | click
- Content fields: text, image, number (per block type)
- Character limit: 500 chars for text
- Real-time preview update within 300ms

#### 12.4 Live Preview
- Responsive viewport simulator (375px, 768px, 1280px)
- Light/dark theme toggle
- RTL/LTR locale toggle
- Editing controls disabled in preview mode

#### 12.5 Storage & Publishing
- Save as JSON to Django API
- Minimum 1 block validation before save
- Draft/published states (integrate with Workflow module)
- Revision history + restore
- LocalStorage fallback on network error

#### 12.6 Public Renderer
- GPU-accelerated: CSS transforms + opacity
- Intersection Observer for scroll triggers
- RTL/LTR without animation artifacts
- `prefers-reduced-motion`: disable animations, show final state
- LCP < 2.5s, CLS < 0.1
- Theme-aware (light/dark)

#### 12.7 Responsive Behavior
- Scale distances/sizes proportionally below 768px
- Simplify complex multi-element → single-element below 768px
- 30fps minimum on 375px+ devices
- Mobile-specific overrides per block (duration, distance)

#### 12.8 Backend Support
- Animation block types registered in CMS block registry
- AnimationPage model (or extension of Page with animation_config)
- JSON storage for animation composition
- Public API endpoint for animation pages

**خروجی:** صفحات انیمیشنی قابل ساخت، preview و publish.

---

### فاز 13: Motion, Interaction & Accessibility (هفته 15-16)

**هدف:** Motion design پولیش شده و accessibility کامل.

#### 13.1 Motion Design
| Interaction | Duration | Easing | Property |
|-------------|----------|--------|----------|
| Button hover/focus | 150ms | ease-in-out | background, box-shadow |
| Card hover | 200ms | ease-out | box-shadow, transform |
| Page transitions | 200ms | ease-out | opacity |
| Navigation state | 150ms | ease-in-out | color, border |
| Skeleton pulse | 1.5s | infinite ease-in-out | opacity |
| Drawer open | 300ms | cubic-bezier(0.32,0.72,0,1) | transform |

#### 13.2 Reduced Motion
- `@media (prefers-reduced-motion: reduce)` → disable all non-essential
- `motion-reduce:transition-none` on interactive components

#### 13.3 Accessibility (WCAG 2.2 AA)
- Semantic landmarks: header, nav, main, footer
- Sequential heading hierarchy (no skipping)
- ARIA live regions for route changes
- Visible focus indicators on all interactive elements
- All form inputs: programmatically associated labels
- Images: descriptive alt (meaningful) or empty alt (decorative)
- Full keyboard navigation
- 4.5:1 contrast for normal text, 3:1 for large text
- Touch targets ≥ 44×44px
- Form errors linked via `aria-describedby`

#### 13.4 Accessibility in Admin
- Keyboard-only navigation through Composer Canvas
- Screen reader announcements for block reorder/config
- Focus indicators ≥ 3:1 contrast
- ARIA live regions for save/conflict states

**خروجی:** تمام animations پولیش، reduced-motion compliant، WCAG 2.2 AA.

---

### فاز 14: Security, Performance & Optimization (هفته 16-17)

**هدف:** Production-grade security و Core Web Vitals.

#### 14.1 Security
- Headers: HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- Rate limiting: login, upload, public API
- Audit logging: all admin mutations (user, timestamp, action, entity)
- Input sanitization: fail-closed
- Preview: X-Robots-Tag: noindex, Cache-Control: no-store
- Secrets: .env only, never in Git

#### 14.2 Performance
- **Images:** next/image with WebP/AVIF, `sizes`, `priority` for hero, lazy for below-fold
- **Code splitting:** admin/public separate bundles, per-route splitting
- **Caching:** CDN-cacheable public, no-cache admin, immutable media (content-hash)
- **Fonts:** next/font with preconnect
- **Skeletons:** reserved layout space during API fetches
- **Database:** select_related + prefetch_related (no N+1)

#### 14.3 Performance Targets
- LCP < 2.5s
- CLS < 0.1
- FID < 100ms

**خروجی:** Security hardened، CWV targets met.

---

### فاز 15: E2E Testing & Deployment (هفته 17-18)

**هدف:** E2E coverage کامل و deployment production-ready.

#### 15.1 E2E Tests (Playwright)
1. Login → media upload → page compose → preview → publish
2. Article create → edit blocks → publish → public read
3. Anonymous: sees only published content
4. Locale switching: correct dir, no fallback
5. Animation page builder: create → configure → preview → publish

#### 15.2 Manual Tests
- /fa و /en at 375, 768, 1024, 1440px
- Keyboard-only through admin Composer
- RTL/LTR visual regression
- Screen reader smoke test
- No placeholder content
- Reduced motion honored

#### 15.3 Deployment
- Production Docker Compose with health checks
- Database seed/migration from existing data
- README documentation (setup, dev, deploy)
- Production monitoring (health endpoints + Sentry)
- Backup/restore scripts (pg_dump + media tar)

**خروجی:** تمام E2E pass، production deployed، rollback tested.

---

## 4. Dependencies بین فازها

```
Phase 1 ──── Foundation for all phases
    │
    ├── Phase 2 (Design Tokens) ──── Required by Phase 8-13
    │
    ├── Phase 3 (CMS Core) ──┬── Required by Phases 4, 5, 7, 9, 11, 12
    │                         │
    ├── Phase 4 (Media) ─────┤ (parallel with Phase 3)
    │                         │
    ├── Phase 5 (Blog) ──────┤ (after Phase 3+4)
    │                         │
    ├── Phase 6 (Portfolio) ──┤ (parallel with Phase 5)
    │                         │
    └── Phase 7 (Workflow) ───┘ (after at least one content module)
          │
          ├── Phase 8 (Layout) ──── after Phase 2
          │
          ├── Phase 9 (Public Pages) ──── after Phases 3-7 + 8
          │
          ├── Phase 10 (Component Library) ──── parallel with Phase 9
          │
          ├── Phase 11 (Admin CMS) ──── after Phases 3-7 + 10
          │
          ├── Phase 12 (Animation Builder) ──── after Phases 3, 11
          │
          ├── Phase 13 (Motion & A11y) ──── after Phases 9-12
          │
          ├── Phase 14 (Security & Perf) ──── after all features
          │
          └── Phase 15 (E2E & Deploy) ──── after Phase 14
```

---

## 5. Correctness Properties (خصوصیات صحت)

1. **Locale Independence:** محتوای هر locale مستقل؛ هیچ fallback بین locale‌ها وجود ندارد
2. **Published-Only Public:** تمام responseهای public فقط شامل status=published
3. **Optimistic Lock Guarantee:** از هر دو write همزمان، فقط یکی موفق و version+1
4. **Block Type Safety:** فقط blockهای registered قبول؛ unknown → reject on write, exclude on read
5. **Media Referential Integrity:** هر media_id در block → active asset
6. **SSR Single H1:** هر صفحه عمومی رندر شده دقیقاً یک H1
7. **Safe URL Constraint:** فقط `/` (internal) یا `https://` (external)
8. **Workflow Transition Validity:** فقط transition‌های مجاز
9. **Revision Immutability:** snapshot هرگز تغییر نمی‌کند
10. **CSRF Protection:** تمام requestهای state-mutating admin نیاز به CSRF token
11. **Preview Isolation:** X-Robots-Tag: noindex, Cache-Control: no-store
12. **Audit Trail Completeness:** هر mutation admin → audit event

---

## 6. Error Handling Matrix

| سناریو | Response | Recovery |
|---------|----------|----------|
| Version Conflict | 409 + current_version | Conflict dialog |
| Invalid Block Type | 422 + Problem Details + path | Highlight invalid block |
| Media Upload Rejection | 400 + specific validation error | Inline error + retry |
| Unauthorized Action | 403 (minimal) | UI disables unavailable actions |
| Scheduled Publish Failure | Job "failed" + retry | Admin dashboard shows reason |
| SSR Data Fetch Failure | 500/404 error page | Exponential backoff retry |
| CMS Unavailable | Cached ISR or minimal fallback | Owner name + loading message |
| Contact Form Error | Inline error + preserved input | Retry available |
| Theme Init Failure | CSS `prefers-color-scheme` | Automatic |
| Animation Preview Failure | Revert to last valid state | Error message |

---

## 7. Verification Plan

### Automated Tests
```bash
# Backend
cd backend && pytest --cov=apps --cov-report=html

# Frontend  
cd frontend && npx vitest run --coverage

# E2E
cd e2e && npx playwright test

# Lighthouse
npx lhci autorun
```

### Manual Verification
- RTL/LTR at 4 breakpoints (375, 768, 1024, 1440px)
- Keyboard-only navigation (public + admin)
- Screen reader smoke test
- Dark mode contrast verification
- Reduced motion compliance
- No placeholder content visible
- Animation performance (30fps minimum)

---

## 8. Rich Content Security Contract

> منبع: `docs/ui-ux/DESIGN.md` — Section 25 (UX-DEC-011)

### 8.1 معماری انتخاب‌شده
**Frontend SSR parse-then-sanitize:** Markdown source از Django API → parse با `markdown-it` (html:false) → sanitize با `DOMPurify` → یک `dangerouslySetInnerHTML` sink.

### 8.2 قوانین امنیتی
- Parser: `html: false`, `linkify: false`, `typographer: false`
- Tables/Images: غیرفعال در M1
- H1 Markdown: تبدیل به paragraph (H1 فقط Route-owned)
- Sanitizer allowlist: فقط prose tags (`p`, `br`, `strong`, `em`, `del`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `hr`, `h2-h6`)
- Link href: فقط `/` (internal) یا `https://`/`http://` (external)
- ممنوع: `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `svg`, `h1`, event attributes, `data-*`, `aria-*`, `class`, `id`
- External links: `target="_blank"` + `rel="noopener noreferrer"` فقط توسط renderer

### 8.3 رفتار در شکست
| حالت | رفتار ایمن |
|------|-----------|
| Markdown خالی | حذف prose region یا empty state |
| Markdown نامعتبر | نمایش escaped text |
| HTML خام | Escape به text (parser: html:false) |
| شکست sanitizer | Fail closed → localized error state |
| URL ناامن | فقط نمایش text (بدون link) |

### 8.4 تسک‌های مرتبط (RC-001 → RC-005)
- RC-001: تأیید parser/sanitizer ✅ (انجام شده)
- RC-002: ایجاد renderer boundary ✅ (انجام شده)
- RC-003: تست‌های SSR/hydration/security/abuse ← Phase 14
- RC-004: Integration با routes (`bodyMarkdown`) ← Phase 9
- RC-005: Browser/accessibility QA ← Phase 15

---

## 9. قراردادهای کدنویسی

> منبع: `docs/conventions.md`

### 9.1 Python / Django
- Formatter: `ruff format` (Black-compatible)
- Linter: `ruff check`
- Line length: 88 chars
- Naming: App=lowercase (`cms`, `blog`), Model=PascalCase, Field=snake_case, Service=snake_case verb
- Serializer: `{Model}Serializer`, View: `{Model}ViewSet`
- URL prefix: kebab-case (`/api/admin/blog-articles/`)
- Test file: `test_{module}.py`
- **Service Layer Pattern:** business logic در services.py، view فقط orchestration

### 9.2 TypeScript / React
- Formatter: Prettier (no semicolons, single quotes JS, double JSX)
- Linter: ESLint (Next.js config)
- Line length: 100 chars
- Component file: PascalCase (`ArticleCard.tsx`)
- Utility/hook: camelCase (`useArticles.ts`)
- Page file: `page.tsx` (App Router)
- Server Components: default، Client Components: با `'use client'` directive
- API Client: Server Components → `fetch()` مستقیم، Client Components → `@tanstack/react-query`

### 9.3 Git
- Conventional Commits: `feat(scope): description`
- Branch naming: `feat/cms-block-reordering`
- PR → main (squash merge)

### 9.4 API
- URL: `/api/{audience}/{module}/{resource}/`
- Admin: session + CSRF
- Public: read-only, no auth
- Errors: RFC 7807 Problem Details
- Pagination: cursor-based (admin), offset (public)

---

## 10. یادداشت‌های مهاجرت (Migration Notes)

### 10.1 از Vue/Quasar به Next.js/React
| جنبه | قبلی (Vue/Quasar) | جدید (Next.js/React) |
|------|-------------------|---------------------|
| Framework | Vue 3 + Quasar 2 | Next.js 15 + React 19 |
| State | Pinia | @tanstack/react-query + zustand |
| Routing | Vue Router | App Router (file-based) |
| SSR | Quasar SSR | React Server Components |
| Components | Quasar UI | shadcn/ui + Radix UI |
| Styling | SCSS + tokens.scss | Tailwind CSS 4 + globals.css |
| Editor | (planned) | Tiptap |
| DnD | (planned) | @dnd-kit |

### 10.2 از Spring Boot به Django
| جنبه | قبلی (Spring Boot) | جدید (Django) |
|------|---------------------|---------------|
| Language | Java/Kotlin | Python 3.12+ |
| Framework | Spring Boot + Spring Security | Django 5.x + DRF |
| ORM | JPA/Hibernate | Django ORM |
| Auth | Spring Security | Django sessions + CSRF |
| Migrations | Flyway | Django migrations |
| Testing | JUnit + Mockito | pytest + hypothesis |
| Server | Tomcat (embedded) | Gunicorn |

### 10.3 داده‌های موجود
- اسکریپت migration برای انتقال داده از DB قبلی ← Phase 15.3.2
- محتوای Markdown existing → import با warnings ← Phase 5.2.4
- Media files → re-hash و re-index ← Phase 4.2.4

---

## 11. طراحی بصری — Anti-Patterns (اجتناب شود)

> منبع: `docs/goals-and-vision.md` Section 7 + `docs/design-system.md` Section 9

| ❌ Anti-Pattern | دلیل |
|----------------|------|
| Glassmorphism | خوانایی متن را کاهش می‌دهد |
| Decorative gradients | حواس‌پرتی از محتوا |
| Glow effects / neon | مناسب academic site نیست |
| Oversized hero sections | فضای بالای fold هدر نمی‌رود |
| Parallax scrolling | Performance cost + motion sickness |
| Carousel/slider | کاربران slide دوم را نمی‌بینند |
| Decorative animations | فقط هدف‌دار (state change, loading) |
| Custom scrollbars | Platform-native بهتر |
| Fixed/sticky CTAs | مزاحم خواندن محتوا |
| Emoji as structural icons | inconsistent across platforms |
| Progress bars for skills | بدون data قابل اثبات |
| Stock images | فقط تصاویر واقعی کار |
| Generic AI-generated appearance | اعتبار academic را کاهش می‌دهد |

**جهت طراحی:** Modern Clean + Academic Editorial
- Content-first، typography-driven، whitespace-rich
- Subtle motion فقط هدف‌دار
- Professional restraint (رنگ کم، contrast بالا)

---

## 12. Post-MVP Roadmap

> منبع: `docs/roadmap.md` — Post-MVP

### Near-term (1-2 ماه بعد MVP)
| Feature | Priority | Effort |
|---------|----------|--------|
| Full-text search improvements | Medium | Low |
| Analytics dashboard (basic) | Medium | Medium |
| RSS feed for blog | Low | Low |
| PDF resume export | Low | Low |

### Medium-term (3-6 ماه)
| Feature | Priority | Effort |
|---------|----------|--------|
| Redis for session/cache | Medium | Low |
| S3/Object storage for media | Medium | Medium |
| Advanced SEO (llms.txt, AI visibility) | High | Medium |
| Comment system (blog) | Low | High |
| Newsletter integration | Low | Medium |

### Long-term (6-12 ماه)
| Feature | Priority | Effort |
|---------|----------|--------|
| CDN integration | Medium | Medium |
| Multi-language expansion | Low | High |
| Public user accounts | Low | High |
| Telegram bot publishing | Low | High |
| Knowledge graph visualization | Low | High |
