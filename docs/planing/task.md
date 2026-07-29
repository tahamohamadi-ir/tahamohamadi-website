# Task List — TahaMohamadi.ir Implementation

**نسخه:** 1.0  
**تاریخ:** 2026-07-29  
**وضعیت:** آماده اجرا  
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

- [ ] 1.1 ساختار دایرکتوری monorepo
  - [ ] 1.1.1 ایجاد `/docker`, `/e2e`, `/scripts`, `/infra` directories
  - [ ] 1.1.2 ایجاد `docker-compose.yml` (4 services: nginx, django, nextjs, postgres)
  - [ ] 1.1.3 ایجاد `docker-compose.dev.yml` (hot reload, dev volumes)
  - [ ] 1.1.4 ایجاد `docker-compose.prod.yml` (health checks, resource limits)
  - [ ] 1.1.5 ایجاد `.env.example` با تمام environment variables

- [ ] 1.2 Django Project Setup ← 1.1
  - [ ] 1.2.1 تنظیم Django 5.x project structure: `config/settings/base.py`, `dev.py`, `prod.py`
  - [ ] 1.2.2 نصب DRF + `django-cors-headers` + `django-filter`
  - [ ] 1.2.3 تنظیم `INSTALLED_APPS`, DRF default settings, JSON renderer
  - [ ] 1.2.4 تنظیم URL routing: `/api/public/` و `/api/admin/`
  - [ ] 1.2.5 ایجاد custom exception handler (RFC 7807 Problem Details)
  - [ ] 1.2.6 نصب و تنظیم Gunicorn config
  - [ ] 1.2.7 ایجاد Dockerfile (`backend/Dockerfile`)

- [ ] 1.3 Next.js Project Setup ← 1.1
  - [ ] 1.3.1 بررسی/تأیید Next.js 15 + App Router + TypeScript setup (موجود)
  - [ ] 1.3.2 بررسی/تأیید Tailwind CSS 4 + shadcn/ui (New York) setup (موجود)
  - [ ] 1.3.3 تنظیم path aliases (`@/`) در `tsconfig.json`
  - [ ] 1.3.4 بررسی ساختار `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`
  - [ ] 1.3.5 ایجاد `next.config.ts` تنظیمات (images, rewrites, i18n)
  - [ ] 1.3.6 ایجاد Dockerfile (`frontend/Dockerfile`)

- [ ] 1.4 Nginx Configuration ← 1.1
  - [ ] 1.4.1 ایجاد `docker/nginx/nginx.conf` با routing rules
  - [ ] 1.4.2 `/api/*` → Django proxy
  - [ ] 1.4.3 `/_next/static/*` → static files serve
  - [ ] 1.4.4 `/*` → Next.js proxy
  - [ ] 1.4.5 تنظیم security headers (HSTS, X-Frame-Options, X-Content-Type-Options)

- [ ] 1.5 Base Models ← 1.2
  - [ ] 1.5.1 ایجاد `apps/core/models.py`: `TimestampedModel` (UUID pk, audit fields)
  - [ ] 1.5.2 ایجاد `VersionedModel` (extends TimestampedModel + version field)
  - [ ] 1.5.3 ایجاد `apps/core/exceptions.py`: custom Problem Details exception classes
  - [ ] 1.5.4 ایجاد `apps/core/middleware.py`: audit middleware (created_by/updated_by injection)
  - [ ] 1.5.5 اجرای initial migrations

- [ ] 1.6 Authentication & Security ← 1.2
  - [ ] 1.6.1 تنظیم session-based auth با CSRF enforcement
  - [ ] 1.6.2 تنظیم CORS (allow frontend origin, credentials: true)
  - [ ] 1.6.3 ایجاد login/logout/whoami API endpoints
  - [ ] 1.6.4 ایجاد permission classes: `IsAdmin`, `IsEditor`, `IsReviewer`
  - [ ] 1.6.5 ایجاد rate limiting middleware (login: 5/min, upload: 20/min)

- [ ] 1.7 Testing Infrastructure
  - [ ] 1.7.1 تنظیم `pytest.ini` + `conftest.py` (fixtures, factories) ← 1.2
  - [ ] 1.7.2 تنظیم `vitest.config.ts` + testing-library setup ← 1.3
  - [ ] 1.7.3 ایجاد `e2e/` directory با Playwright config ← 1.3
  - [ ] 1.7.4 نصب hypothesis (backend PBT) و fast-check (frontend PBT)

- [ ] 1.8 Linting & CI
  - [ ] 1.8.1 تنظیم `ruff.toml` (backend formatter + linter)
  - [ ] 1.8.2 تنظیم ESLint + Prettier (frontend)
  - [ ] 1.8.3 ایجاد `.github/workflows/ci.yml`: lint → test → build → push

- [ ] **1.9 CHECKPOINT:** `docker compose up` → همه سرویس‌ها بالا، تست‌ها سبز، CI pass

---

## فاز 2: Design Token System & Theming

- [ ] 2.1 Semantic Color Tokens ← 1.3
  - [ ] 2.1.1 تعریف light theme tokens در `:root` (`globals.css`)
    - canvas, surface, primary, primary-foreground, secondary, secondary-foreground
    - muted, muted-foreground, accent, accent-foreground
    - destructive, destructive-foreground, success, warning, info
    - border, input, ring, background, foreground
    - card, card-foreground, popover, popover-foreground
  - [ ] 2.1.2 تعریف dark theme tokens در `.dark` class
  - [ ] 2.1.3 تأیید contrast ratios: 4.5:1 (normal text), 3:1 (large text)

- [ ] 2.2 Spacing & Radius Scale ← 1.3
  - [ ] 2.2.1 تعریف spacing scale در `@theme`: space-1(4px) → space-24(96px)
  - [ ] 2.2.2 تعریف radius scale: sm(4px), md(6px), lg(8px), xl(12px), full(9999px)

- [ ] 2.3 Tailwind CSS 4 Theme Integration ← 2.1, 2.2
  - [ ] 2.3.1 Map CSS custom properties to Tailwind via `@theme`
  - [ ] 2.3.2 Configure font tokens: `--font-heading`, `--font-body`, `--font-mono` (per locale)
  - [ ] 2.3.3 Verify semantic tokens as Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.)

- [ ] 2.4 Dark Mode Provider ← 2.1
  - [ ] 2.4.1 Install `next-themes`
  - [ ] 2.4.2 Configure ThemeProvider: `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
  - [ ] 2.4.3 Wrap root layout with ThemeProvider + `suppressHydrationWarning`
  - [ ] 2.4.4 Verify no flash of incorrect theme on load

- [ ] 2.5 ThemeToggle Component ← 2.4
  - [ ] 2.5.1 Build Sun/Moon toggle (shadcn/ui Button ghost + icon size)
  - [ ] 2.5.2 Place in Header component
  - [ ] 2.5.3 Verify localStorage persistence
  - [ ] 2.5.4 Verify switch without page reload

- [ ] 2.6 Typography System ← 1.3
  - [ ] 2.6.1 Configure Vazirmatn Variable via `next/font/google` (Persian, swap)
  - [ ] 2.6.2 Configure Inter via `next/font/google` (English, swap)
  - [ ] 2.6.3 Configure JetBrains Mono (code blocks)
  - [ ] 2.6.4 Export font className from `src/lib/fonts.ts`
  - [ ] 2.6.5 Apply in `app/[locale]/layout.tsx`: correct font per locale
  - [ ] 2.6.6 Set `dir="rtl"` for fa, `dir="ltr"` for en on `<html>`
  - [ ] 2.6.7 Apply locale-specific line-height (fa: 1.8-2.0, en: 1.5-1.6)
  - [ ] 2.6.8 Constrain prose content to 65ch max-width

- [ ] 2.7 Type Scale ← 2.6
  - [ ] 2.7.1 Define heading hierarchy: xs(12px) → 5xl(48px) with weight mapping
  - [ ] 2.7.2 Responsive font sizes (smaller on mobile, scale up)
  - [ ] 2.7.3 Enforce one visible H1 per page

- [*] 2.8 Unit Tests for Theming
  - [ ] 2.8.1 Test ThemeToggle renders correctly
  - [ ] 2.8.2 Test localStorage persistence
  - [ ] 2.8.3 Test system preference detection

- [ ] **2.9 CHECKPOINT:** Tokens، dark mode، fonts کامل و صحیح

---

## فاز 3: CMS Core — Composer System

- [ ] 3.1 Page Model ← 1.5
  - [ ] 3.1.1 ایجاد `apps/cms/models.py`: Page model (slug_fa/en, title_fa/en, page_type, status, published_at)
  - [ ] 3.1.2 Field types: slug (allow_unicode for fa), status choices, version
  - [ ] 3.1.3 Indexes: slug, status, published_at
  - [ ] 3.1.4 Unique constraints: slug_fa, slug_en separately

- [ ] 3.2 Section Model ← 3.1
  - [ ] 3.2.1 Section: page FK (CASCADE), ordering, enabled, layout choices
  - [ ] 3.2.2 Meta: unique_together (page, ordering)

- [ ] 3.3 Block Model ← 3.2
  - [ ] 3.3.1 Block: section FK (CASCADE), block_type choices, settings JSONField, ordering
  - [ ] 3.3.2 Meta: unique_together (section, ordering)
  - [ ] 3.3.3 Migrations

- [ ] 3.4 Block Type Registry ← 3.3
  - [ ] 3.4.1 ایجاد `apps/cms/block_registry.py`: block type → JSON schema mapping
  - [ ] 3.4.2 Register block types: hero, text, gallery, cta, collection, quote, divider, research_focus
  - [ ] 3.4.3 Validation: reject unknown types, validate settings against schema
  - [ ] 3.4.4 Extensible: new types registered without code changes to core

- [ ] 3.5 DRF Serializers ← 3.1-3.3
  - [ ] 3.5.1 BlockSerializer: validate block_type + settings
  - [ ] 3.5.2 SectionSerializer: nested BlockSerializer (writable)
  - [ ] 3.5.3 PageSerializer: nested SectionSerializer (writable)
  - [ ] 3.5.4 Version field for optimistic locking

- [ ] 3.6 Services ← 3.4, 3.5
  - [ ] 3.6.1 `validate_page_composition()`: ordering, media refs, URL safety
  - [ ] 3.6.2 `save_with_optimistic_lock()`: version check, 409 Conflict
  - [ ] 3.6.3 `get_public_page()`: published + enabled + known blocks

- [ ] 3.7 Admin API ← 3.6
  - [ ] 3.7.1 ViewSet: `GET/POST /api/admin/cms/pages/`
  - [ ] 3.7.2 ViewSet: `GET/PUT/DELETE /api/admin/cms/pages/{id}/`
  - [ ] 3.7.3 Session + CSRF enforcement
  - [ ] 3.7.4 Audit logging on mutations

- [ ] 3.8 Public API ← 3.6
  - [ ] 3.8.1 Read-only ViewSet: `GET /api/public/pages/{slug}/?locale=fa`
  - [ ] 3.8.2 Filter: published only, enabled sections, known blocks

- [ ] 3.9 Tests ← 3.7, 3.8
  - [ ] 3.9.1 Unit: block validation (valid, invalid type, bad schema)
  - [ ] 3.9.2 Unit: optimistic locking (success, conflict)
  - [ ] 3.9.3 Integration: admin CRUD endpoints
  - [ ] 3.9.4 Integration: public projection (no draft, no disabled sections)

- [ ] **3.10 CHECKPOINT:** صفحات قابل compose، validate و serve عمومی

---

## فاز 4: Media Library

- [ ] 4.1 MediaAsset Model ← 1.5
  - [ ] 4.1.1 فیلدها: file, original_filename, mime_type, file_size, width, height, checksum
  - [ ] 4.1.2 فیلدها: alt_text_fa/en, caption_fa/en, status (active/archived)
  - [ ] 4.1.3 Indexes: mime_type, status
  - [ ] 4.1.4 Migrations

- [ ] 4.2 Upload Service ← 4.1
  - [ ] 4.2.1 MIME whitelist validation (image/png, image/jpeg, image/webp, image/svg+xml, application/pdf)
  - [ ] 4.2.2 Extension validation
  - [ ] 4.2.3 File size limit (10MB default, configurable)
  - [ ] 4.2.4 SHA-256 content-hash naming
  - [ ] 4.2.5 Image dimension extraction (Pillow)

- [ ] 4.3 Usage Tracking ← 4.1, 3.3
  - [ ] 4.3.1 ایجاد MediaUsage model (GenericFK: content_type, object_id, media FK)
  - [ ] 4.3.2 Track references on CMS block save
  - [ ] 4.3.3 Archive impact warning (list referencing content)
  - [ ] 4.3.4 Orphan detection query

- [ ] 4.4 Admin API ← 4.2, 4.3
  - [ ] 4.4.1 `POST /api/admin/media/upload/` — multipart, validation, hash naming
  - [ ] 4.4.2 `GET /api/admin/media/` — paginated, search by filename/mime, sort
  - [ ] 4.4.3 `GET /api/admin/media/{id}/` — detail + usage info
  - [ ] 4.4.4 `PATCH /api/admin/media/{id}/` — update metadata (alt, caption)
  - [ ] 4.4.5 `POST /api/admin/media/{id}/archive/` — archive with usage check
  - [ ] 4.4.6 `GET /api/admin/media/orphans/` — orphan report

- [ ] 4.5 Tests ← 4.4
  - [ ] 4.5.1 Upload: valid file, invalid MIME, oversize
  - [ ] 4.5.2 Archive: free asset, referenced asset (blocked)
  - [ ] 4.5.3 Orphan detection accuracy

- [ ] **4.6 CHECKPOINT:** Media upload، metadata، archive و orphan detection عملیاتی

---

## فاز 5: Blog Module

- [ ] 5.1 Models ← 1.5
  - [ ] 5.1.1 Article: slug_fa/en, title_fa/en, excerpt_fa/en, featured_image FK, status, published_at, reading_time_fa/en, version
  - [ ] 5.1.2 ArticleBlock: article FK, locale (fa/en), block_type, content JSONField, ordering
  - [ ] 5.1.3 Topic: slug, name_fa, name_en
  - [ ] 5.1.4 Article-Topic M2M relationship
  - [ ] 5.1.5 Migrations

- [ ] 5.2 Services ← 5.1
  - [ ] 5.2.1 Content sanitization (strip HTML/script/unsafe URLs)
  - [ ] 5.2.2 Reading time calculation per locale (words/min)
  - [ ] 5.2.3 TOC generation from heading blocks
  - [ ] 5.2.4 Markdown import with conversion warnings

- [ ] 5.3 Admin API ← 5.1, 5.2
  - [ ] 5.3.1 CRUD articles with blocks
  - [ ] 5.3.2 CRUD topics
  - [ ] 5.3.3 Preview endpoint

- [ ] 5.4 Public API ← 5.1, 5.2
  - [ ] 5.4.1 List: paginated, filterable by topic, locale
  - [ ] 5.4.2 Detail: full content + TOC + prev/next + related
  - [ ] 5.4.3 Published only filter

- [ ] 5.5 Tests ← 5.3, 5.4
  - [ ] 5.5.1 Sanitization: script tags stripped, unsafe URLs rejected
  - [ ] 5.5.2 Reading time: empty, short, long content
  - [ ] 5.5.3 Public: only published articles visible

---

## فاز 6: Portfolio Module

- [ ] 6.1 CaseStudy Model ← 1.5
  - [ ] 6.1.1 فیلدها: slug_fa/en, title_fa/en, role_fa/en, client_fa/en, date_range, technologies (ArrayField)
  - [ ] 6.1.2 فیلدها: outcome_fa/en, gallery M2M→MediaAsset, featured, status, version
  - [ ] 6.1.3 Narrative blocks (same block system)
  - [ ] 6.1.4 Migrations

- [ ] 6.2 Serializers ← 6.1
  - [ ] 6.2.1 CaseStudySerializer with nested blocks + gallery + tech tags

- [ ] 6.3 Admin API ← 6.2
  - [ ] 6.3.1 CRUD case studies

- [ ] 6.4 Public API ← 6.1
  - [ ] 6.4.1 List: filterable, paginated, published only
  - [ ] 6.4.2 Detail: full narrative + gallery + metadata

- [ ] 6.5 Tests ← 6.3, 6.4
  - [ ] 6.5.1 CRUD operations
  - [ ] 6.5.2 Public projection (no draft)

---

## فاز 7: Workflow & Revisions

- [ ] 7.1 Models ← Phases 3-6
  - [ ] 7.1.1 Revision: GenericFK, snapshot JSONField, revision_number, created_by, created_at
  - [ ] 7.1.2 ScheduledPublish: content GenericFK, scheduled_at, timezone, status, attempts, last_error
  - [ ] 7.1.3 AuditEvent: user, timestamp, action, entity_type, entity_id, reason
  - [ ] 7.1.4 Migrations

- [ ] 7.2 State Machine ← 7.1
  - [ ] 7.2.1 Define ALLOWED_TRANSITIONS (draft→in_review→scheduled→published→archived→draft)
  - [ ] 7.2.2 Permission-checked transitions
  - [ ] 7.2.3 AuditEvent on every transition

- [ ] 7.3 Revision System ← 7.1
  - [ ] 7.3.1 Immutable revision creation on publish (snapshot full content)
  - [ ] 7.3.2 Revision comparison (diff between two revisions)
  - [ ] 7.3.3 Restore revision as new draft (copy snapshot)

- [ ] 7.4 Scheduled Publishing ← 7.1
  - [ ] 7.4.1 Celery beat setup
  - [ ] 7.4.2 `publish_scheduled_content` task (timezone-aware, idempotent)
  - [ ] 7.4.3 Retry with logging (3 attempts, exponential backoff)
  - [ ] 7.4.4 Cancel/reschedule endpoints

- [ ] 7.5 Preview System ← 7.1
  - [ ] 7.5.1 Token generation (15min expiry, locale-specific)
  - [ ] 7.5.2 Token revocation
  - [ ] 7.5.3 Preview endpoint: X-Robots-Tag: noindex, Cache-Control: no-store

- [ ] 7.6 Translation Status ← 7.1
  - [ ] 7.6.1 Computation: Missing | Incomplete | Complete | Outdated
  - [ ] 7.6.2 API endpoint for translation queue

- [ ] 7.7 Admin API ← 7.2-7.6
  - [ ] 7.7.1 Transition endpoint (validate + audit)
  - [ ] 7.7.2 Revisions list + compare + restore
  - [ ] 7.7.3 Schedule/cancel endpoints

- [ ] 7.8 Tests ← 7.7
  - [ ] 7.8.1 Invalid transitions rejected
  - [ ] 7.8.2 Revision immutability
  - [ ] 7.8.3 Schedule execution
  - [ ] 7.8.4 Preview token expiry
  - [ ] 7.8.5 Property-based: workflow state machine (hypothesis)

- [ ] **7.9 CHECKPOINT:** Content lifecycle کامل

---

## فاز 8: Responsive Layout & Navigation

- [ ] 8.1 Layout Container ← 2.1
  - [ ] 8.1.1 ایجاد PublicLayout component: `max-w-screen-xl px-4 sm:px-6 lg:px-8 mx-auto`
  - [ ] 8.1.2 CSS logical properties: `ps-`, `pe-`, `ms-`, `me-` everywhere
  - [ ] 8.1.3 `<main id="main-content" tabindex="-1">` for skip-to-content target
  - [ ] 8.1.4 Mobile-first breakpoints verified

- [ ] 8.2 Header Component ← 2.5, 8.1
  - [ ] 8.2.1 Logo + nav links + LanguageSwitcher + ThemeToggle
  - [ ] 8.2.2 Desktop nav visible at md (768px)+
  - [ ] 8.2.3 Active nav item: border/underline indicator (not color-only)
  - [ ] 8.2.4 Semantic `<header>` + `<nav>`

- [ ] 8.3 MobileNavDrawer ← 8.2
  - [ ] 8.3.1 Sheet-based drawer component (visible below 768px)
  - [ ] 8.3.2 Hamburger menu trigger button (aria-label)
  - [ ] 8.3.3 Focus trap within drawer
  - [ ] 8.3.4 Escape key dismiss
  - [ ] 8.3.5 Scroll lock while open
  - [ ] 8.3.6 Focus return to trigger on close

- [ ] 8.4 SkipToContent ← 8.1
  - [ ] 8.4.1 `sr-only focus:not-sr-only` styling
  - [ ] 8.4.2 First focusable element on page
  - [ ] 8.4.3 Link to `#main-content`

- [ ] 8.5 LanguageSwitcher ← 8.2
  - [ ] 8.5.1 Detect current locale from URL
  - [ ] 8.5.2 Navigate to equivalent page in alternate locale
  - [ ] 8.5.3 No action if no translation exists for current page

- [ ] 8.6 Footer ← 8.1
  - [ ] 8.6.1 Secondary navigation links
  - [ ] 8.6.2 Copyright notice
  - [ ] 8.6.3 Social links (from CMS data)
  - [ ] 8.6.4 `<footer>` semantic element

- [*] 8.7 Navigation Tests
  - [ ] 8.7.1 MobileNavDrawer focus trap + Escape
  - [ ] 8.7.2 LanguageSwitcher routing logic
  - [ ] 8.7.3 Active nav indication

- [ ] **8.8 CHECKPOINT:** Layout و navigation در تمام breakpoints صحیح

---

## فاز 9: Public Pages — SSR

- [ ] 9.1 Locale Routing ← 2.6, 8.1
  - [ ] 9.1.1 `app/[locale]/layout.tsx`: locale shell (html[lang], html[dir], fonts, ThemeProvider)
  - [ ] 9.1.2 `middleware.ts`: locale detection, redirect
  - [ ] 9.1.3 Supported locales: `fa`, `en`

- [ ] 9.2 API Client ← 1.2
  - [ ] 9.2.1 ایجاد `src/lib/api.ts`: base URL, error handling, auth headers
  - [ ] 9.2.2 Fetch wrapper with ISR revalidation tags
  - [ ] 9.2.3 Error normalization (Problem Details → user-friendly)

- [ ] 9.3 BlockRenderer ← 9.1
  - [ ] 9.3.1 Map block_type → React component
  - [ ] 9.3.2 Type-safe dispatch (switch on type)
  - [ ] 9.3.3 Unknown blocks excluded (fail-closed, no crash)
  - [ ] 9.3.4 Block components: HeroBlock, TextBlock, GalleryBlock, CTABlock, CollectionBlock, QuoteBlock, DividerBlock

- [ ] 9.4 Home Page ← 9.3, 3.8
  - [ ] 9.4.1 Hero section: owner name, title, introduction (first viewport)
  - [ ] 9.4.2 CMS sections: research, portfolio, publications, blog, contact CTA
  - [ ] 9.4.3 Section ordering from CMS (enabled only)
  - [ ] 9.4.4 Fallback: owner name + loading message on CMS unavailable
  - [ ] 9.4.5 ISR: revalidate 60s

- [ ] 9.5 Blog Pages ← 9.3, 5.4
  - [ ] 9.5.1 Listing: article cards (title, excerpt, date, reading time, topics)
  - [ ] 9.5.2 Pagination + topic filter + URL-state sync
  - [ ] 9.5.3 Detail: full article + TableOfContents sidebar
  - [ ] 9.5.4 Detail: reading time indicator + related content + prev/next
  - [ ] 9.5.5 ISR: listing 30s, detail static + on-demand revalidation

- [ ] 9.6 Portfolio Pages ← 9.3, 6.4
  - [ ] 9.6.1 Listing: project cards (title, thumbnail, tech tags, description)
  - [ ] 9.6.2 Filter + pagination
  - [ ] 9.6.3 Detail: facts sidebar, gallery, technology tags, outcome narrative
  - [ ] 9.6.4 ISR: revalidate 60s

- [ ] 9.7 Static Content Pages ← 9.3
  - [ ] 9.7.1 About page: profile content from CMS
  - [ ] 9.7.2 Resume page: experience, education, skills, certifications (semantic grouping)
  - [ ] 9.7.3 Research page: research interests and focus areas
  - [ ] 9.7.4 Publications page: citation-style entries (title, authors, venue, date, DOI)

- [ ] 9.8 Contact Page ← 9.1
  - [ ] 9.8.1 Form: name (min 2), email (valid), subject (min 3), message (min 10)
  - [ ] 9.8.2 Client-side validation with inline errors (aria-describedby)
  - [ ] 9.8.3 CSRF token inclusion
  - [ ] 9.8.4 Submit button: disabled + loading state during submission
  - [ ] 9.8.5 Success: confirmation message
  - [ ] 9.8.6 Failure: error message + preserved input + retry
  - [ ] 9.8.7 SSR rendering (CSRF token freshness)

- [ ] 9.9 SEO & Structured Data ← 9.4-9.8
  - [ ] 9.9.1 `generateMetadata()` per route: unique title, description, OG, Twitter Card
  - [ ] 9.9.2 hreflang alternate links (fa/en)
  - [ ] 9.9.3 Canonical URLs via `alternates.canonical`
  - [ ] 9.9.4 `app/sitemap.ts`: dynamic, fetches published URLs from API (both locales)
  - [ ] 9.9.5 `app/robots.ts`: exclude /admin, /api, preview, draft, archived
  - [ ] 9.9.6 JSON-LD: BlogPosting for articles
  - [ ] 9.9.7 JSON-LD: CreativeWork/SoftwareApplication for portfolio

- [ ] 9.10 Empty States ← 9.5-9.7
  - [ ] 9.10.1 EmptyState component: icon + message + suggested action
  - [ ] 9.10.2 Used for empty blog, portfolio, publications lists

- [ ] 9.11 Error Pages ← 9.1
  - [ ] 9.11.1 Custom 404 page (locale-aware, navigation suggestions)
  - [ ] 9.11.2 Custom 500 page

- [*] 9.12 Tests
  - [ ] 9.12.1 BlockRenderer: known/unknown type dispatch
  - [ ] 9.12.2 Contact form validation
  - [ ] 9.12.3 SEO metadata per route
  - [ ] 9.12.4 hreflang presence

- [ ] **9.13 CHECKPOINT:** تمام صفحات عمومی SSR، SEO، bilingual صحیح

---

## فاز 10: Component Library Expansion

- [ ] 10.1 Missing shadcn/ui Components ← 2.1
  - [ ] 10.1.1 Add Alert component (via CLI)
  - [ ] 10.1.2 Add Progress component
  - [ ] 10.1.3 Add Drawer component (for mobile nav)
  - [ ] 10.1.4 Verify all use semantic tokens (no hardcoded colors)
  - [ ] 10.1.5 Verify focus indicators (3:1 contrast)

- [ ] 10.2 Button & Card Refinement ← 2.1
  - [ ] 10.2.1 Verify 6 button variants: default, secondary, outline, ghost, link, destructive
  - [ ] 10.2.2 Card hover state: 200ms ease-out (box-shadow + subtle transform)
  - [ ] 10.2.3 Disabled: reduced opacity + pointer-events: none + aria-disabled

- [ ] 10.3 PageHeader Component ← 2.7
  - [ ] 10.3.1 Consistent H1 + optional subtitle pattern
  - [ ] 10.3.2 Used across all content pages

- [ ] 10.4 Form Component Refinement ← 2.1
  - [ ] 10.4.1 Input/Textarea/Select: consistent error styling
  - [ ] 10.4.2 Error messages via `aria-describedby`
  - [ ] 10.4.3 Disabled state: ARIA attributes
  - [ ] 10.4.4 All inputs: programmatically associated labels

- [ ] 10.5 TableOfContents Component ← 9.5
  - [ ] 10.5.1 Auto-generate from heading blocks
  - [ ] 10.5.2 Sticky sidebar on desktop
  - [ ] 10.5.3 Scroll-aware active heading indicator

---

## فاز 11: Admin CMS Frontend

- [ ] 11.1 Admin Auth ← 1.6
  - [ ] 11.1.1 Client-side auth guard middleware
  - [ ] 11.1.2 Login page with session cookie
  - [ ] 11.1.3 Redirect to dashboard after login

- [ ] 11.2 Dashboard ← 11.1
  - [ ] 11.2.1 Summary stats: total posts, projects, publications, media
  - [ ] 11.2.2 Recent activity feed (from AuditEvent)
  - [ ] 11.2.3 Quick action links (new post, new project, upload media)

- [ ] 11.3 Composer Canvas ← 11.1, 3.7
  - [ ] 11.3.1 Section library panel (draggable sections)
  - [ ] 11.3.2 Block library panel with previews
  - [ ] 11.3.3 @dnd-kit drag-and-drop for blocks
  - [ ] 11.3.4 Keyboard: move-up/move-down with arrow keys
  - [ ] 11.3.5 Block selection → configuration panel

- [ ] 11.4 Block Inspector ← 11.3
  - [ ] 11.4.1 Typed settings editor per block_type
  - [ ] 11.4.2 Live preview update within Canvas
  - [ ] 11.4.3 Content fields (text, image picker, number)
  - [ ] 11.4.4 Validation (inline errors)

- [ ] 11.5 Undo/Redo ← 11.3
  - [ ] 11.5.1 Command stack (push on block add/remove/reorder/config change)
  - [ ] 11.5.2 Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
  - [ ] 11.5.3 Reset stack on save

- [ ] 11.6 Autosave & Conflict ← 11.3
  - [ ] 11.6.1 Autosave: draft only, debounced (2s), status indicator (saving/saved/error)
  - [ ] 11.6.2 Dirty guard: warn before navigation with unsaved changes
  - [ ] 11.6.3 409 conflict dialog: show current version, option to reload or force save

- [ ] 11.7 Preview ← 11.3
  - [ ] 11.7.1 Device viewport simulator (375px, 768px, 1280px)
  - [ ] 11.7.2 Locale toggle (fa/en) in preview
  - [ ] 11.7.3 Editing controls disabled in preview mode

- [ ] 11.8 MediaPicker ← 4.4
  - [ ] 11.8.1 Modal/popover with media grid
  - [ ] 11.8.2 Search by filename
  - [ ] 11.8.3 Filter by MIME type
  - [ ] 11.8.4 Select → return media reference
  - [ ] 11.8.5 Clear/replace selected media
  - [ ] 11.8.6 Inline upload with progress bar

- [ ] 11.9 Media Library Page ← 11.8
  - [ ] 11.9.1 Grid/list toggle view
  - [ ] 11.9.2 Metadata editing (alt, caption)
  - [ ] 11.9.3 Usage information per asset
  - [ ] 11.9.4 Archive with confirmation dialog

- [ ] 11.10 Article Editor ← 11.8, 5.3
  - [ ] 11.10.1 Tiptap block editor setup
  - [ ] 11.10.2 Slash commands (/, /h2, /image, /code, etc.)
  - [ ] 11.10.3 Toolbar: formatting, link, media insert
  - [ ] 11.10.4 Inline MediaPicker for images
  - [ ] 11.10.5 Code block with syntax highlighting
  - [ ] 11.10.6 Per-locale editing (fa/en tabs or side-by-side)

- [ ] 11.11 Portfolio Editor ← 11.8, 6.3
  - [ ] 11.11.1 Narrative block editing
  - [ ] 11.11.2 Gallery management (add/remove/reorder)
  - [ ] 11.11.3 Technology tags (autocomplete)
  - [ ] 11.11.4 Facts sidebar editing

- [ ] 11.12 Workflow UI ← 7.7
  - [ ] 11.12.1 Status badge with transition buttons
  - [ ] 11.12.2 Confirmation dialog for transitions
  - [ ] 11.12.3 Revision timeline + compare view
  - [ ] 11.12.4 Restore from revision (new draft)
  - [ ] 11.12.5 Scheduling interface (date, time, timezone picker)
  - [ ] 11.12.6 Translation status indicators

- [ ] 11.13 Translation Interface ← 11.12
  - [ ] 11.13.1 Translation queue (filterable by status)
  - [ ] 11.13.2 Side-by-side compare (source locale ↔ target locale)

- [ ] 11.14 Settings Page ← 11.1
  - [ ] 11.14.1 Site-wide SEO defaults
  - [ ] 11.14.2 Social links management
  - [ ] 11.14.3 Contact information

- [*] 11.15 Admin Component Tests
  - [ ] 11.15.1 Composer Canvas DnD operations
  - [ ] 11.15.2 MediaPicker search + selection
  - [ ] 11.15.3 Article Editor block management

- [ ] **11.16 CHECKPOINT:** Admin کامل و عملیاتی

---

## فاز 12: Animation Page Builder

- [ ] 12.1 Animation Block Types ← 3.4
  - [ ] 12.1.1 Register new block types in CMS registry:
    - scroll-reveal, parallax, text-stagger, fade-in-sequence
    - hover-card, counter-animation, image-reveal, section-transition
  - [ ] 12.1.2 JSON schema per animation block type
  - [ ] 12.1.3 Block category: entrance, scroll, hover, text, media

- [ ] 12.2 Animation Builder Interface ← 11.3
  - [ ] 12.2.1 Block Library panel: filter by category, animated preview thumbnails
  - [ ] 12.2.2 Canvas: vertical drag-and-drop ordering
  - [ ] 12.2.3 Configuration panel: duration (50-3000ms), delay (0-2000ms), easing (6 options), trigger (scroll/load/hover/click)
  - [ ] 12.2.4 Content fields per block type (text, image, number)
  - [ ] 12.2.5 Character limit: 500 chars for text fields
  - [ ] 12.2.6 Real-time preview update (within 300ms)
  - [ ] 12.2.7 Undo/redo (20+ history)

- [ ] 12.3 Preview Mode ← 12.2
  - [ ] 12.3.1 Responsive viewport: 375px, 768px, 1280px
  - [ ] 12.3.2 Light/dark theme toggle
  - [ ] 12.3.3 RTL/LTR locale toggle
  - [ ] 12.3.4 Editing disabled in preview

- [ ] 12.4 Save & Publish ← 12.2, 7.7
  - [ ] 12.4.1 Save as JSON to Django API
  - [ ] 12.4.2 Validate: minimum 1 block
  - [ ] 12.4.3 Draft/published states
  - [ ] 12.4.4 Revision history
  - [ ] 12.4.5 LocalStorage fallback on network error + retry

- [ ] 12.5 Public Renderer ← 12.4
  - [ ] 12.5.1 GPU-accelerated animations (CSS transforms + opacity)
  - [ ] 12.5.2 Intersection Observer for scroll triggers (configurable threshold)
  - [ ] 12.5.3 RTL/LTR: no animation artifacts
  - [ ] 12.5.4 `prefers-reduced-motion`: immediate final state
  - [ ] 12.5.5 Theme-aware (light/dark)
  - [ ] 12.5.6 LCP < 2.5s, CLS < 0.1

- [ ] 12.6 Responsive Animation ← 12.5
  - [ ] 12.6.1 Scale proportionally below 768px
  - [ ] 12.6.2 Simplify multi-element → single-element below 768px
  - [ ] 12.6.3 Minimum 30fps on 375px+ devices
  - [ ] 12.6.4 Mobile overrides per block (duration, distance)

- [ ] 12.7 Keyboard Accessibility ← 12.2
  - [ ] 12.7.1 Full keyboard navigation for composition
  - [ ] 12.7.2 Visible focus indicators (3:1 contrast)
  - [ ] 12.7.3 ARIA live regions for reorder/config changes
  - [ ] 12.7.4 Delete (Del), Duplicate (Ctrl+D), Undo (Ctrl+Z), Redo (Ctrl+Shift+Z)

---

## فاز 13: Motion, Interaction & Accessibility

- [ ] 13.1 Motion Design ← 9.1, 10.2
  - [ ] 13.1.1 Button hover/focus: 150ms ease-in-out (background, box-shadow)
  - [ ] 13.1.2 Card hover: 200ms ease-out (box-shadow, transform)
  - [ ] 13.1.3 Page transitions: 200ms ease-out (opacity)
  - [ ] 13.1.4 Navigation state: 150ms ease-in-out (color, border)
  - [ ] 13.1.5 Skeleton pulse: 1.5s infinite ease-in-out (opacity)
  - [ ] 13.1.6 Drawer open: 300ms cubic-bezier(0.32,0.72,0,1) (transform)
  - [ ] 13.1.7 Use transform + opacity only (avoid layout thrashing)

- [ ] 13.2 Reduced Motion ← 13.1
  - [ ] 13.2.1 Global `@media (prefers-reduced-motion: reduce)` in globals.css
  - [ ] 13.2.2 `motion-reduce:transition-none` on interactive components
  - [ ] 13.2.3 Verify all non-essential animations disabled

- [ ] 13.3 Accessibility Audit ← 9.1-12.7
  - [ ] 13.3.1 Semantic landmarks: header, nav, main, footer on every page
  - [ ] 13.3.2 Sequential heading hierarchy (H1→H6, no skipping)
  - [ ] 13.3.3 ARIA live regions for route changes
  - [ ] 13.3.4 Visible focus indicators on all interactive elements
  - [ ] 13.3.5 All form inputs: programmatically associated labels
  - [ ] 13.3.6 Images: alt text audit (meaningful vs decorative)
  - [ ] 13.3.7 Full keyboard navigation verification
  - [ ] 13.3.8 Touch targets: ≥44×44px verification
  - [ ] 13.3.9 Color contrast: 4.5:1 normal, 3:1 large text
  - [ ] 13.3.10 Form errors: `aria-describedby` linked

- [*] 13.4 Accessibility Tests
  - [ ] 13.4.1 axe-core audit on all page templates
  - [ ] 13.4.2 Heading hierarchy tests
  - [ ] 13.4.3 Focus indicator visibility tests
  - [ ] 13.4.4 Keyboard navigation: menus, dialogs, forms

---

## فاز 14: Security, Performance & Optimization

- [ ] 14.1 Security Hardening ← Phase 1
  - [ ] 14.1.1 Security headers in Nginx (HSTS, CSP, X-Frame, X-Content-Type)
  - [ ] 14.1.2 Rate limiting verification (login, upload, public API)
  - [ ] 14.1.3 Audit logging completeness check
  - [ ] 14.1.4 Input sanitization verification (fail-closed)
  - [ ] 14.1.5 Preview: X-Robots-Tag: noindex, no-store
  - [ ] 14.1.6 Secrets: .env only, zero in Git

- [ ] 14.2 Image Optimization ← 9.1
  - [ ] 14.2.1 `next/image`: WebP/AVIF, `sizes` attribute
  - [ ] 14.2.2 Hero/above-fold: `priority` prop
  - [ ] 14.2.3 Below-fold: `loading="lazy"`
  - [ ] 14.2.4 Explicit dimensions/aspect-ratio for CLS prevention
  - [ ] 14.2.5 Blurred placeholder generation

- [ ] 14.3 Bundle Optimization ← 9.1, 11.1
  - [ ] 14.3.1 Admin/public bundle separation verification
  - [ ] 14.3.2 Dynamic imports for heavy components (Tiptap, @dnd-kit, charts)
  - [ ] 14.3.3 RSC-first architecture on public pages
  - [ ] 14.3.4 Font optimization: next/font + preconnect

- [ ] 14.4 Database Optimization ← Phases 3-7
  - [ ] 14.4.1 `select_related` + `prefetch_related` audit (no N+1)
  - [ ] 14.4.2 Query count verification on key endpoints
  - [ ] 14.4.3 Index usage verification

- [ ] 14.5 Core Web Vitals ← 14.2, 14.3
  - [ ] 14.5.1 Lighthouse audit: LCP < 2.5s
  - [ ] 14.5.2 Lighthouse audit: CLS < 0.1
  - [ ] 14.5.3 Lighthouse audit: FID < 100ms

- [ ] 14.6 Rich Content Security (RC-003) ← 9.3
  - [ ] 14.6.1 Security test fixtures: script, onerror, SVG, javascript: URLs, data: URLs, iframe/object/embed
  - [ ] 14.6.2 Verify: unsafe nodes/attributes absent from SSR HTML and hydrated DOM
  - [ ] 14.6.3 SSR acceptance: deterministic output, request isolation, no browser-only deps on server
  - [ ] 14.6.4 Hydration: byte/DOM-equivalent SSR ↔ client output, no warnings
  - [ ] 14.6.5 CSP verification: no inline script/style for CMS output

---

## فاز 15: E2E Testing & Deployment

- [ ] 15.1 E2E Tests (Playwright) ← Phases 9-12
  - [ ] 15.1.1 Flow: login → media upload → page compose → preview → publish
  - [ ] 15.1.2 Flow: article create → blocks → publish → public read
  - [ ] 15.1.3 Test: anonymous sees only published content
  - [ ] 15.1.4 Test: locale switching (correct dir, no fallback)
  - [ ] 15.1.5 Test: contact form submit (success + error paths)
  - [ ] 15.1.6 Test: animation page builder lifecycle

- [ ] 15.2 Manual Tests
  - [ ] 15.2.1 RTL/LTR at 375, 768, 1024, 1440px
  - [ ] 15.2.2 Keyboard-only: admin Composer navigation
  - [ ] 15.2.3 Screen reader smoke test (VoiceOver/NVDA)
  - [ ] 15.2.4 No placeholder content visible
  - [ ] 15.2.5 Reduced motion honored
  - [ ] 15.2.6 Dark mode: all pages, no broken contrast

- [ ] 15.3 Deployment ← 15.1
  - [ ] 15.3.1 Production Docker Compose (health checks, resource limits)
  - [ ] 15.3.2 Database seed/migration from existing data
  - [ ] 15.3.3 Backup scripts: pg_dump + media tar
  - [ ] 15.3.4 Restore procedure verification
  - [ ] 15.3.5 README documentation (setup, dev, deploy)
  - [ ] 15.3.6 Health endpoint monitoring (/api/health/)
  - [ ] 15.3.7 Sentry error tracking verification

- [ ] **15.4 FINAL CHECKPOINT:** E2E pass، production deployed، rollback tested ✅

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
| Phase 13: Motion & A11y | 18 | 4 | 15-16 |
| Phase 14: Security & Perf | 19 | 0 | 16-17 |
| Phase 15: E2E & Deploy | 17 | 0 | 17-18 |
| **مجموع** | **~350** | **~17** | **18 هفته** |
