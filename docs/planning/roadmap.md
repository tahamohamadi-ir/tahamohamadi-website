# Development Roadmap — TahaMohamadi.ir

**Version:** 2.0  
**Last Updated:** 2026-07-28  
**Total Phases:** 10 + Post-MVP  
**Estimated Timeline:** 12-16 weeks for MVP  

---

## Overview

```
Phase 1  ─── Project Setup & Infrastructure
Phase 2  ─── CMS Core (Composer System)
Phase 3  ─── Media Library               ← Can parallel with Phase 2
Phase 4  ─── Blog Module
Phase 5  ─── Portfolio Module             ← Can parallel with Phase 4
Phase 6  ─── Workflow & Revisions
Phase 7  ─── Frontend Public Pages (SSR)
Phase 8  ─── Frontend Admin CMS
Phase 9  ─── Security, Performance, A11y
Phase 10 ─── E2E Testing & Deployment
─────────────────────────────────────────
Post-MVP ─── Enhancements & Scaling
```

---

## Phase 1: Project Setup & Infrastructure (Week 1-2)

**Goal:** Working monorepo with Django, Next.js, Docker Compose, and testing infrastructure.

| Task | Description | Dependencies |
|---|---|---|
| 1.1 | Directory structure (backend/, frontend/, infra/, docs/) | None |
| 1.2 | Django project + DRF + settings (dev/prod) | 1.1 |
| 1.3 | Next.js + App Router + TypeScript + Tailwind + shadcn/ui | 1.1 |
| 1.4 | Docker Compose (nginx, django, nextjs, postgres) | 1.1 |
| 1.5 | Nginx reverse proxy config | 1.4 |
| 1.6 | .env.example + environment config | 1.4 |
| 1.7 | Base models (TimestampedModel, VersionedModel) | 1.2 |
| 1.8 | Session auth + CSRF + CORS | 1.2 |
| 1.9 | pytest + pytest-django setup | 1.2 |
| 1.10 | vitest + testing-library setup | 1.3 |
| 1.11 | Linting (ruff + eslint + prettier) | 1.2, 1.3 |
| 1.12 | GitHub Actions CI (lint + test + build) | 1.9, 1.10 |

**Exit Criteria:** `docker compose up` boots all services; tests run green; CI passes.

---

## Phase 2: CMS Core — Composer (Week 2-4)

**Goal:** Typed relational page composition system with full CRUD.

| Task | Description | Dependencies |
|---|---|---|
| 2.1 | Page, Section, Block models + migrations | Phase 1 |
| 2.2 | Block type registry + JSON schema validation | 2.1 |
| 2.3 | DRF serializers (nested write support) | 2.1 |
| 2.4 | Composition validation service | 2.2 |
| 2.5 | Optimistic locking service | 2.1 |
| 2.6 | Admin API (CRUD pages/sections/blocks) | 2.3, 2.4, 2.5 |
| 2.7 | Public API (published pages only) | 2.1 |
| 2.8 | Unit tests (validation, locking, projection) | 2.4, 2.5, 2.7 |
| 2.9 | Integration tests (API endpoints) | 2.6, 2.7 |

**Exit Criteria:** Can create, validate, and publicly serve composed pages via API.

---

## Phase 3: Media Library (Week 3-4, parallel with Phase 2)

**Goal:** Complete media management with upload, metadata, and usage tracking.

| Task | Description | Dependencies |
|---|---|---|
| 3.1 | MediaAsset model + migrations | Phase 1 |
| 3.2 | Upload service (MIME/size/hash validation) | 3.1 |
| 3.3 | Image dimension extraction (Pillow) | 3.2 |
| 3.4 | Per-locale alt text and caption fields | 3.1 |
| 3.5 | Media usage tracking service | 3.1, Phase 2 |
| 3.6 | Archive with usage impact check | 3.5 |
| 3.7 | Admin API (upload, list, detail, metadata, archive) | 3.2-3.6 |
| 3.8 | Orphan detection report endpoint | 3.5 |
| 3.9 | Tests (upload, archive, orphan) | 3.7, 3.8 |

**Exit Criteria:** Can upload, search, archive media; usage tracked across modules.

---

## Phase 4: Blog Module (Week 4-6)

**Goal:** Block-based article system with full lifecycle support.

| Task | Description | Dependencies |
|---|---|---|
| 4.1 | Article, ArticleBlock, Topic models | Phase 1 |
| 4.2 | Article serializers (locale-specific blocks) | 4.1 |
| 4.3 | Content sanitization service | 4.1 |
| 4.4 | Reading time calculation | 4.1 |
| 4.5 | Markdown import with warnings | 4.1 |
| 4.6 | Admin API (CRUD articles + topics) | 4.2, 4.3 |
| 4.7 | Public API (list, detail, related, TOC) | 4.1 |
| 4.8 | TOC generation from heading blocks | 4.1 |
| 4.9 | Tests (sanitization, reading time, public filter) | 4.6, 4.7 |

**Exit Criteria:** Articles creatable, sanitized, publicly served with TOC and related content.

---

## Phase 5: Portfolio Module (Week 5-6, parallel with Phase 4)

**Goal:** Case study system with narrative blocks and gallery.

| Task | Description | Dependencies |
|---|---|---|
| 5.1 | CaseStudy model + migrations | Phase 1 |
| 5.2 | Serializers (narrative blocks + gallery + tech tags) | 5.1 |
| 5.3 | Admin API (CRUD case studies) | 5.2 |
| 5.4 | Public API (list + detail) | 5.1 |
| 5.5 | Tests (CRUD, public projection) | 5.3, 5.4 |

**Exit Criteria:** Portfolio items with rich narratives, galleries, and technology metadata.

---

## Phase 6: Workflow & Revisions (Week 6-7)

**Goal:** Content lifecycle management with state machine, scheduling, and revisions.

| Task | Description | Dependencies |
|---|---|---|
| 6.1 | Revision, ScheduledPublish, AuditEvent models | Phases 2-5 |
| 6.2 | State machine with transitions + permissions | 6.1 |
| 6.3 | Audit event on every transition | 6.2 |
| 6.4 | Immutable revision creation + restore as draft | 6.1 |
| 6.5 | Scheduled publishing (Celery beat) | 6.1 |
| 6.6 | Preview token generation (15min, locale-specific) | 6.1 |
| 6.7 | Translation status computation | 6.1 |
| 6.8 | Admin API (transitions, revisions, scheduling) | 6.2-6.7 |
| 6.9 | Tests (invalid transitions, scheduling, preview expiry) | 6.8 |

**Exit Criteria:** Content flows through Draft→Published with auditing, scheduling, and versioning.

---

## Phase 7: Frontend Public Pages (Week 7-10)

**Goal:** SSR-rendered public website with full SEO and bilingual support.

| Task | Description | Dependencies |
|---|---|---|
| 7.1 | [locale] routing + i18n middleware | Phase 1 |
| 7.2 | PublicLayout (RTL/LTR, fonts, SEO shell) | 7.1 |
| 7.3 | BlockRenderer (typed dispatch) | 7.2 |
| 7.4 | Home page (composed sections from API) | 7.3, Phase 2 |
| 7.5 | Blog listing (pagination, filters, URL state) | 7.3, Phase 4 |
| 7.6 | Blog detail (TOC, structured data, nav) | 7.5 |
| 7.7 | Portfolio listing (filter, pagination) | 7.3, Phase 5 |
| 7.8 | Portfolio detail (facts, gallery, SEO) | 7.7 |
| 7.9 | About, Resume, Research, Publications pages | 7.3 |
| 7.10 | Language switcher (locale-aware) | 7.2 |
| 7.11 | Contact page (form + validation) | 7.2 |
| 7.12 | sitemap.xml + robots.txt generation | 7.4-7.9 |
| 7.13 | Component tests (blocks, locale, SEO) | 7.3-7.12 |

**Exit Criteria:** All public pages SSR-rendered with correct SEO, RTL/LTR, and bilingual support.

---

## Phase 8: Frontend Admin CMS (Week 9-12)

**Goal:** Complete admin panel with visual Composer, editors, and media management.

| Task | Description | Dependencies |
|---|---|---|
| 8.1 | Admin auth guard + session management | Phase 1 |
| 8.2 | Admin dashboard (stats, recent activity) | 8.1 |
| 8.3 | Composer Canvas (sections, blocks, DnD, keyboard) | 8.1, Phase 2 |
| 8.4 | Block Inspector (typed settings editors) | 8.3 |
| 8.5 | Undo/redo command stack | 8.3 |
| 8.6 | Autosave (draft only, debounced) | 8.3 |
| 8.7 | Dirty guard + 409 conflict dialog | 8.3 |
| 8.8 | Device/locale preview | 8.3 |
| 8.9 | MediaPicker (upload, search, select) | Phase 3 |
| 8.10 | Media Library page (grid/list, metadata, usage) | 8.9 |
| 8.11 | Article Editor (Tiptap, slash commands, media) | 8.9, Phase 4 |
| 8.12 | Portfolio Editor (narrative blocks, gallery) | 8.9, Phase 5 |
| 8.13 | Workflow UI (transitions, revisions, scheduling) | Phase 6 |
| 8.14 | Translation queue + side-by-side compare | 8.13 |
| 8.15 | Component tests (Canvas, MediaPicker, Editor) | 8.3-8.14 |

**Exit Criteria:** Admin can compose pages, write articles, manage media, and publish content.

---

## Phase 9: Security, Performance, A11y (Week 12-13)

**Goal:** Production-grade security, performance, and accessibility compliance.

| Task | Description | Dependencies |
|---|---|---|
| 9.1 | Security headers (HSTS, CSP, X-Frame, etc.) | Phases 7-8 |
| 9.2 | Rate limiting (login, upload, public API) | Phase 1 |
| 9.3 | Audit logging verification | Phase 6 |
| 9.4 | Next.js Image optimization (WebP/AVIF) | Phase 7 |
| 9.5 | Code splitting verification (admin/public split) | Phases 7-8 |
| 9.6 | Cache strategy (CDN public, no-cache admin) | Phases 7-8 |
| 9.7 | Accessibility audit (headings, keyboard, contrast, targets) | Phases 7-8 |
| 9.8 | Reduced-motion compliance | Phases 7-8 |
| 9.9 | Lighthouse performance audit (Core Web Vitals) | Phases 7-8 |

**Exit Criteria:** Security hardened, CWV targets met, WCAG 2.2 AA compliance verified.

---

## Phase 10: E2E Testing & Deployment (Week 13-14)

**Goal:** Comprehensive E2E coverage and production-ready deployment.

| Task | Description | Dependencies |
|---|---|---|
| 10.1 | E2E: login → compose → preview → publish | Phases 7-8 |
| 10.2 | E2E: article lifecycle (create → publish → read) | Phases 7-8 |
| 10.3 | E2E: anonymous sees only published content | Phase 7 |
| 10.4 | E2E: locale switching (correct dir, no fallback) | Phase 7 |
| 10.5 | Manual: RTL/LTR at 375, 768, 1024, 1440px | Phase 7 |
| 10.6 | Manual: keyboard-only admin navigation | Phase 8 |
| 10.7 | Manual: screen reader smoke test | Phases 7-8 |
| 10.8 | Production Docker Compose (health checks, limits) | Phase 1 |
| 10.9 | Database seed/migration from existing data | All |
| 10.10 | README documentation (setup, dev, deploy) | All |
| 10.11 | Production deployment + verification | 10.8-10.10 |

**Exit Criteria:** All E2E pass, production deployed, rollback tested.

---

## Post-MVP Roadmap

### Near-term (1-2 months after MVP)

| Feature | Priority | Effort |
|---|---|---|
| Dark mode theme | High | Medium |
| Full-text search improvements | Medium | Low |
| Analytics dashboard (basic) | Medium | Medium |
| RSS feed for blog | Low | Low |
| PDF resume export | Low | Low |

### Medium-term (3-6 months)

| Feature | Priority | Effort |
|---|---|---|
| Redis for session/cache | Medium | Low |
| S3/Object storage for media | Medium | Medium |
| Advanced SEO (llms.txt, AI visibility) | High | Medium |
| Comment system (blog) | Low | High |
| Newsletter integration | Low | Medium |

### Long-term (6-12 months)

| Feature | Priority | Effort |
|---|---|---|
| CDN integration | Medium | Medium |
| Multi-language expansion | Low | High |
| Public user accounts | Low | High |
| Telegram bot publishing | Low | High |
| Knowledge graph visualization | Low | High |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Scope creep | High | Strict MVP boundary, backlog for extras |
| Single developer bottleneck | Medium | AI-assisted development, good docs |
| Database migration issues | Medium | Careful mapping, test with real data |
| Performance on VPS | Low | CDN for static, optimize queries |
| Security gaps | High | OWASP checklist, automated scanning |
