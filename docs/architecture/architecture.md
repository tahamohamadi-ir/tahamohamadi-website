# System Architecture — TahaMohamadi.ir

**Version:** 2.0  
**Last Updated:** 2026-07-28  
**Status:** Approved for implementation  

---

## 1. Overview

TahaMohamadi.ir is a bilingual (Persian/English) personal website with:
- Public-facing SSR pages (portfolio, blog, publications, research, resume)
- Admin CMS panel (page composer, article editor, media library, workflow)
- Custom lightweight CMS with typed relational page composition

Architecture style: **Modular Monolith** deployed via Docker Compose.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
├──────────────────────────┬──────────────────────────────────┤
│   Public Pages (SSR)     │     Admin Panel (CSR)            │
│   React Server Comps     │     Client Components            │
└──────────────────────────┴──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                        │
│   /api/* → Django    |    /* → Next.js                       │
└─────────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────────┐         ┌──────────────────────────┐
│   Django + DRF       │         │     Next.js App Router    │
│   (Gunicorn)         │         │     (Standalone)          │
│                      │         │                           │
│  ┌──────────────┐    │         │  ┌─────────────────────┐  │
│  │ core         │    │         │  │ [locale] routing    │  │
│  │ cms          │    │         │  │ RSC + Client Comps  │  │
│  │ media        │    │         │  │ Middleware (i18n)   │  │
│  │ blog         │    │         │  │ shadcn/ui + TW      │  │
│  │ portfolio    │    │         │  └─────────────────────┘  │
│  │ workflow     │    │         └──────────────────────────┘
│  │ auth         │    │
│  └──────────────┘    │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│   PostgreSQL 16      │
│   (Single DB)        │
└──────────────────────┘
```

---

## 3. Backend Architecture (Django)

### 3.1 Module Structure

| Django App | Responsibility |
|---|---|
| `core` | Base models, UUID PKs, audit fields, exception handling, Problem Details |
| `cms` | Page, Section, Block models; Composer system; block type registry |
| `media` | MediaAsset, upload, hash naming, usage tracking, orphan detection |
| `blog` | Article, ArticleBlock, Topic; reading time; sanitization |
| `portfolio` | CaseStudy with narrative blocks, gallery, technologies |
| `workflow` | State machine, Revision, ScheduledPublish, AuditEvent, preview tokens |
| `auth` | Session auth, CSRF, role-based permissions, rate limiting |

### 3.2 API Layer

- **Public APIs:** `/api/public/` — Read-only, cacheable, no auth required
- **Admin APIs:** `/api/admin/` — Session + CSRF, role-checked, audit-logged
- **Response format:** DRF Serializers as DTOs
- **Error format:** RFC 7807 Problem Details JSON

### 3.3 Service Layer Pattern

```
View (DRF ViewSet)
    ↓ calls
Service (business logic)
    ↓ uses
Model / Repository (data access)
```

### 3.4 Base Models

```python
class TimestampedModel(Model):
    id = UUIDField(primary_key=True, default=uuid4)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    created_by = ForeignKey(User, null=True)
    updated_by = ForeignKey(User, null=True)

class VersionedModel(TimestampedModel):
    version = IntegerField(default=1)  # Optimistic locking
```

---

## 4. Frontend Architecture (Next.js)

### 4.1 Routing Strategy

```
app/
├── [locale]/              # /fa and /en
│   ├── page.tsx           # Home
│   ├── about/
│   ├── blog/
│   │   └── [slug]/
│   ├── portfolio/
│   │   └── [slug]/
│   ├── publications/
│   ├── research/
│   ├── resume/
│   └── contact/
├── admin/                 # CSR-only, auth-gated
│   ├── dashboard/
│   ├── pages/
│   ├── articles/
│   ├── portfolio/
│   ├── media/
│   └── settings/
├── sitemap.xml/
└── robots.txt/
```

### 4.2 Rendering Strategy

| Route Type | Rendering | Cache |
|---|---|---|
| Public pages | RSC (Server Components) | CDN-cacheable |
| Admin panel | Client-side only | No-cache |
| API routes (BFF) | Server | No-cache |
| Media assets | Static | Immutable (content-hash) |

### 4.3 Design System

- **Component library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS with CSS variables
- **Theme:** Light-first, dark mode deferred
- **Icons:** TBD (unresolved decision)
- **Fonts:** Vazirmatn (Persian), Inter (English)

---

## 5. Database Design Principles

- PostgreSQL as sole data store (no Redis, no Elasticsearch in MVP)
- UUID primary keys everywhere
- Locale-specific columns (title_fa, title_en) on same model
- JSONField for block settings with schema validation
- Indexes on: slug, status, ordering, locale, published_at
- Unique constraints: slug per locale
- Full-text search via PostgreSQL built-in (MVP)

---

## 6. Deployment Architecture

### 6.1 Docker Compose Services

| Service | Image | Port | Role |
|---|---|---|---|
| nginx | nginx:1.27-alpine | 80 (public) | Reverse proxy, static media |
| django | Custom (Gunicorn) | 8000 (internal) | API server |
| nextjs | Custom (Standalone) | 3000 (internal) | SSR + CSR |
| postgres | postgres:16-alpine | 5432 (internal) | Database |

### 6.2 Volume Mounts

- `postgres_data` — Database persistence
- `media_data` — Uploaded files

### 6.3 CI/CD Pipeline

Pull-based deployment (see docs/ci-cd.md):
1. GitHub Actions → build + test → push images to GHCR
2. Manual approval → create immutable production tag
3. VPS systemd timer polls tags → backup → deploy → validate → rollback on failure

---

## 7. Security Architecture

| Layer | Mechanism |
|---|---|
| Authentication | Django sessions (not JWT) |
| Authorization | Role-based (admin, editor, reviewer) |
| CSRF | Enforced on all state-mutating admin requests |
| Input Sanitization | Fail-closed — reject HTML/script/unsafe URLs |
| File Security | Content-hash naming, no internal path exposure |
| Headers | HSTS, CSP, X-Frame-Options: DENY, X-Content-Type-Options |
| Rate Limiting | Login, upload, public API endpoints |
| Audit | All admin mutations logged (user, timestamp, action, entity) |
| Secrets | Environment variables only, .env.example template |
| Preview | Short-lived tokens (15min), X-Robots-Tag: noindex |

---

## 8. Key Design Decisions

| ID | Decision | Rationale |
|---|---|---|
| ADR-001 | Modular Monolith | Small team, simple deployment, sufficient for scale |
| ADR-002 | Django + DRF | Python ecosystem, security built-in, rapid development |
| ADR-003 | Next.js App Router | RSC for SSR, great DX, SEO-first |
| ADR-004 | Session auth (not JWT) | Simpler for admin panel, CSRF protection built-in |
| ADR-005 | Typed relational Composer | Predictable schema, validatable, queryable |
| ADR-006 | PostgreSQL-only search | Sufficient for MVP, avoids infra complexity |
| ADR-007 | Docker Compose (not K8s) | Single VPS, minimal ops burden |
| ADR-008 | No Redis in MVP | Low traffic, Django cache framework sufficient |
| ADR-009 | Celery for scheduling | Proven, timezone-aware, retry with logging |
| ADR-010 | shadcn/ui + Tailwind | Accessible primitives, utility-first, customizable |

---

## 9. Data Flow Diagrams

### 9.1 Public Page Request

```
Browser → Nginx → Next.js RSC → Django Public API → PostgreSQL
                                                        ↓
Browser ← Nginx ← Next.js (Full HTML + hydration) ← JSON DTO
```

### 9.2 Admin Content Save

```
Admin Browser → Next.js Client → Django Admin API (session + CSRF)
                                       ↓
                              Validate + Optimistic Lock Check
                                       ↓
                              PostgreSQL (version increment)
                                       ↓
                              Audit Event → Response (200 or 409)
```

### 9.3 Media Upload

```
Admin → Django Admin API → Validate (MIME, size, extension)
                                ↓
                        Hash content → Store file
                                ↓
                        Create MediaAsset record
                                ↓
                        Extract dimensions (images)
                                ↓
                        Return media URL + metadata
```

---

## 10. Scalability Path

See `docs/scalability.md` for full strategy. Summary:

1. **Current:** Single VPS with Docker Compose
2. **Near-term:** CDN for public pages, Redis for sessions/cache
3. **Medium-term:** Separate media to S3/object storage
4. **Long-term:** Horizontal scaling if needed (multiple Django workers, DB read replicas)
