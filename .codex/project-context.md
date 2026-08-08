# Project Context — TahaMohamadi.ir

## پشتهٔ واقعی

- Backend: Python 3.12، Django 5، Django REST Framework و Celery.
- Frontend: Next.js 15 App Router، React 19 و TypeScript.
- Persistence: PostgreSQL 16 و Django migrations افزایشی.
- Runtime: Docker Compose و Nginx؛ public با SSR و Admin با CSR/session کار می‌کند.

## منابع تصمیم‌گیری

1. `docs/planning/development-master-plan.md` — نقشهٔ اجرای جاری و وضعیت R0/R1.
2. `docs/012-cms-v2-wordpress-capability-task-list.md` — قابلیت‌های CMS استخراج‌شده و backlog releaseها.
3. `docs/status/deferred-validation.md` — گیت‌ها، ریسک‌ها و QAهای عقب‌افتاده.
4. `docs/governance/fast-track-delivery.md` — سیاست سرعت، defer و مالکیت تغییرها.

`docs/master-plan.md` سند تاریخی است و برای انتخاب فناوری یا endpoint جدید منبع اجرایی نیست.

## مرزهای محصول

- دادهٔ فارسی و انگلیسی مستقل‌اند؛ fallback پنهان یا overwrite بین localeها ممنوع است.
- Public فقط projection منتشرشده و locale-complete را می‌خواند. نبود داده باید suppress/empty-state روشن باشد، نه placeholder یا محتوای ساختگی.
- Page/Article/CaseStudy به blockهای typed و schema-validated متکی هستند؛ HTML/JS/CSS آزاد یا JSON مدلِ بی‌قید وارد CMS نمی‌شود.
- محتوای سایت، CTA، navigation و media از CMS/API می‌آید؛ در component هاردکد نمی‌شود.
