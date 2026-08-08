# Backend Rules

1. از Django ORM، DRF serializer و permissionهای واقعی استفاده کنید؛ endpoint یا payload حدسی نسازید.
2. برای تغییر رفتار ابتدا pytest متمرکز بنویسید و RED آن را مشاهده کنید.
3. serializer عمومی فقط فیلدهای لازم و published/active/locale-complete را عرضه می‌کند. `phone`، reference خصوصی، storage key و مسیر فیزیکی هرگز public نیست.
4. برای mutationها session/CSRF، RBAC، validation، optimistic version و audit لازم‌اند. پاسخ 409 را حذف یا به success تبدیل نکنید.
5. upload باید نام فایل را نامطمئن بداند، MIME و signature را کنترل کند و مسیر storage را از ورودی خام نسازد.
6. تست‌های backend در صورت نبود dependency محلی با `docker compose -f docker-compose.dev.yml --profile test run --rm backend-test` اجرا می‌شوند. محدودیت محیط یا Docker در ledger ثبت می‌شود.
