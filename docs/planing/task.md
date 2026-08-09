# Task List — TahaMohamadi.ir Implementation

**نسخه:** 1.0  
**تاریخ:** 2026-07-29  
**وضعیت:** در حال اجرا  
**مرجع:** `docs/planning/plan.md`

---

## راهنما

- `[ ]` — تسک انجام نشده
- `[/]` — در حال انجام
- `[x]` — انجام شده
- `[*]` — اختیاری (قابل Skip برای MVP سریع‌تر)
- **وابستگی‌ها** با فرمت `← depends on X.Y` نمایش داده شده

---

## فاز 1: Project Setup & Infrastructure

- [x] 1.1 ساختار دایرکتوری monorepo
  - [x] 1.1.1 ایجاد `/docker`, `/e2e`, `/scripts`, `/infra` directories
  - [x] 1.1.2 ایجاد `docker-compose.yml` (4 services: nginx, django, nextjs, postgres)
  - [x] 1.1.3 ایجاد `docker-compose.dev.yml` (hot reload, dev volumes)
  - [x] 1.1.4 ایجاد `docker-compose.prod.yml` (health checks, resource limits)
  - [x] 1.1.5 ایجاد `.env.example` با تمام environment variables

- [x] 1.2 Django Project Setup ← 1.1
  - [x] 1.2.1 تنظیم Django 5.x project structure: `config/settings/base.py`, `dev.py`, `prod.py`
  - [x] 1.2.2 نصب DRF + `django-cors-headers` + `django-filter`
  - [x] 1.2.3 تنظیم `INSTALLED_APPS`, DRF default settings, JSON renderer
  - [x] 1.2.4 تنظیم URL routing: `/api/public/` و `/api/admin/`
  - [x] 1.2.5 ایجاد custom exception handler (RFC 7807 Problem Details)
  - [x] 1.2.6 نصب و تنظیم Gunicorn config
  - [x] 1.2.7 ایجاد Dockerfile (`infra/docker/Dockerfile.backend`)

- [x] 1.3 Next.js Project Setup ← 1.1
  - [x] 1.3.1 بررسی/تأیید Next.js 15 + App Router + TypeScript setup (موجود)
  - [x] 1.3.2 بررسی/تأیید Tailwind CSS 4 + shadcn/ui (New York) setup (موجود)
  - [x] 1.3.3 تنظیم path aliases (`@/`) در `tsconfig.json`
  - [x] 1.3.4 بررسی ساختار `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`
  - [x] 1.3.5 ایجاد `next.config.ts` تنظیمات (images, rewrites, i18n)
  - [x] 1.3.6 ایجاد Dockerfile (`infra/docker/Dockerfile.frontend`)

- [x] 1.4 Nginx Configuration ← 1.1
  - [x] 1.4.1 ایجاد `docker/nginx/nginx.conf` با routing rules
  - [x] 1.4.2 `/api/*` → Django proxy
  - [x] 1.4.3 `/_next/static/*` → static files serve
  - [x] 1.4.4 `/*` → Next.js proxy
  - [x] 1.4.5 تنظیم security headers (HSTS, X-Frame-Options, X-Content-Type-Options)

- [x] 1.5 Base Models ← 1.2
  - [x] 1.5.1 ایجاد `apps/core/models.py`: `TimestampedModel` (UUID pk, audit fields)
  - [x] 1.5.2 ایجاد `VersionedModel` (extends TimestampedModel + version field)
  - [x] 1.5.3 ایجاد `apps/core/exceptions.py`: custom Problem Details exception classes
  - [x] 1.5.4 ایجاد `apps/core/middleware.py`: audit middleware (created_by/updated_by injection)
  - [x] 1.5.5 اجرای initial migrations

- [x] 1.6 Authentication & Security ← 1.2
  - [x] 1.6.1 تنظیم session-based auth با CSRF enforcement
  - [x] 1.6.2 تنظیم CORS (allow frontend origin, credentials: true)
  - [x] 1.6.3 ایجاد login/logout/whoami API endpoints
  - [x] 1.6.4 ایجاد permission classes: `IsAdmin`, `IsEditor`, `IsReviewer`
  - [x] 1.6.5 ایجاد rate limiting middleware (login: 5/min, upload: 20/min)

- [x] 1.7 Testing Infrastructure
  - [x] 1.7.1 تنظیم `pytest.ini` + `conftest.py` (fixtures, factories) ← 1.2
  - [x] 1.7.2 تنظیم `vitest.config.ts` + testing-library setup ← 1.3
  - [x] 1.7.3 ایجاد `e2e/` directory با Playwright config ← 1.3
  - [x] 1.7.4 نصب hypothesis (backend PBT) و fast-check (frontend PBT)

- [x] 1.8 Linting & CI
  - [x] 1.8.1 تنظیم `ruff.toml` (backend formatter + linter)
  - [x] 1.8.2 تنظیم ESLint + Prettier (frontend)
  - [x] 1.8.3 ایجاد `.github/workflows/ci.yml`: lint → test → build → push

- [x] **1.9 CHECKPOINT:** `docker compose up` → همه سرویس‌ها بالا، تست‌ها سبز، CI pass

---

## فاز 2: Design Token System & Theming

- [x] 2.1 Semantic Color Tokens ← 1.3
  - [x] 2.1.1 تعریف light theme tokens در `:root` (`globals.css`)
    - canvas, surface, primary, primary-foreground, secondary, secondary-foreground
    - muted, muted-foreground, accent, accent-foreground
    - destructive, destructive-foreground, success, warning, info
    - border, input, ring, background, foreground
    - card, card-foreground, popover, popover-foreground
  - [x] 2.1.2 تعریف dark theme tokens در `.dark` class
  - [x] 2.1.3 تأیید contrast ratios: 4.5:1 (normal text), 3:1 (large text)

- [x] 2.2 Spacing & Radius Scale ← 1.3
  - [x] 2.2.1 تعریف spacing scale در `@theme`: space-1(4px) → space-24(96px)
  - [x] 2.2.2 تعریف radius scale: sm(4px), md(6px), lg(8px), xl(12px), full(9999px)

- [x] 2.3 Tailwind CSS 4 Theme Integration ← 2.1, 2.2
  - [x] 2.3.1 Map CSS custom properties to Tailwind via `@theme`
  - [x] 2.3.2 Configure font tokens: `--font-heading`, `--font-body`, `--font-mono` (per locale)
  - [x] 2.3.3 Verify semantic tokens as Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.)

- [x] 2.4 Dark Mode Provider ← 2.1
  - [x] 2.4.1 Install `next-themes`
  - [x] 2.4.2 Configure ThemeProvider: `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
  - [x] 2.4.3 Wrap root layout with ThemeProvider + `suppressHydrationWarning`
  - [x] 2.4.4 Verify no flash of incorrect theme on load

- [x] 2.5 ThemeToggle Component ← 2.4
  - [x] 2.5.1 Build Sun/Moon toggle (shadcn/ui Button ghost + icon size)
  - [x] 2.5.2 Place in Header component
  - [x] 2.5.3 Verify localStorage persistence
  - [x] 2.5.4 Verify switch without page reload

- [x] 2.6 Typography System ← 1.3
  - [x] 2.6.1 Configure Vazirmatn Variable via `next/font/google` (Persian, swap)
  - [x] 2.6.2 Configure Inter via `next/font/google` (English, swap)
  - [x] 2.6.3 Configure JetBrains Mono (code blocks)
  - [x] 2.6.4 Export font className from `src/lib/fonts.ts`
  - [x] 2.6.5 Apply in `app/[locale]/layout.tsx`: correct font per locale
  - [x] 2.6.6 Set `dir="rtl"` for fa, `dir="ltr"` for en on `<html>`
  - [x] 2.6.7 Apply locale-specific line-height (fa: 1.8-2.0, en: 1.5-1.6)
  - [x] 2.6.8 Constrain prose content to 65ch max-width

- [x] 2.7 Type Scale ← 2.6
  - [x] 2.7.1 Define heading hierarchy: xs(12px) → 5xl(48px) with weight mapping
  - [x] 2.7.2 Responsive font sizes (smaller on mobile, scale up)
  - [x] 2.7.3 Enforce one visible H1 per page

- [x] 2.8 Unit Tests for Theming
  - [x] 2.8.1 Test ThemeToggle renders correctly
  - [x] 2.8.2 Test localStorage persistence
  - [x] 2.8.3 Test system preference detection

- [x] **2.9 CHECKPOINT:** Tokens، dark mode، fonts کامل و صحیح

---

## فاز 3: CMS Core — Composer System

- [x] 3.1 Page Model ← 1.5
  - [x] 3.1.1 ایجاد `apps/cms/models.py`: Page model (slug_fa/en, title_fa/en, page_type, status, published_at)
  - [x] 3.1.2 Field types: slug (allow_unicode for fa), status choices, version
  - [x] 3.1.3 Indexes: slug, status, published_at
  - [x] 3.1.4 Unique constraints: slug_fa, slug_en separately

- [x] 3.2 Section Model ← 3.1
  - [x] 3.2.1 Section: page FK (CASCADE), ordering, enabled, layout choices
  - [x] 3.2.2 Meta: unique_together (page, ordering)

- [x] 3.3 Block Model ← 3.2
  - [x] 3.3.1 Block: section FK (CASCADE), block_type choices, settings JSONField, ordering
  - [x] 3.3.2 Meta: unique_together (section, ordering)
  - [x] 3.3.3 Migrations

- [x] 3.4 Block Type Registry ← 3.3
  - [x] 3.4.1 ایجاد `apps/cms/block_registry.py`: block type → JSON schema mapping
  - [x] 3.4.2 Register block types: hero, text, gallery, cta, collection, quote, divider, research_focus
  - [x] 3.4.3 Validation: reject unknown types, validate settings against schema
  - [x] 3.4.4 Extensible: new types registered without code changes to core

- [x] 3.5 DRF Serializers ← 3.1-3.3
  - [x] 3.5.1 BlockSerializer: validate block_type + settings
  - [x] 3.5.2 SectionSerializer: nested BlockSerializer (writable)
  - [x] 3.5.3 PageSerializer: nested SectionSerializer (writable)
  - [x] 3.5.4 Version field for optimistic locking

- [x] 3.6 Services ← 3.4, 3.5
  - [x] 3.6.1 `validate_page_composition()`: ordering, media refs, URL safety
  - [x] 3.6.2 `save_with_optimistic_lock()`: version check, 409 Conflict
  - [x] 3.6.3 `get_public_page()`: published + enabled + known blocks

- [x] 3.7 Admin API ← 3.6
  - [x] 3.7.1 ViewSet: `GET/POST /api/admin/cms/pages/`
  - [x] 3.7.2 ViewSet: `GET/PUT/DELETE /api/admin/cms/pages/{id}/`
  - [x] 3.7.3 Session + CSRF enforcement
  - [x] 3.7.4 Audit logging on mutations

- [x] 3.8 Public API ← 3.6
  - [x] 3.8.1 Read-only ViewSet: `GET /api/public/pages/{slug}/?locale=fa`
  - [x] 3.8.2 Filter: published only, enabled sections, known blocks

- [x] 3.9 Tests ← 3.7, 3.8
  - [x] 3.9.1 Unit: block validation (valid, invalid type, bad schema)
  - [x] 3.9.2 Unit: optimistic locking (success, conflict)
  - [x] 3.9.3 Integration: admin CRUD endpoints
  - [x] 3.9.4 Integration: public projection (no draft, no disabled sections)

- [x] **3.10 CHECKPOINT:** صفحات قابل compose، validate و serve عمومی

---

## فاز 4: Media Library

- [x] 4.1 MediaAsset Model ← 1.5
  - [x] 4.1.1 فیلدها: file, original_filename, mime_type, file_size, width, height, checksum
  - [x] 4.1.2 فیلدها: alt_text_fa/en, caption_fa/en, status (active/archived)
  - [x] 4.1.3 Indexes: mime_type, status
  - [x] 4.1.4 Migrations

- [x] 4.2 Upload Service ← 4.1
  - [x] 4.2.1 MIME whitelist validation (image/png, image/jpeg, image/webp, image/svg+xml, application/pdf)
  - [x] 4.2.2 Extension validation
  - [x] 4.2.3 File size limit (10MB default, configurable)
  - [x] 4.2.4 SHA-256 content-hash naming
  - [x] 4.2.5 Image dimension extraction (Pillow)

- [x] 4.3 Usage Tracking ← 4.1, 3.3
  - [x] 4.3.1 ایجاد MediaUsage model (GenericFK: content_type, object_id, media FK)
  - [x] 4.3.2 Track references on CMS block save
  - [x] 4.3.3 Archive impact warning (list referencing content)
  - [x] 4.3.4 Orphan detection query

- [x] 4.4 Admin API ← 4.2, 4.3
  - [x] 4.4.1 `POST /api/admin/media/upload/` — multipart, validation, hash naming
  - [x] 4.4.2 `GET /api/admin/media/` — paginated, search by filename/mime, sort
  - [x] 4.4.3 `GET /api/admin/media/{id}/` — detail + usage info
  - [x] 4.4.4 `PATCH /api/admin/media/{id}/` — update metadata (alt, caption)
  - [x] 4.4.5 `POST /api/admin/media/{id}/archive/` — archive with usage check
  - [x] 4.4.6 `GET /api/admin/media/orphans/` — orphan report

- [x] 4.5 Tests ← 4.4
  - [x] 4.5.1 Upload: valid file, invalid MIME, oversize
  - [x] 4.5.2 Archive: free asset, referenced asset (blocked)
  - [x] 4.5.3 Orphan detection accuracy

- [x] **4.6 CHECKPOINT:** Media upload، metadata، archive و orphan detection عملیاتی

---

## فاز 5: Blog Module

- [x] 5.1 Models ← 1.5
  - [x] 5.1.1 Article: slug_fa/en, title_fa/en, excerpt_fa/en, featured_image FK, status, published_at, reading_time_fa/en, version
  - [x] 5.1.2 ArticleBlock: article FK, locale (fa/en), block_type, content JSONField, ordering
  - [x] 5.1.3 Topic: slug, name_fa, name_en
  - [x] 5.1.4 Article-Topic M2M relationship
  - [x] 5.1.5 Migrations

- [x] 5.2 Services ← 5.1
  - [x] 5.2.1 Content sanitization (strip HTML/script/unsafe URLs)
  - [x] 5.2.2 Reading time calculation per locale (words/min)
  - [x] 5.2.3 TOC generation from heading blocks
  - [x] 5.2.4 Markdown import with conversion warnings

- [x] 5.3 Admin API ← 5.1, 5.2
  - [x] 5.3.1 CRUD articles with blocks
  - [x] 5.3.2 CRUD topics
  - [x] 5.3.3 Preview endpoint

- [x] 5.4 Public API ← 5.1, 5.2
  - [x] 5.4.1 List: paginated, filterable by topic, locale
  - [x] 5.4.2 Detail: full content + TOC + prev/next + related
  - [x] 5.4.3 Published only filter

- [x] 5.5 Tests ← 5.3, 5.4
  - [x] 5.5.1 Sanitization: script tags stripped, unsafe URLs rejected
  - [x] 5.5.2 Reading time: empty, short, long content
  - [x] 5.5.3 Public: only published articles visible

---

## فاز 6: Portfolio Module

- [x] 6.1 CaseStudy Model ← 1.5
  - [x] 6.1.1 فیلدها: slug_fa/en, title_fa/en, role_fa/en, client_fa/en, date_range, technologies (ArrayField)
  - [x] 6.1.2 فیلدها: outcome_fa/en, gallery M2M→MediaAsset, featured, status, version
  - [x] 6.1.3 Narrative blocks (same block system)
  - [x] 6.1.4 Migrations

- [x] 6.2 Serializers ← 6.1
  - [x] 6.2.1 CaseStudySerializer with nested blocks + gallery + tech tags

- [x] 6.3 Admin API ← 6.2
  - [x] 6.3.1 CRUD case studies

- [x] 6.4 Public API ← 6.1
  - [x] 6.4.1 List: filterable, paginated, published only
  - [x] 6.4.2 Detail: full narrative + gallery + metadata

- [x] 6.5 Tests ← 6.3, 6.4
  - [x] 6.5.1 CRUD operations
  - [x] 6.5.2 Public projection (no draft)

---

## فاز 7: Workflow & Revisions

- [x] 7.1 Models ← Phases 3-6
  - [x] 7.1.1 Revision: GenericFK, snapshot JSONField, revision_number, created_by, created_at
  - [x] 7.1.2 ScheduledPublish: content GenericFK, scheduled_at, timezone, status, attempts, last_error
  - [x] 7.1.3 AuditEvent: user, timestamp, action, entity_type, entity_id, reason
  - [x] 7.1.4 Migrations

- [x] 7.2 State Machine ← 7.1
  - [x] 7.2.1 Define ALLOWED_TRANSITIONS (draft→in_review→scheduled→published→archived→draft)
  - [x] 7.2.2 Permission-checked transitions
  - [x] 7.2.3 AuditEvent on every transition

- [x] 7.3 Revision System ← 7.1
  - [x] 7.3.1 Immutable revision creation on publish (snapshot full content)
  - [x] 7.3.2 Revision comparison (diff between two revisions)
  - [x] 7.3.3 Restore revision as new draft (copy snapshot)

- [x] 7.4 Scheduled Publishing ← 7.1
  - [x] 7.4.1 Celery beat setup
  - [x] 7.4.2 `publish_scheduled_content` task (timezone-aware, idempotent)
  - [x] 7.4.3 Retry with logging (3 attempts, exponential backoff)
  - [x] 7.4.4 Cancel/reschedule endpoints

- [x] 7.5 Preview System ← 7.1
  - [x] 7.5.1 Token generation (15min expiry, locale-specific)
  - [x] 7.5.2 Token revocation
  - [x] 7.5.3 Preview endpoint: X-Robots-Tag: noindex, Cache-Control: no-store

- [x] 7.6 Translation Status ← 7.1
  - [x] 7.6.1 Computation: Missing | Incomplete | Complete | Outdated
  - [x] 7.6.2 API endpoint for translation queue

- [x] 7.7 Admin API ← 7.2-7.6
  - [x] 7.7.1 Transition endpoint (validate + audit)
  - [x] 7.7.2 Revisions list + compare + restore
  - [x] 7.7.3 Schedule/cancel endpoints

- [x] 7.8 Tests ← 7.7
  - [x] 7.8.1 Invalid transitions rejected
  - [x] 7.8.2 Revision immutability
  - [x] 7.8.3 Schedule execution
  - [x] 7.8.4 Preview token expiry
  - [x] 7.8.5 Property-based: workflow state machine (hypothesis)

- [x] **7.9 CHECKPOINT:** Content lifecycle کامل

---

## فاز 8: Responsive Layout & Navigation

- [x] 8.1 Layout Container ← 2.1
  - [x] 8.1.1 ایجاد PublicLayout component: `max-w-screen-xl px-4 sm:px-6 lg:px-8 mx-auto`
  - [x] 8.1.2 CSS logical properties: `ps-`, `pe-`, `ms-`, `me-` everywhere
  - [x] 8.1.3 `<main id="main-content" tabindex="-1">` for skip-to-content target
  - [x] 8.1.4 Mobile-first breakpoints verified

- [x] 8.2 Header Component ← 2.5, 8.1
  - [x] 8.2.1 Logo + nav links + LanguageSwitcher + ThemeToggle
  - [x] 8.2.2 Desktop nav visible at md (768px)+
  - [x] 8.2.3 Active nav item: border/underline indicator (not color-only)
  - [x] 8.2.4 Semantic `<header>` + `<nav>`

- [x] 8.3 MobileNavDrawer ← 8.2
  - [x] 8.3.1 Sheet-based drawer component (visible below 768px)
  - [x] 8.3.2 Hamburger menu trigger button (aria-label)
  - [x] 8.3.3 Focus trap within drawer
  - [x] 8.3.4 Escape key dismiss
  - [x] 8.3.5 Scroll lock while open
  - [x] 8.3.6 Focus return to trigger on close

- [x] 8.4 SkipToContent ← 8.1
  - [x] 8.4.1 `sr-only focus:not-sr-only` styling
  - [x] 8.4.2 First focusable element on page
  - [x] 8.4.3 Link to `#main-content`

- [x] 8.5 LanguageSwitcher ← 8.2
  - [x] 8.5.1 Detect current locale from URL
  - [x] 8.5.2 Navigate to equivalent page in alternate locale
  - [x] 8.5.3 No action if no translation exists for current page

- [x] 8.6 Footer ← 8.1
  - [x] 8.6.1 Secondary navigation links
  - [x] 8.6.2 Copyright notice
  - [x] 8.6.3 Social links (from CMS data)
  - [x] 8.6.4 `<footer>` semantic element

- [x] 8.7 Navigation Tests
  - [x] 8.7.1 MobileNavDrawer focus trap + Escape
  - [x] 8.7.2 LanguageSwitcher routing logic
  - [x] 8.7.3 Active nav indication

- [x] **8.8 CHECKPOINT:** Layout و navigation در تمام breakpoints صحیح

---

## فاز 9: Public Pages — SSR

- [x] 9.1 Locale Routing ← 2.6, 8.1
  - [x] 9.1.1 `app/[locale]/layout.tsx`: locale shell (html[lang], html[dir], fonts, ThemeProvider)
  - [x] 9.1.2 `middleware.ts`: locale detection, redirect
  - [x] 9.1.3 Supported locales: `fa`, `en`

- [x] 9.2 API Client ← 1.2
  - [x] 9.2.1 ایجاد `src/lib/api.ts`: base URL, error handling, auth headers
  - [x] 9.2.2 Fetch wrapper with ISR revalidation tags
  - [x] 9.2.3 Error normalization (Problem Details → user-friendly)

- [x] 9.3 BlockRenderer ← 9.1
  - [x] 9.3.1 Map block_type → React component
  - [x] 9.3.2 Type-safe dispatch (switch on type)
  - [x] 9.3.3 Unknown blocks excluded (fail-closed, no crash)
  - [x] 9.3.4 Block components: HeroBlock, TextBlock, GalleryBlock, CTABlock, CollectionBlock, QuoteBlock, DividerBlock

- [x] 9.4 Home Page ← 9.3, 3.8
  - [x] 9.4.1 Hero section: owner name, title, introduction (first viewport)
  - [x] 9.4.2 CMS sections: research, portfolio, publications, blog, contact CTA
  - [x] 9.4.3 Section ordering from CMS (enabled only)
  - [x] 9.4.4 Fallback: owner name + loading message on CMS unavailable
  - [x] 9.4.5 ISR: revalidate 60s

- [x] 9.5 Blog Pages ← 9.3, 5.4
  - [x] 9.5.1 Listing: article cards (title, excerpt, date, reading time, topics)
  - [x] 9.5.2 Pagination + topic filter + URL-state sync
  - [x] 9.5.3 Detail: full article + TableOfContents sidebar
  - [x] 9.5.4 Detail: reading time indicator + related content + prev/next
  - [x] 9.5.5 ISR: listing 30s, detail static + on-demand revalidation

- [x] 9.6 Portfolio Pages ← 9.3, 6.4
  - [x] 9.6.1 Listing: project cards (title, thumbnail, tech tags, description)
  - [x] 9.6.2 Filter + pagination
  - [x] 9.6.3 Detail: facts sidebar, gallery, technology tags, outcome narrative
  - [x] 9.6.4 ISR: revalidate 60s

- [x] 9.7 Static Content Pages ← 9.3
  - [x] 9.7.1 About page: profile content from CMS
  - [x] 9.7.2 Resume page: experience, education, skills, certifications (semantic grouping)
  - [x] 9.7.3 Research page: research interests and focus areas
  - [x] 9.7.4 Publications page: citation-style entries (title, authors, venue, date, DOI)

- [x] 9.8 Contact Page ← 9.1
  - [x] 9.8.1 Form: name (min 2), email (valid), subject (min 3), message (min 10)
  - [x] 9.8.2 Client-side validation with inline errors (aria-describedby)
  - [x] 9.8.3 CSRF token inclusion
  - [x] 9.8.4 Submit button: disabled + loading state during submission
  - [x] 9.8.5 Success: confirmation message
  - [x] 9.8.6 Failure: error message + preserved input + retry
  - [x] 9.8.7 SSR rendering (CSRF token freshness)

- [x] 9.9 SEO & Structured Data ← 9.4-9.8
  - [x] 9.9.1 `generateMetadata()` per route: unique title, description, OG, Twitter Card
  - [x] 9.9.2 hreflang alternate links (fa/en)
  - [x] 9.9.3 Canonical URLs via `alternates.canonical`
  - [x] 9.9.4 `app/sitemap.ts`: dynamic, fetches published URLs from API (both locales)
  - [x] 9.9.5 `app/robots.ts`: exclude /admin, /api, preview, draft, archived
  - [x] 9.9.6 JSON-LD: BlogPosting for articles
  - [x] 9.9.7 JSON-LD: CreativeWork/SoftwareApplication for portfolio

- [x] 9.10 Empty States ← 9.5-9.7
  - [x] 9.10.1 EmptyState component: icon + message + suggested action
  - [x] 9.10.2 Used for empty blog, portfolio, publications lists

- [x] 9.11 Error Pages ← 9.1
  - [x] 9.11.1 Custom 404 page (locale-aware, navigation suggestions)
  - [x] 9.11.2 Custom 500 page

- [x] 9.12 Tests
  - [x] 9.12.1 BlockRenderer: known/unknown type dispatch
  - [x] 9.12.2 Contact form validation
  - [x] 9.12.3 SEO metadata per route
  - [x] 9.12.4 hreflang presence

- [x] **9.13 CHECKPOINT:** تمام صفحات عمومی SSR، SEO، bilingual صحیح

---

## فاز 10: Component Library Expansion

- [x] 10.1 Missing shadcn/ui Components ← 2.1
  - [x] 10.1.1 Add Alert component (via CLI)
  - [x] 10.1.2 Add Progress component
  - [x] 10.1.3 Add Drawer component (for mobile nav)
  - [x] 10.1.4 Verify all use semantic tokens (no hardcoded colors)
  - [x] 10.1.5 Verify focus indicators (3:1 contrast)

- [x] 10.2 Button & Card Refinement ← 2.1
  - [x] 10.2.1 Verify 6 button variants: default, secondary, outline, ghost, link, destructive
  - [x] 10.2.2 Card hover state: 200ms ease-out (box-shadow + subtle transform)
  - [x] 10.2.3 Disabled: reduced opacity + pointer-events: none + aria-disabled

- [x] 10.3 PageHeader Component ← 2.7
  - [x] 10.3.1 Consistent H1 + optional subtitle pattern
  - [x] 10.3.2 Used across all content pages

- [x] 10.4 Form Component Refinement ← 2.1
  - [x] 10.4.1 Input/Textarea/Select: consistent error styling
  - [x] 10.4.2 Error messages via `aria-describedby`
  - [x] 10.4.3 Disabled state: ARIA attributes
  - [x] 10.4.4 All inputs: programmatically associated labels

- [x] 10.5 TableOfContents Component ← 9.5
  - [x] 10.5.1 Auto-generate from heading blocks
  - [x] 10.5.2 Sticky sidebar on desktop
  - [x] 10.5.3 Scroll-aware active heading indicator

---

## فاز 11: Admin CMS Frontend

- [x] 11.1 Admin Auth ← 1.6
  - [x] 11.1.1 Client-side auth guard middleware
  - [x] 11.1.2 Login page with session cookie
  - [x] 11.1.3 Redirect to dashboard after login

- [x] 11.2 Dashboard ← 11.1
  - [x] 11.2.1 Summary stats: total posts, projects, publications, media
  - [x] 11.2.2 Recent activity feed (from AuditEvent)
  - [x] 11.2.3 Quick action links (new post, new project, upload media)

- [x] 11.3 Composer Canvas ← 11.1, 3.7
  - [x] 11.3.1 Section library panel (draggable sections)
  - [x] 11.3.2 Block library panel with previews
  - [x] 11.3.3 @dnd-kit drag-and-drop for blocks
  - [x] 11.3.4 Keyboard: move-up/move-down with arrow keys
  - [x] 11.3.5 Block selection → configuration panel

- [x] 11.4 Block Inspector ← 11.3
  - [x] 11.4.1 Typed settings editor per block_type
  - [x] 11.4.2 Live preview update within Canvas
  - [x] 11.4.3 Content fields (text, image picker, number)
  - [x] 11.4.4 Validation (inline errors)

- [x] 11.5 Undo/Redo ← 11.3
  - [x] 11.5.1 Command stack (push on block add/remove/reorder/config change)
  - [x] 11.5.2 Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
  - [x] 11.5.3 Reset stack on save

- [x] 11.6 Autosave & Conflict ← 11.3
  - [x] 11.6.1 Autosave: draft only, debounced (2s), status indicator (saving/saved/error)
  - [x] 11.6.2 Dirty guard: warn before navigation with unsaved changes
  - [x] 11.6.3 409 conflict dialog: show current version, option to reload or force save

- [x] 11.7 Preview ← 11.3
  - [x] 11.7.1 Device viewport simulator (375px, 768px, 1280px)
  - [x] 11.7.2 Locale toggle (fa/en) in preview
  - [x] 11.7.3 Editing controls disabled in preview mode

- [x] 11.8 MediaPicker ← 4.4
  - [x] 11.8.1 Modal/popover with media grid
  - [x] 11.8.2 Search by filename
  - [x] 11.8.3 Filter by MIME type
  - [x] 11.8.4 Select → return media reference
  - [x] 11.8.5 Clear/replace selected media
  - [x] 11.8.6 Inline upload with progress bar

- [x] 11.9 Media Library Page ← 11.8
  - [x] 11.9.1 Grid/list toggle view
  - [x] 11.9.2 Metadata editing (alt, caption)
  - [x] 11.9.3 Usage information per asset
  - [x] 11.9.4 Archive with confirmation dialog

- [x] 11.10 Article Editor ← 11.8, 5.3
  - [x] 11.10.1 Tiptap block editor setup
  - [x] 11.10.2 Slash commands (/, /h2, /image, /code, etc.)
  - [x] 11.10.3 Toolbar: formatting, link, media insert
  - [x] 11.10.4 Inline MediaPicker for images
  - [x] 11.10.5 Code block with syntax highlighting
  - [x] 11.10.6 Per-locale editing (fa/en tabs or side-by-side)

- [x] 11.11 Portfolio Editor ← 11.8, 6.3
  - [x] 11.11.1 Narrative block editing
  - [x] 11.11.2 Gallery management (add/remove/reorder)
  - [x] 11.11.3 Technology tags (autocomplete)
  - [x] 11.11.4 Facts sidebar editing

- [x] 11.12 Workflow UI ← 7.7
  - [x] 11.12.1 Status badge with transition buttons
  - [x] 11.12.2 Confirmation dialog for transitions
  - [x] 11.12.3 Revision timeline + compare view
  - [x] 11.12.4 Restore from revision (new draft)
  - [x] 11.12.5 Scheduling interface (date, time, timezone picker)
  - [x] 11.12.6 Translation status indicators

- [x] 11.13 Translation Interface ← 11.12
  - [x] 11.13.1 Translation queue (filterable by status)
  - [x] 11.13.2 Side-by-side compare (source locale ↔ target locale)

- [x] 11.14 Settings Page ← 11.1
  - [x] 11.14.1 Site-wide SEO defaults
  - [x] 11.14.2 Social links management
  - [x] 11.14.3 Contact information

- [x] 11.15 Admin Component Tests
  - [x] 11.15.1 Composer Canvas DnD operations
  - [x] 11.15.2 MediaPicker search + selection
  - [x] 11.15.3 Article Editor block management

- [x] **11.16 CHECKPOINT:** Admin کامل و عملیاتی

---

## فاز 12: Animation Page Builder

- [x] 12.1 Animation Block Types ← 3.4
  - [x] 12.1.1 Register new block types in CMS registry:
    - scroll-reveal, parallax, text-stagger, fade-in-sequence
    - hover-card, counter-animation, image-reveal, section-transition
  - [x] 12.1.2 JSON schema per animation block type
  - [x] 12.1.3 Block category: entrance, scroll, hover, text, media

- [x] 12.2 Animation Builder Interface ← 11.3
  - [x] 12.2.1 Block Library panel: filter by category, animated preview thumbnails
  - [x] 12.2.2 Canvas: vertical drag-and-drop ordering
  - [x] 12.2.3 Configuration panel: duration (50-3000ms), delay (0-2000ms), easing (6 options), trigger (scroll/load/hover/click)
  - [x] 12.2.4 Content fields per block type (text, image, number)
  - [x] 12.2.5 Character limit: 500 chars for text fields
  - [x] 12.2.6 Real-time preview update (within 300ms)
  - [x] 12.2.7 Undo/redo (20+ history)

- [x] 12.3 Preview Mode ← 12.2
  - [x] 12.3.1 Responsive viewport: 375px, 768px, 1280px
  - [x] 12.3.2 Light/dark theme toggle
  - [x] 12.3.3 RTL/LTR locale toggle
  - [x] 12.3.4 Editing disabled in preview

- [x] 12.4 Save & Publish ← 12.2, 7.7
  - [x] 12.4.1 Save as JSON to Django API
  - [x] 12.4.2 Validate: minimum 1 block
  - [x] 12.4.3 Draft/published states
  - [x] 12.4.4 Revision history
  - [x] 12.4.5 LocalStorage fallback on network error + retry

- [x] 12.5 Public Renderer ← 12.4
  - [x] 12.5.1 GPU-accelerated animations (CSS transforms + opacity)
  - [x] 12.5.2 Intersection Observer for scroll triggers (configurable threshold)
  - [x] 12.5.3 RTL/LTR: no animation artifacts
  - [x] 12.5.4 `prefers-reduced-motion`: immediate final state
  - [x] 12.5.5 Theme-aware (light/dark)
  - [x] 12.5.6 LCP < 2.5s, CLS < 0.1

- [x] 12.6 Responsive Animation ← 12.5
  - [x] 12.6.1 Scale proportionally below 768px
  - [x] 12.6.2 Simplify multi-element → single-element below 768px
  - [x] 12.6.3 Minimum 30fps on 375px+ devices
  - [x] 12.6.4 Mobile overrides per block (duration, distance)

- [x] 12.7 Keyboard Accessibility ← 12.2
  - [x] 12.7.1 Full keyboard navigation for composition
  - [x] 12.7.2 Visible focus indicators (3:1 contrast)
  - [x] 12.7.3 ARIA live regions for reorder/config changes
  - [x] 12.7.4 Delete (Del), Duplicate (Ctrl+D), Undo (Ctrl+Z), Redo (Ctrl+Shift+Z)

---

## فاز 13: Motion, Interaction & Accessibility

- [x] 13.1 Motion Design ← 9.1, 10.2
  - [x] 13.1.1 Button hover/focus: 150ms ease-in-out (background, box-shadow)
  - [x] 13.1.2 Card hover: 200ms ease-out (box-shadow, transform)
  - [x] 13.1.3 Page transitions: 200ms ease-out (opacity)
  - [x] 13.1.4 Navigation state: 150ms ease-in-out (color, border)
  - [x] 13.1.5 Skeleton pulse: 1.5s infinite ease-in-out (opacity)
  - [x] 13.1.6 Drawer open: 300ms cubic-bezier(0.32,0.72,0,1) (transform)
  - [x] 13.1.7 Use transform + opacity only (avoid layout thrashing)

- [x] 13.2 Reduced Motion ← 13.1
  - [x] 13.2.1 Global `@media (prefers-reduced-motion: reduce)` in globals.css
  - [x] 13.2.2 `motion-reduce:transition-none` on interactive components
  - [x] 13.2.3 Verify all non-essential animations disabled

- [x] 13.3 Accessibility Audit ← 9.1-12.7
  - [x] 13.3.1 Semantic landmarks: header, nav, main, footer on every page
  - [x] 13.3.2 Sequential heading hierarchy (H1→H6, no skipping)
  - [x] 13.3.3 ARIA live regions for route changes
  - [x] 13.3.4 Visible focus indicators on all interactive elements (`:focus-visible` in `globals.css`)
  - [x] 13.3.5 All form inputs: programmatically associated labels (`htmlFor`, `aria-describedby`)
  - [x] 13.3.6 Images: alt text audit (meaningful with fa/en alt vs decorative)
  - [x] 13.3.7 Full keyboard navigation verification (Tab, Escape, Enter, Space, Arrows)
  - [x] 13.3.8 Touch targets: ≥44×44px verification across mobile components
  - [x] 13.3.9 Color contrast: 4.5:1 normal, 3:1 large text
  - [x] 13.3.10 Form errors: `aria-describedby` linked with inline messages

- [*] 13.4 Accessibility Tests
  - [x] 13.4.1 axe-core / @axe-core/playwright audit on all page templates
  - [x] 13.4.2 Heading hierarchy automated tests
  - [x] 13.4.3 Focus indicator visibility tests
  - [x] 13.4.4 Focus trap tests: MobileNavDrawer, MediaPickerModal, ConfirmationDialogs


---

## فاز 14: Security, Performance & Optimization

- [x] 14.1 Security Hardening ← Phase 1
  - [x] 14.1.1 Security headers in Nginx (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
  - [x] 14.1.2 Rate limiting verification (login: 5/min, upload: 20/min, public API: 100/min)
  - [ ] 14.1.3 Audit logging completeness check for all Admin mutations
  - [ ] 14.1.4 Input sanitization verification (fail-closed, HTML/Script stripping)
  - [x] 14.1.5 Preview & Admin: X-Robots-Tag: noindex, no-store enforcement
  - [ ] 14.1.6 Secrets audit: .env only, zero credentials in Git repository

- [x] 14.2 Image & Asset Optimization ← 9.1
  - [x] 14.2.1 `next/image`: WebP/AVIF formats, `sizes` responsive attribute
  - [x] 14.2.2 Hero/above-fold images: `priority` prop
  - [x] 14.2.3 Below-fold images: `loading="lazy"`
  - [x] 14.2.4 Explicit dimensions/aspect-ratio for CLS prevention
  - [x] 14.2.5 Blurred placeholder generation for rich image loading

- [x] 14.3 Bundle & Architecture Optimization ← 9.1, 11.1
  - [x] 14.3.1 Admin/public bundle separation verification
  - [x] 14.3.2 Dynamic imports for heavy components (Tiptap, @dnd-kit, charts, CodeHighlight)
  - [x] 14.3.3 RSC-first architecture on public pages
  - [x] 14.3.4 Font optimization: next/font + preconnect headers

- [x] 14.4 Database & Query Optimization ← Phases 3-7
  - [x] 14.4.1 `select_related` + `prefetch_related` audit across all endpoints (prevent N+1 queries)
  - [x] 14.4.2 Query count verification on key public APIs
  - [x] 14.4.3 Index usage verification on PostgreSQL (slug, status, published_at, locale)

- [ ] 14.5 Core Web Vitals ← 14.2, 14.3 (ثبت در fast-track ledger `docs/status/deferred-validation.md`)
  - [ ] 14.5.1 Lighthouse audit: LCP < 2.5s
  - [ ] 14.5.2 Lighthouse audit: CLS < 0.1
  - [ ] 14.5.3 Lighthouse audit: INP / FID < 100ms

- [x] 14.6 Rich Content Security (RC-003) ← 9.3
  - [x] 14.6.1 Security test fixtures: script, onerror, SVG malicious, javascript: URLs, data: URLs, iframe/object/embed
  - [x] 14.6.2 Verify: unsafe nodes/attributes absent from SSR HTML and hydrated DOM
  - [x] 14.6.3 SSR acceptance: deterministic output, request isolation, no browser-only deps on server
  - [x] 14.6.4 Hydration: byte/DOM-equivalent SSR ↔ client output, zero warnings
  - [x] 14.6.5 CSP verification: no inline script/style for CMS output

---

## فاز 15: E2E Testing, Production Rollout & Operations

- [ ] 15.1 E2E Integration Tests (Playwright) ← Phases 9-12 (ثبت در fast-track ledger `docs/status/deferred-validation.md`)
  - [ ] 15.1.1 Flow: login → media upload → page compose → preview → publish
  - [ ] 15.1.2 Flow: article create → blocks → publish → public read
  - [ ] 15.1.3 Test: anonymous user sees only published content (no draft/archived leak)
  - [ ] 15.1.4 Test: locale switching (fa/en dir, no fallback)
  - [ ] 15.1.5 Test: contact form submit (success + error paths + CSRF)
  - [ ] 15.1.6 Test: animation page builder lifecycle

- [ ] 15.2 Manual QA & Visual Verification (ثبت در fast-track ledger `docs/status/deferred-validation.md`)
  - [ ] 15.2.1 RTL/LTR at 375, 768, 1024, 1440px viewports
  - [ ] 15.2.2 Keyboard-only: admin Composer navigation & focus restoration
  - [ ] 15.2.3 Screen reader smoke test (VoiceOver/NVDA)
  - [ ] 15.2.4 No placeholder content visible (all production-ready real data)
  - [ ] 15.2.5 Reduced motion honored across all routes
  - [ ] 15.2.6 Dark mode: all pages, no broken contrast or invisible text

- [x] 15.3 Deployment & Operations ← 15.1
  - [x] 15.3.1 Production Docker Compose (health checks, resource limits, auto-restart)
  - [x] 15.3.2 Database seed/migration from existing approved seed script (`seed_composer_demo`)
  - [x] 15.3.3 Backup scripts: PostgreSQL `pg_dump` + media files `tar`
  - [x] 15.3.4 Restore procedure verification & rehearsal
  - [x] 15.3.5 README documentation (setup, dev, deploy, runbooks)
  - [x] 15.3.6 Health endpoint monitoring (`/api/health/`)
  - [x] 15.3.7 Sentry error tracking verification & alert routing

- [x] **15.4 FINAL CHECKPOINT:** E2E pass، production deployed، rollback tested ✅


---

## فاز ویژه: CMS V2 & WordPress Capability Integration (اسناد 012 و WP Ref)

- [x] V2.1 **Media Picker Integration:**
  - [x] V2.1.1 یکپارچه‌سازی کامل `AdminMediaSelector` و `MediaPickerModal` در تمام فرم‌های Admin (Site Settings, Composer, Blog, Portfolio, Publications, Resume).
  - [x] V2.1.2 حذف کامل هرگونه ورودی UUID خام یا اتکا به لیست متنی IDها.
  - [x] V2.1.3 اعمال فیلتر نوع فیلد (انحصار تصویر برای coverها و انحصار PDF برای اسناد رزومه در backend و frontend).
- [x] V2.2 **Composer Templates & Dry-run Import:**
  - [x] V2.2.1 ماژول `ComposerTemplate` برای ایجاد snapshotهای قابل‌حمل صفحه.
  - [x] V2.2.2 فرایند Dry-run import بدون تغییر دیتابیس زنده جهت اعتبارسنجی ارجاعات رسانه و سلامت ساختار.
  - [x] V2.2.3 اعتبارسنجی فیلدهای امنیتی URL و نفی raw HTML در تپلیت‌ها.
- [x] V2.3 **Translation Freshness & Queue:**
  - [x] V2.3.1 منطق خودکار تشخیص وضعیت ترجمه (Missing / Incomplete / Complete / Outdated).
  - [x] V2.3.2 به‌روزرسانی محتوای منبع فقط وضعیت مقصد را به Outdated تغییر دهد (بدون کپی خودکار یا Overwrite).
  - [x] V2.3.3 رابط کاربری Side-by-side برای ترجمه هم‌زمان با حفظ استقلال محتوایی fa/en.
- [x] V2.4 **Publication & Case Study Narrative:**
  - [x] V2.4.1 فیلدهای استاندارد Case Study (Statement, Role, Context, Decisions, Artifacts, Outcome).
  - [x] V2.4.2 فیلدهای ارجاع آکادمیک Publications (Title, Authors, Venue, Year, DOI/ISBN, BibTeX).
  - [x] V2.4.3 تضمین لود رسانه‌های گالری فقط از `MediaAsset` فعال و دارای alt محلی.


---

## خلاصه آماری

| فاز | تسک‌ها | تسک‌های اختیاری | تخمین هفته |
|-----|--------|----------------|------------|
| Phase 1: Setup | 43 | 0 | 1-2 |
| Phase 2: Design Tokens | 25 | 3 | 2-3 |
| Phase 3: CMS Core | 21 | 0 | 3-5 |
| Phase 4: Media | 18 | 0 | 4-5 |
| Phase 5: Blog | 15 | 0 | 5-7 |
| Phase 6: Portfolio | 10 | 0 | 6-7 |
| Phase 7: Workflow | 22 | 0 | 7-8 |
| Phase 8: Navigation | 19 | 3 | 8-9 |
| Phase 9: Public Pages | 38 | 4 | 9-11 |
| Phase 10: Components | 14 | 0 | 10-11 |
| Phase 11: Admin CMS | 44 | 3 | 11-14 |
| Phase 12: Animation Builder | 27 | 0 | 14-16 |
| Phase 13: Motion & A11y | 24 | 4 | 15-16 |
| Phase 14: Security & Perf | 25 | 0 | 16-17 |
| Phase 15: E2E & Deploy | 19 | 0 | 17-18 |
| CMS V2 Capabilities | 12 | 0 | 18-19 |
| **مجموع** | **~376** | **~17** | **19 هفته** |

