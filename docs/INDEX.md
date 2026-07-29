# Documentation Index — TahaMohamadi.ir

**Last Updated:** 2026-07-28  

---

## Core Reference Documents

| Document | Purpose | Audience |
|---|---|---|
| [goals-and-vision.md](goals-and-vision.md) | اهداف، چشم‌انداز، مخاطبان، MVP scope | Product / All |
| [architecture.md](architecture.md) | معماری سیستم، دیاگرام‌ها، تصمیمات | Technical |
| [tech-stack.md](tech-stack.md) | استک تکنولوژی و دلایل انتخاب | Technical |
| [design-system-summary.md](design-system-summary.md) | خلاصه دیزاین سیستم (رنگ، تایپوگرافی، فاصله) | Design / Frontend |
| [roadmap.md](roadmap.md) | نقشه راه فازبندی شده با timeline | PM / All |
| [scalability.md](scalability.md) | استراتژی مقیاس‌پذیری و مسیر رشد | Technical |
| [ci-cd.md](ci-cd.md) | پایپلاین CI/CD و deployment | DevOps |
| [master-plan.md](master-plan.md) | سند جامع Product + Technical (نسخه ۲) | All |

---

## Detailed Documentation

### Product & Planning

| Document | Purpose |
|---|---|
| [tahamohamadi_site_cms_v2_development_plan.md](tahamohamadi_site_cms_v2_development_plan.md) | برنامه توسعه CMS v2 با جزئیات |
| [master-plan.md](master-plan.md) | Research Protocol، ADRs، Risk Register |

### UI/UX Design System

| Document | Purpose |
|---|---|
| [ui-ux/README.md](ui-ux/README.md) | ایندکس UI/UX suite با ownership map |
| [ui-ux/DESIGN.md](ui-ux/DESIGN.md) | طراحی پایه: رنگ، تایپ، فاصله، state |
| [ui-ux/01-experience-principles.md](ui-ux/01-experience-principles.md) | اصول تجربه کاربری |
| [ui-ux/02-information-architecture.md](ui-ux/02-information-architecture.md) | ساختار اطلاعات و navigation |
| [ui-ux/03-user-journeys.md](ui-ux/03-user-journeys.md) | سناریوهای کاربری |
| [ui-ux/04-page-specifications.md](ui-ux/04-page-specifications.md) | مشخصات هر صفحه |
| [ui-ux/05-content-and-localization.md](ui-ux/05-content-and-localization.md) | محتوا و بومی‌سازی |
| [ui-ux/06-responsive-rtl-ltr.md](ui-ux/06-responsive-rtl-ltr.md) | واکنش‌گرایی و RTL/LTR |
| [ui-ux/07-accessibility.md](ui-ux/07-accessibility.md) | دسترس‌پذیری |
| [ui-ux/08-seo-ssr-hydration.md](ui-ux/08-seo-ssr-hydration.md) | SEO و SSR |
| [ui-ux/09-interaction-and-page-states.md](ui-ux/09-interaction-and-page-states.md) | وضعیت‌های صفحه و تعامل |
| [ui-ux/10-visual-qa.md](ui-ux/10-visual-qa.md) | بازبینی بصری |
| [ui-ux/11-implementation-roadmap.md](ui-ux/11-implementation-roadmap.md) | نقشه راه پیاده‌سازی UI |
| [ui-ux/12-agent-handoff-contract.md](ui-ux/12-agent-handoff-contract.md) | قرارداد AI agent |
| [ui-ux/13-decision-register.md](ui-ux/13-decision-register.md) | ثبت تصمیمات |
| [ui-ux/design-system/](ui-ux/design-system/) | دیزاین سیستم (foundations, tokens, etc.) |

---

## Kiro Spec (Implementation Reference)

| File | Purpose |
|---|---|
| `.kiro/specs/react-django-rewrite/requirements.md` | 15 requirement با acceptance criteria |
| `.kiro/specs/react-django-rewrite/design.md` | طراحی فنی با دیاگرام و pseudocode |
| `.kiro/specs/react-django-rewrite/tasks.md` | تسک‌لیست ۱۰ فازی (~95 تسک) |

---

## Document Precedence (Highest → Lowest)

1. **Kiro Spec** (requirements → design → tasks) — implementation truth
2. **docs/architecture.md** — system-level decisions
3. **docs/ui-ux/DESIGN.md** — design rules
4. **Source code** — runtime behavior
5. **Other docs** — supporting context

---

## How to Use

- **Starting development?** Read `roadmap.md` → open `tasks.md` → begin Phase 1
- **Understanding architecture?** Read `architecture.md` + `tech-stack.md`
- **Frontend design questions?** Read `design-system-summary.md` → detailed in `ui-ux/`
- **Deployment?** Read `ci-cd.md` + `docker-compose.yml`
- **Scaling decisions?** Read `scalability.md`
