# TahaMohamadi.ir

Bilingual (Persian / English) personal website featuring a portfolio, blog, publications, and research showcase — powered by a custom lightweight CMS with a page composer, workflow engine, and media library.

## Tech Stack

| Layer | Technology |
| ------- | ----------- |
| Backend | Django 5.x, Django REST Framework, Celery, Gunicorn |
| Frontend | Next.js 15 (App Router), TypeScript 5.x, Tailwind CSS, shadcn/ui |
| Database | PostgreSQL 16 |
| Proxy | Nginx 1.27 |
| Orchestration | Docker Compose |
| CI/CD | GitHub Actions |
| Fonts | Vazirmatn (Persian), Inter (English) |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+
- [Node.js 20+](https://nodejs.org/) (for local frontend dev without Docker)
- [Python 3.12+](https://www.python.org/) (for local backend dev without Docker)
- Git

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/tahamohamadi-ir/tahamohamadi-website.git
cd tahamohamadi-website

# 2. Create environment file
cp .env.example .env
# Edit .env as needed (defaults work for local dev)

# 3. Start all services
docker compose up --build -d

# 4. Run database migrations
docker compose exec django python manage.py migrate

# 5. Create a superuser (for admin panel access)
docker compose exec django python manage.py createsuperuser

# 6. (Optional) Seed sample data
docker compose exec django python manage.py seed_data
```

### Access URLs (Development)

| Service | URL |
| --------- | ----- |
| Website (via Nginx) | <http://localhost> |
| Public API | <http://localhost/api/public/> |
| Admin API | <http://localhost/api/admin/> |
| Next.js direct | <http://localhost:3000> |
| Django direct | <http://localhost:8000> |

## Development Workflow

### Backend Development

```bash
# Enter the backend container
docker compose exec django bash

# Or run locally (requires Python 3.12+ and PostgreSQL)
cd backend
pip install -r requirements/dev.txt
python manage.py runserver

# Run tests
docker compose exec django pytest
# Or locally:
cd backend && pytest

# Run a specific test file
docker compose exec django pytest apps/cms/tests/test_blocks.py -v

# Check code style
docker compose exec django ruff check .
docker compose exec django ruff format --check .
```

### Frontend Development

```bash
# Run Next.js dev server (hot reload)
cd frontend
npm install
npm run dev

# Run tests
npm run test          # vitest in watch mode
npm run test -- --run # single run

# Lint and format
npm run lint
npm run format
```

### End-to-End Tests (Playwright)

```bash
cd e2e
npm install
npx playwright install

# Run against local Docker stack
npx playwright test

# Run with UI
npx playwright test --ui
```

### Useful Docker Commands

```bash
# View logs
docker compose logs -f django
docker compose logs -f nextjs

# Restart a single service
docker compose restart django

# Rebuild after dependency changes
docker compose up --build django

# Stop everything
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Production Deployment

### Using docker-compose.prod.yml

The production compose file includes HTTPS via Let's Encrypt, Redis for Celery, network isolation, resource limits, and automatic restarts.

```bash
# 1. Set production environment variables in .env
#    - ENVIRONMENT=prod
#    - DJANGO_SETTINGS_MODULE=config.settings.prod
#    - DJANGO_DEBUG=False
#    - DJANGO_SECRET_KEY=<generate a real secret>
#    - DJANGO_ALLOWED_HOSTS=tahamohamadi.ir,www.tahamohamadi.ir
#    - CORS_ALLOWED_ORIGINS=https://tahamohamadi.ir
#    - CSRF_TRUSTED_ORIGINS=https://tahamohamadi.ir
#    - Strong POSTGRES_PASSWORD

# 2. Obtain SSL certificates (first time)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d tahamohamadi.ir -d www.tahamohamadi.ir

# 3. Start all services
docker compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker compose -f docker-compose.prod.yml exec django python manage.py migrate

# 5. Collect static files
docker compose -f docker-compose.prod.yml exec django python manage.py collectstatic --noinput
```

### SSL Certificate Renewal

Set up a cron job for automatic renewal:

```bash
# Add to crontab (runs twice daily)
0 0,12 * * * cd /path/to/project && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Backup and Restore

Automated backup and restore scripts are provided in `scripts/`:

```bash
# Create a backup (database + media)
./scripts/backup.sh

# Custom backup directory and retention
./scripts/backup.sh -d /mnt/backups -k 14

# Restore from a backup
./scripts/restore.sh backups/backup_20250101_120000.tar.gz

# Restore only the database
./scripts/restore.sh --db-only backups/backup_20250101_120000.tar.gz

# Restore only media files
./scripts/restore.sh --media-only backups/backup_20250101_120000.tar.gz
```

**Automated daily backups via cron:**

```bash
# Add to crontab — daily backup at 2 AM, keep last 7
0 2 * * * cd /path/to/project && ./scripts/backup.sh -k 7 >> /var/log/tahamohamadi-backup.log 2>&1
```

Backups include:

- PostgreSQL database dump (`pg_dump` custom format with compression)
- Media files tarball (all uploaded assets)
- Metadata JSON with timestamp and source info

By default, only the last 7 backups are retained (configurable with `-k`).

### Production Environment Variables

Key variables that must be configured for production (see `.env.example` for full list):

| Variable | Description |
| ---------- | ------------- |
| `DJANGO_SECRET_KEY` | Cryptographic secret (generate with Django util) |
| `DJANGO_ALLOWED_HOSTS` | Your domain(s), comma-separated |
| `POSTGRES_PASSWORD` | Strong database password |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) with https:// |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF |
| `CELERY_BROKER_URL` | Redis URL for async tasks |

## Project Structure

```text
tahamohamadi-website/
├── backend/                 Django project (REST API)
│   ├── apps/                Django apps
│   │   ├── core/            Base models, UUID PKs, exception handler
│   │   ├── cms/             Page Composer (Page, Section, Block)
│   │   ├── media/           Media library, upload, usage tracking
│   │   ├── blog/            Articles, topics, reading time
│   │   ├── portfolio/       Case studies, gallery, technologies
│   │   └── workflow/        State machine, revisions, scheduling
│   ├── config/              Settings (dev/prod), URLs, WSGI/ASGI
│   └── requirements/        Pinned dependencies (base/dev/prod)
├── frontend/                Next.js 15 App Router
│   ├── src/app/             Routes ([locale] public + admin)
│   ├── src/components/      UI components, block renderers
│   └── src/lib/             API client, i18n, utilities
├── e2e/                     Playwright E2E tests
├── infra/
│   ├── nginx/               Reverse proxy configuration
│   ├── docker/              Dockerfiles (backend + frontend)
│   └── postgres/            Database init scripts
├── scripts/                 Helper scripts (backup, restore, seed)
├── docs/                    Project documentation
├── docker-compose.yml       Development orchestration
├── docker-compose.prod.yml  Production orchestration
└── .env.example             Environment variable template
```

## Architecture

- **Modular Monolith** — Django apps with clear boundaries, single PostgreSQL database
- **Nginx reverse proxy** — `/api/*` routes to Django, `/*` routes to Next.js
- **SSR public pages** — React Server Components for SEO and performance
- **CSR admin panel** — Client-side rendering with session auth
- **Bilingual** — `/fa/` and `/en/` routing with RTL/LTR switching

See [docs/architecture/architecture.md](docs/architecture/architecture.md) for the full system architecture.

## Documentation

| Document | Description |
| ---------- | ------------- |
| [Documentation index](docs/INDEX.md) | Canonical documentation map and precedence |
| [Architecture](docs/architecture/architecture.md) | System architecture, data flows, design decisions |
| [Goals & Vision](docs/planning/goals-and-vision.md) | Project goals, constraints, success criteria |
| [Tech Stack](docs/architecture/tech-stack.md) | Technology choices and rationale |
| [Design System](docs/architecture/design-system-summary.md) | Design system quick reference |
| [Roadmap](docs/planning/roadmap.md) | Development roadmap with timeline |
| [Scalability](docs/architecture/scalability.md) | Scalability strategy and migration path |
| [CI/CD](docs/architecture/ci-cd.md) | CI/CD pipeline documentation |
| [Conventions](docs/architecture/conventions.md) | Code and project conventions |

## License

Private repository. All rights reserved.
