# TahaMohamadi.ir — v2 (Django + Next.js)

Rewrite of TahaMohamadi.ir from Java Spring Boot + Vue/Quasar to Django (DRF) + Next.js/React
with PostgreSQL, deployed via Docker Compose.

This directory is self-contained. The existing Spring Boot backend (`../backend`) and
Vue/Quasar frontend (`../frontend`) are untouched by the rewrite.

## Directory Layout

```
v2/
├── backend/                 Django project (DRF API)
│   ├── apps/                Django apps: core, cms, media, blog, portfolio, workflow
│   ├── config/              Project settings (dev/prod split), urls, wsgi/asgi
│   ├── requirements/        Pinned dependencies (base/dev/prod)
│   ├── tests/               pytest + pytest-django suites
│   └── media/               Local media storage (dev only, gitignored)
├── frontend/                Next.js 15 App Router app (TypeScript, Tailwind, shadcn/ui)
│   ├── src/app/             Routes: [locale] public pages, admin route group
│   ├── src/components/      UI, block renderers, admin composer components
│   ├── src/lib/             API client, i18n, utils
│   ├── public/              Static assets
│   └── tests/               vitest + @testing-library/react
├── infra/
│   ├── nginx/               Reverse proxy config (/api → Django, /* → Next.js)
│   ├── docker/              Dockerfiles for backend/frontend
│   └── postgres/            DB init scripts
└── scripts/                 Dev and deployment helper scripts
```

## Component Responsibilities

| Path | Role |
|------|------|
| `backend/` | REST API, serializers (DTOs), workflow, media handling, migrations |
| `frontend/` | SSR public pages (RSC), client-side admin CMS |
| `infra/nginx/` | Single entry point; routes `/api` and `/admin-api` to Django, everything else to Next.js |
| `infra/docker/` | Container build definitions for the Django and Next.js services |
| `infra/postgres/` | PostgreSQL bootstrap/init assets |
| `scripts/` | Local dev orchestration, seeding, migration helpers |

## Stack

- Python 3.12+, Django 5.x, Django REST Framework
- TypeScript 5.x, Next.js 15.x (App Router), Tailwind CSS, shadcn/ui
- PostgreSQL 16
- Nginx + Docker Compose

## Status

Scaffolding stage. Project initialization happens in the following spec tasks:

- 1.2 — Django project + settings split + DRF
- 1.3 — Next.js project + Tailwind + shadcn/ui
- 1.4 — Docker Compose services
- 1.5 — Nginx reverse proxy routing
- 1.6 — Environment configuration
