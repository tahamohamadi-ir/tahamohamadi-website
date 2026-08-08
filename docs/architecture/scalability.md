# Scalability Strategy — TahaMohamadi.ir

**Version:** 1.0  
**Last Updated:** 2026-07-28  

---

## 1. Current Architecture (MVP)

Single VPS deployment with Docker Compose:

```
[CDN/Cloudflare] → [Nginx] → [Next.js | Django | PostgreSQL]
```

**Capacity:** Handles ~1000-5000 daily visitors comfortably on a 4GB VPS.

---

## 2. Scalability Layers

### Layer 1: Application Scalability

| Area | Current | Future Option |
|---|---|---|
| Django workers | Single Gunicorn (4 workers) | Scale workers, add instances |
| Next.js | Single standalone instance | Multiple instances behind LB |
| Static assets | Nginx serves locally | CDN (Cloudflare/CloudFront) |
| Media files | Local volume | S3/R2 object storage |
| Background jobs | Celery (single worker) | Multiple workers, priority queues |

### Layer 2: Database Scalability

| Area | Current | Future Option |
|---|---|---|
| Connection pooling | Django default | PgBouncer |
| Read performance | Single instance | Read replicas |
| Full-text search | PostgreSQL FTS | Add pg_trgm, GIN indexes |
| Advanced search | PostgreSQL FTS | Meilisearch (if needed) |
| Caching | None in MVP | Redis + Django cache framework |

### Layer 3: Infrastructure Scalability

| Area | Current | Future Option |
|---|---|---|
| Deployment | Single VPS | Multiple VPS + LB |
| Container orchestration | Docker Compose | Docker Swarm or K8s |
| CDN | Cloudflare free tier | Enterprise CDN |
| Monitoring | Health endpoints | Prometheus + Grafana |
| Log aggregation | Docker logs | ELK or Loki |

---

## 3. Scaling Decisions & Triggers

### When to add Redis

**Trigger:** Response times > 500ms on frequently accessed pages, or session management needs improvement.

**What it solves:**
- Session storage (offload from DB)
- Page-level caching for public API responses
- Celery broker (already planned)
- Rate limiting state

### When to add Object Storage (S3/R2)

**Trigger:** Media volume > 10GB, or need for CDN-served media, or backup complexity increases.

**What it solves:**
- Media served from CDN edge
- No volume mount dependency
- Easier backup/restore
- Better concurrent upload handling

### When to add CDN

**Trigger:** International audience growth, or Lighthouse performance scores dropping.

**What it solves:**
- Static asset delivery from edge
- SSR page caching
- DDoS protection
- SSL termination offload

### When to add Read Replicas

**Trigger:** Database CPU consistently > 70%, or read queries causing write latency.

**What it solves:**
- Public API reads from replica
- Admin writes to primary
- Better query performance

### When to add Search Engine

**Trigger:** > 500 articles, or users complain about search quality, or need faceted search.

**What it solves:**
- Fuzzy matching
- Faceted filtering
- Relevance ranking
- Multi-language analysis

---

## 4. Code-Level Scalability Patterns

### 4.1 Service Layer Abstraction

All business logic lives in service functions, not views. This allows:
- Easy unit testing
- Swappable implementations
- Background task delegation

```python
# Easy to move from sync to async, or add caching
class PageService:
    def get_published_page(self, slug, locale):
        # Can add cache.get() here later
        return Page.objects.filter(slug=slug, locale=locale, status='published')
```

### 4.2 Storage Abstraction

Media upload uses Django's storage backend abstraction:
```python
# Switch from local to S3 by changing settings only
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
# Later: 'storages.backends.s3boto3.S3Boto3Storage'
```

### 4.3 Cache-Friendly API Design

Public APIs designed for HTTP caching:
- Deterministic URLs (no session-dependent content)
- Proper ETag/Last-Modified headers
- Cache-Control headers per route type
- Immutable media URLs (content-hash naming)

### 4.4 Database Query Optimization

Built-in patterns for query efficiency:
- `select_related()` / `prefetch_related()` for N+1 prevention
- Database indexes on all filtered/sorted fields
- Pagination on all list endpoints
- Avoid full table scans

### 4.5 Frontend Code Splitting

- Public and admin are separate route groups
- Per-route lazy loading
- Shared code in common chunks
- No admin JavaScript shipped to public pages

---

## 5. Performance Budget

| Metric | Target | Measurement |
|---|---|---|
| LCP (public pages) | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| TTFB | < 600ms | Server response |
| JS bundle (public) | < 150KB gzipped | Build analysis |
| API response (list) | < 200ms | Server timing |
| API response (detail) | < 100ms | Server timing |
| Image delivery | WebP/AVIF, responsive | next/image |
| Font loading | < 100ms (self-hosted) | Network waterfall |

---

## 6. Monitoring & Observability (Post-MVP)

| Tool | Purpose | When to Add |
|---|---|---|
| Django Debug Toolbar | Dev performance profiling | Immediately (dev only) |
| django-silk | Request profiling | When optimizing queries |
| Sentry | Error tracking | Pre-production |
| Prometheus + Grafana | Metrics & dashboards | When scaling |
| pg_stat_statements | Query performance analysis | When DB is bottleneck |
| Lighthouse CI | Automated performance regression | CI pipeline |

---

## 7. Data Growth Projections

| Content Type | Year 1 | Year 3 | Year 5 |
|---|---|---|---|
| Pages (CMS) | 10-20 | 30-50 | 50-100 |
| Blog articles | 20-50 | 100-200 | 300-500 |
| Portfolio items | 10-20 | 30-50 | 50-100 |
| Media assets | 100-500 | 1000-3000 | 5000-10000 |
| Revisions | 200-1000 | 3000-10000 | 10000+ |

**PostgreSQL handles this comfortably** at all projected stages. Search engine consideration only if articles exceed ~500 with complex filtering needs.

---

## 8. Migration Path Summary

```
MVP (Now)          → Redis + S3 (Month 3-6)  → CDN + Monitoring (Month 6-12)
─────────────────────────────────────────────────────────────────────────────
Single VPS           Add Redis for cache       Cloudflare for edge caching
Docker Compose       S3/R2 for media           Prometheus + Grafana
Local storage        PgBouncer                 Read replicas (if needed)
PostgreSQL FTS       Sentry for errors         Meilisearch (if needed)
```

Each step is **additive** — no architectural rewrite needed. The modular monolith supports incremental scaling.
