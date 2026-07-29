# Technology Stack — TahaMohamadi.ir

**Version:** 2.0  
**Last Updated:** 2026-07-28  

---

## 1. Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Django + DRF | 5.x |
| Backend Language | Python | 3.12+ |
| Frontend Framework | Next.js (App Router) | 15.x |
| Frontend Language | TypeScript | 5.x |
| UI Components | shadcn/ui (Radix UI) | Latest |
| CSS Framework | Tailwind CSS | 4.x |
| Database | PostgreSQL | 16 |
| Task Queue | Celery + celery-beat | Latest |
| Message Broker | Redis (for Celery only) | 7.x |
| Reverse Proxy | Nginx | 1.27 |
| Containerization | Docker + Docker Compose | Latest |
| WSGI Server | Gunicorn | Latest |
| Testing (Backend) | pytest + pytest-django + hypothesis | Latest |
| Testing (Frontend) | vitest + @testing-library/react + fast-check | Latest |
| E2E Testing | Playwright | Latest |
| CI/CD | GitHub Actions | N/A |
| Image Registry | GitHub Container Registry (GHCR) | N/A |

---

## 2. Backend Stack Details

### 2.1 Django + DRF

- **Why:** Mature, secure by default, batteries-included ORM, excellent REST support
- **Pattern:** Service layer between views and models
- **Serializers:** Used as DTOs for all request/response
- **Auth:** Django's built-in session framework + CSRF middleware
- **Migrations:** Django's migration system (replaces Flyway)

### 2.2 Key Backend Libraries

| Library | Purpose |
|---|---|
| `djangorestframework` | REST API framework |
| `django-cors-headers` | CORS handling |
| `django-filter` | API filtering |
| `Pillow` | Image processing (dimensions, optimization) |
| `celery` | Async tasks + scheduled publishing |
| `redis` | Celery broker (not used for caching in MVP) |
| `pytest` | Test framework |
| `pytest-django` | Django test integration |
| `hypothesis` | Property-based testing |
| `gunicorn` | Production WSGI server |
| `whitenoise` | Static file serving (optional) |

### 2.3 Django Apps

```
backend/
├── config/           # Settings, URLs, WSGI
├── core/             # Base models, exceptions, middleware
├── cms/              # Page, Section, Block, Composer
├── media/            # MediaAsset, upload, usage tracking
├── blog/             # Article, ArticleBlock, Topic
├── portfolio/        # CaseStudy, narrative blocks
├── workflow/         # State machine, Revision, Scheduling
└── authentication/   # Session, permissions, audit
```

---

## 3. Frontend Stack Details

### 3.1 Next.js App Router

- **Why:** RSC for SSR performance, excellent SEO, streaming, great DX
- **Rendering:** Server Components for public, Client Components for admin
- **Routing:** File-based with `[locale]` dynamic segment
- **Middleware:** i18n detection, auth guards

### 3.2 Key Frontend Libraries

| Library | Purpose |
|---|---|
| `next` | Framework (App Router + RSC) |
| `react` / `react-dom` | UI library |
| `tailwindcss` | Utility-first CSS |
| `@radix-ui/*` | Accessible UI primitives (via shadcn) |
| `@dnd-kit/*` | Drag-and-drop (admin composer) |
| `tiptap` | Block-based article editor |
| `zod` | Schema validation |
| `react-hook-form` | Form management |
| `next-themes` | Theme switching (future) |
| `lucide-react` | Icon library (candidate) |
| `date-fns` | Date formatting |
| `vitest` | Unit/component testing |
| `@testing-library/react` | Component test utilities |
| `fast-check` | Property-based testing |
| `playwright` | E2E testing |

### 3.3 Frontend Structure

```
frontend/
├── app/
│   ├── [locale]/        # Public SSR pages
│   ├── admin/           # Admin CSR pages
│   ├── api/             # BFF routes (optional)
│   ├── sitemap.xml/
│   └── robots.txt/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── blocks/          # Block renderers (hero, text, gallery...)
│   ├── admin/           # Admin-specific components
│   └── shared/          # Shared utilities (MediaPicker, etc.)
├── lib/
│   ├── api/             # API client functions
│   ├── utils/           # Helper functions
│   └── constants/       # Static values
├── styles/
│   └── globals.css      # Tailwind + CSS variables
├── types/               # TypeScript type definitions
└── hooks/               # Custom React hooks
```

---

## 4. Database Design

### 4.1 PostgreSQL 16

- **Why:** Mature, reliable, excellent JSON support, built-in FTS, good indexing
- **Schema:** Relational with JSONField for block settings
- **Search:** PostgreSQL Full-Text Search (MVP)
- **Future:** Can add pg_trgm, GIN indexes, or external search later

### 4.2 Key Design Patterns

- UUID primary keys (all models)
- Optimistic locking (version field)
- Locale columns on same model (title_fa, title_en)
- Audit fields (created_at, updated_at, created_by, updated_by)
- Soft-delete where needed (archive status)
- Immutable revisions (snapshot on publish)

---

## 5. Infrastructure

### 5.1 Docker Compose (Development + Production)

- 4 services: nginx, django, nextjs, postgres
- Persistent volumes: postgres_data, media_data
- Environment-variable driven configuration
- Health check endpoints

### 5.2 CI/CD

- GitHub Actions for build/test/image push
- Pull-based deployment to VPS
- Immutable image tags (SHA-based)
- Backup before every deployment
- Automatic rollback on failure

---

## 6. Fonts

| Locale | Font | Delivery | License |
|---|---|---|---|
| Persian (fa) | Vazirmatn Variable | Self-hosted (npm package, bundled WOFF2) | SIL OFL 1.1 |
| English (en) | Inter | Google Fonts or self-hosted | SIL OFL 1.1 |
| Monospace | JetBrains Mono | Google Fonts or self-hosted | SIL OFL 1.1 |

---

## 7. Decision Rationale Matrix

| Decision | Chosen | Alternatives Considered | Why Chosen |
|---|---|---|---|
| Backend | Django | Spring Boot, FastAPI, Express | Python ecosystem, security, ORM maturity |
| Frontend | Next.js | Nuxt, Remix, Astro | RSC, SSR quality, React ecosystem |
| DB | PostgreSQL | MongoDB, MySQL | Relational integrity, JSON support, FTS |
| CSS | Tailwind | CSS Modules, Styled-components | Utility-first, design token friendly |
| Components | shadcn/ui | MUI, Chakra, Mantine | Accessible, customizable, copy-paste model |
| Auth | Sessions | JWT, OAuth-only | Simplicity for admin panel, CSRF built-in |
| Deploy | Docker Compose | Kubernetes, Serverless | Simplicity for single VPS |
| Editor | Tiptap | Lexical, Slate, ProseMirror | Best DX, extensible, React-friendly |
| DnD | @dnd-kit | react-beautiful-dnd, react-dnd | Modern, accessible, well-maintained |
| Search | PostgreSQL FTS | Elasticsearch, Meilisearch | No extra infra, sufficient for scale |

---

## 8. Version Pinning Strategy

- **Python packages:** Pinned to exact versions in `requirements.txt`
- **Node packages:** Pinned via `package-lock.json`
- **Docker images:** Tagged to specific versions (postgres:16-alpine, nginx:1.27-alpine)
- **System dependencies:** Specified in Dockerfiles

---

## 9. Development Environment

| Tool | Purpose |
|---|---|
| Python 3.12 (venv) | Backend development |
| Node.js 20+ (pnpm) | Frontend development |
| Docker Desktop | Container management |
| PostgreSQL 16 | Local DB (via Docker or native) |
| VS Code / Kiro | IDE |
| Git + GitHub | Version control |
