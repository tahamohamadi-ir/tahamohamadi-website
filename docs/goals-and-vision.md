# Goals & Vision — TahaMohamadi.ir

**Version:** 2.0  
**Last Updated:** 2026-07-28  

---

## 1. Vision Statement

> ایجاد یک خانه دیجیتال دو‌زبانه برای نمایش پژوهش، پروژه‌های مهندسی، طراحی محصول، نوشته‌ها و مسیر حرفه‌ای؛ با تجربه‌ای معتبر، متمایز، سریع و قابل مدیریت از طریق CMS بصری.

---

## 2. Mission

ساخت وب‌سایت شخصی حرفه‌ای که:
- اعتبار پژوهشی و مهندسی را منتقل کند
- تجربه کاربری عالی در هر دو زبان فراهم کند
- محتوا را بدون دانش فنی قابل مدیریت کند
- از نظر SEO و AI Visibility بهینه باشد
- قابل توسعه و نگهداری آسان باشد

---

## 3. Target Audiences

| ID | Audience | Primary Need | Key Pages |
|---|---|---|---|
| AUD-001 | PhD Supervisor | Research Fit, Publications | `/en/research`, `/en/publications` |
| AUD-002 | University Committee | Academic track record | `/en/about`, `/en/publications` |
| AUD-003 | Recruiter / Employer | Skills, experience, projects | `/en/resume`, `/en/portfolio` |
| AUD-004 | Technical Peer | Projects, technical blog | `/blog`, `/portfolio` |
| AUD-005 | Blog Reader | Read, search, filter content | `/blog` |
| AUD-006 | Public Visitor | Quick intro + contact | `/`, `/about`, `/contact` |
| AUD-007 | Admin / Owner | Content management | `/admin` |

---

## 4. Value Proposition

| ID | Value |
|---|---|
| VAL-001 | رزومه زنده، قابل آپدیت و دو زبانه |
| VAL-002 | نمایش حرفه‌ای برای PhD، کارفرما و جامعه فنی |
| VAL-003 | CMS سبک و اختصاصی بدون پیچیدگی WordPress |
| VAL-004 | ساختار LLM-friendly برای توسعه با AI Agents |
| VAL-005 | قابلیت توسعه آینده بدون Overengineering |
| VAL-006 | SEO و AI Visibility از ابتدای طراحی |
| VAL-007 | Admin Panel ساده و قابل استفاده |

---

## 5. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| First Impression | CTA و تخصص در اولین viewport | Manual review |
| Content Creation | ایجاد صفحه بدون Markdown خام | Task completion test |
| Bilingual Quality | وضعیت ترجمه قابل فیلتر | Translation status API |
| Performance | LCP < 2.5s, CLS < 0.1, FID < 100ms | Lighthouse |
| Accessibility | WCAG 2.2 AA | Automated + manual audit |
| SEO | Structured data for all content types | Rendered HTML validation |
| Security | No secrets in client/repo/logs | Security audit |
| Admin Efficiency | عملیات اصلی با حداکثر 3 کلیک | UX test |

---

## 6. Design Principles

1. **Evidence before promotion** — Present real work, not invented claims
2. **Reading before decoration** — Typography and hierarchy over ornament
3. **Equal locales** — Persian and English are first-class experiences
4. **One clear task at a time** — Single primary action per context
5. **Stable, accessible behavior** — Keyboard, screen reader, responsive
6. **Proven repetition earns reuse** — Don't abstract prematurely

---

## 7. Design Direction

**Modern Clean + Academic Editorial**

- Light, restrained, content-first
- Typography-driven hierarchy
- Deliberate whitespace
- Professional without being corporate
- Credible for academic and technical audiences

### Explicitly Rejected

- Generic AI-generated appearance
- Glassmorphism, decorative gradients, glow effects
- Excessive cards, arbitrary shadows
- Oversized empty hero areas
- Decorative-only motion
- Progress bars for skills without verifiable data
- Stock images unrelated to actual work

---

## 8. MVP Scope

### Must Have

- Language selection (fa/en)
- Home page with real content sections
- About / Profile
- Resume (structured)
- Research interests
- Publications
- Blog (basic CRUD + public listing)
- Portfolio (basic CRUD + public listing)
- Contact page
- Admin login + CRUD for all content types
- Media library with upload
- Basic SEO (meta, sitemap, robots.txt)
- Docker Compose deployment
- Audit logging

### Out of MVP

- Telegram Bot publishing
- Public user registration
- Advanced analytics
- Redis / Elasticsearch
- Kubernetes
- Real-time collaborative editing
- Plugin marketplace
- Mobile app
- Automated translation

---

## 9. Product Constraints

| Constraint | Rule |
|---|---|
| Database | PostgreSQL only (no document store) |
| Architecture | Modular monolith (no microservices) |
| Deployment | Docker Compose on VPS |
| Auth | Session-based with CSRF (no JWT) |
| Locales | Persian and English only (no cross-locale fallback) |
| CMS model | Typed relational Composer (not JSONB blobs) |
| Content | Never show draft/archived to public |
| Public rendering | SSR required (no CSR-only for content) |
