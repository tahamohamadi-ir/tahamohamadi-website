# Documentation Index — TahaMohamadi.ir

**Last Updated:** 2026-07-29

---

## Core Reference Documents

| Document | Purpose | Audience |
|---|---|---|
| [planning/development-master-plan.md](planning/development-master-plan.md) | برنامهٔ جامع توسعه، معماری محتوا، UI/UX و تسک‌لیست فنی مرجع | Product / Technical / Design |
| [planning/goals-and-vision.md](planning/goals-and-vision.md) | اهداف، چشم‌انداز، مخاطبان، MVP scope | Product / All |
| [architecture/architecture.md](architecture/architecture.md) | معماری سیستم، دیاگرام‌ها، تصمیمات | Technical |
| [architecture/tech-stack.md](architecture/tech-stack.md) | استک تکنولوژی و دلایل انتخاب | Technical |
| [architecture/design-system-summary.md](architecture/design-system-summary.md) | خلاصه دیزاین سیستم (رنگ، تایپوگرافی، فاصله) | Design / Frontend |
| [planning/roadmap.md](planning/roadmap.md) | نقشه راه فازبندی شده با timeline | PM / All |
| [planning/reference-project-transfer-backlog.md](planning/reference-project-transfer-backlog.md) | Backlog قابلیت‌های قابل‌انتقال از پروژهٔ مرجع Spring/Vue | Product / Technical |
| [planning/development-plan-2026.md](planning/development-plan-2026.md) | پیش‌نویس پیشین؛ محتوای فعال در برنامهٔ جامع ادغام شده است | Historical / Supporting |
| [planning/development-task-list-2026.md](planning/development-task-list-2026.md) | پیش‌نویس پیشین taskها؛ مرجع اجرا برنامهٔ جامع است | Historical / Supporting |
| [architecture/scalability.md](architecture/scalability.md) | استراتژی مقیاس‌پذیری و مسیر رشد | Technical |
| [architecture/ci-cd.md](architecture/ci-cd.md) | پایپلاین CI/CD و deployment | DevOps |
| [planning/plan.md](planning/plan.md) | برنامهٔ اجرایی و مهاجرت به Django/Next.js | All |

---

## Detailed Documentation

### Product & Planning

| Document | Purpose |
|---|---|
| [planning/plan.md](planning/plan.md) | برنامهٔ اجرایی Django/Next.js و قراردادهای کیفیت |
| [planning/task.md](planning/task.md) | فهرست taskهای اجرایی |
| [archive/](archive/) | اسناد تاریخی، از جمله طرح Spring/Vue/Quasar؛ مرجع اجرا نیستند |

### UI/UX Design System

The active React/Next.js design-system reference is [architecture/design-system-summary.md](architecture/design-system-summary.md), with executable values in `frontend/src/app/globals.css`. The former Vue/Quasar suite is preserved under [archive/ui-ux-vue-quasar/](archive/ui-ux-vue-quasar/) for historical context only.

---

## Kiro Spec (Implementation Reference)

| File | Purpose |
|---|---|
| [`react-django-rewrite/requirements.md`](../.kiro/specs/react-django-rewrite/requirements.md) | 15 requirement با acceptance criteria |
| [`react-django-rewrite/design.md`](../.kiro/specs/react-django-rewrite/design.md) | طراحی فنی با دیاگرام و pseudocode |
| [`react-django-rewrite/tasks.md`](../.kiro/specs/react-django-rewrite/tasks.md) | تسک‌لیست ۱۰ فازی (~95 تسک) |

---

## Document Precedence (Highest → Lowest)

1. **Kiro Spec** (requirements → design → tasks) — implementation truth
2. **docs/architecture/** and **docs/planning/** — approved system and product decisions
3. **Source code and tests** — current runtime behavior
4. **Other current docs** — supporting context
5. **docs/archive/** — historical context only; never implementation authority

---

## How to Use

- **Starting development?** Read `planning/development-master-plan.md` → the applicable Kiro spec → the current release tasks.
- **Understanding architecture?** Read `architecture/architecture.md` + `architecture/tech-stack.md`.
- **Frontend design questions?** Read `architecture/design-system-summary.md` and inspect `frontend/src/app/globals.css`.
- **Deployment?** Read `architecture/ci-cd.md` + `docker-compose.yml`.
- **Scaling decisions?** Read `architecture/scalability.md`.
