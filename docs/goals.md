# اهداف پروژه — TahaMohamadi.ir

> **نسخه:** 1.0  
> **آخرین بروزرسانی:** 2025-07

---

## 1. چشم‌انداز (Vision)

ساخت یک منبع رسمی، قابل اعتماد، قابل جستجو و هوشمند برای معرفی طه محمدی — به شکلی که استاد دانشگاه، کارفرما، همکار فنی، مخاطب عمومی و موتورهای هوش مصنوعی بتوانند اطلاعات را سریع، دقیق و ساختارمند دریافت کنند.

> این سایت باید یک رزومه زنده، یک وبلاگ حرفه‌ای و یک پورتفولیوی تعاملی باشد — نه یک CMS عمومی، نه یک فروشگاه، نه یک شبکه اجتماعی.

---

## 2. مخاطبان هدف (Target Audiences)

| ID | مخاطب | نیاز اصلی | صفحات کلیدی |
|----|--------|-----------|-------------|
| AUD-001 | PhD Supervisor | بررسی Research Fit، Publications، CV | `/en/research`, `/en/publications`, `/en/resume` |
| AUD-002 | University Committee | بررسی سوابق علمی و مسیر پژوهشی | `/en/about`, `/en/publications` |
| AUD-003 | Recruiter / Employer | ارزیابی مهارت، تجربه، پروژه‌ها | `/en/resume`, `/en/portfolio` |
| AUD-004 | Technical Peer | مشاهده پروژه‌ها، بلاگ فنی، GitHub | `/blog`, `/portfolio` |
| AUD-005 | Blog Reader | مطالعه، جستجو، فیلتر محتوا | `/blog` |
| AUD-006 | Public Visitor | شناخت سریع و راه تماس | `/`, `/about`, `/contact` |
| AUD-007 | Admin / Site Owner | مدیریت محتوا، SEO، فایل، آمار | `/admin` |

---

## 3. ارزش‌های اصلی (Core Values)

| # | ارزش | توضیح |
|---|------|-------|
| 1 | **اعتبار حرفه‌ای** | سایت باید professional و قابل اتکا به نظر برسد — نه personal blog ساده |
| 2 | **Bilingual Parity** | فارسی و انگلیسی هر دو first-class هستند — بدون fallback cross-locale |
| 3 | **CMS قابل توسعه** | Composer system type-safe و relational — برای افراد دیگر هم قابل استفاده |
| 4 | **LLM-Friendly** | ساختار پروژه طوری طراحی شود که AI Agents بتوانند taskها را اجرا کنند |
| 5 | **Performance First** | Core Web Vitals عالی — SSR برای public، lightweight برای admin |
| 6 | **Security by Default** | امنیت از ابتدا — نه اضافه شده در آخر |
| 7 | **Simplicity over Cleverness** | ساده‌ترین راه‌حل صحیح — پرهیز از overengineering |

---

## 4. معیارهای موفقیت (Success Metrics)

### Core Web Vitals

| Metric | Target | ابزار سنجش |
|--------|--------|------------|
| LCP | < 2.5s | Lighthouse, CrUX |
| CLS | < 0.1 | Lighthouse |
| INP | < 200ms | Chrome UX Report |
| TTFB | < 200ms | WebPageTest |

### Accessibility

| Metric | Target |
|--------|--------|
| WCAG Level | AA (2.2) |
| Lighthouse Accessibility | ≥ 95 |
| Keyboard Navigation | 100% interactive elements |
| Color Contrast | ≥ 4.5:1 body text |

### SEO

| Metric | Target |
|--------|--------|
| Lighthouse SEO | ≥ 95 |
| Structured Data | JSON-LD on all pages |
| Sitemap | Auto-generated, multi-locale |
| Open Graph | Complete on all public pages |

### Content Management Efficiency

| Metric | Target |
|--------|--------|
| Page creation time | < 5 min (basic page) |
| Media upload | < 3 clicks |
| Content publish | < 2 clicks (draft → published) |
| Editor load time | < 2s |

---

## 5. غیر‌اهداف (Non-Goals)

این پروژه عمداً شامل موارد زیر **نیست**:

| # | غیر‌هدف | دلیل |
|---|---------|------|
| 1 | User Registration عمومی | use case قوی ندارد — admin-only |
| 2 | E-commerce / فروشگاه | scope پروژه personal website است |
| 3 | Real-time Chat / Messaging | نیازی نیست |
| 4 | Multi-tenant SaaS | فقط یک instance — اما قابل clone شدن |
| 5 | Kubernetes / Microservices | overkill برای single-VPS deployment |
| 6 | Mobile App | responsive web کافی است |
| 7 | Dark Mode (M1) | Light-first design — dark mode in M2 |
| 8 | AI/LLM Integration در سایت | خارج از MVP (مثل Ask AI, Knowledge Graph) |
| 9 | Redis / Elasticsearch | PostgreSQL FTS برای MVP کافی |
| 10 | Telegram Bot | ریسک امنیتی — بعد از MVP |

---

## 6. تعریف MVP Scope

### Must Have (MVP)

- [x] Language Selection (fa/en)
- [ ] Landing Page (Composer-based)
- [ ] About / Profile Page
- [ ] Resume / CV Page
- [ ] Research Interests
- [ ] Publications List
- [ ] Blog (list + detail + categories)
- [ ] Portfolio (list + detail)
- [ ] Contact Page + Form
- [ ] Admin Login (session-based)
- [ ] Admin CRUD: Pages, Posts, Media, Portfolio
- [ ] Media Library (upload, list, delete)
- [ ] Basic SEO (meta tags, sitemap, robots.txt)
- [ ] Docker Compose Deployment
- [ ] Backup/Restore Script
- [ ] Audit Log پایه

### Should Have (M1+)

- [ ] Full-text Search (PostgreSQL)
- [ ] RSS Feed for Blog
- [ ] Workflow states (Draft → Review → Published)
- [ ] Content Versioning / Revisions
- [ ] Open Graph Image Generation
- [ ] Analytics (privacy-respecting)
- [ ] Print Stylesheets (Resume, Publications)

### Nice to Have (M2)

- [ ] Dark Mode
- [ ] PWA Capabilities
- [ ] Keyboard Shortcuts (Admin)
- [ ] Advanced Composer (drag-and-drop)
- [ ] Import/Export Tools
- [ ] Webhook Support

---

## 7. Post-MVP Features

| Phase | Feature | ارزش |
|-------|---------|------|
| M1+ | Content Search (PostgreSQL FTS) | بهبود UX برای blog readers |
| M1+ | Workflow Transitions + Email Notification | مدیریت محتوا حرفه‌ای‌تر |
| M1+ | Analytics Dashboard (privacy-first) | فهمیدن رفتار مخاطب |
| M2 | Dark Mode | تجربه کاربری شب |
| M2 | PWA + Offline | دسترسی آفلاین |
| M2 | Advanced Admin (shortcuts, batch ops) | سرعت مدیریت محتوا |
| M2 | Content Diff Viewer | مقایسه revisionها |
| M3 | AI Ask (LLM Query) | جستجوی هوشمند |
| M3 | Knowledge Graph Visualization | ارتباطات محتوایی |
| M3 | Multi-tenant Mode | استفاده توسط دیگران |
