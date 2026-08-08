# Definition of Done

یک task فقط زمانی «پیاده‌سازی‌شده» است که قراردادهای واقعی بررسی شده، تست متمرکز متناسب اجرا شده و وضعیت باقی‌مانده در task list و ledger ثبت شده باشد. یک release فقط زمانی «آمادهٔ انتشار» است که گیت‌های امنیت، integrity داده، locale، public published-only و QAهای triggerشده بسته شده باشند.

- تغییر کد: RED → GREEN، تست مرتبط، `git diff --check` و stage محدود به فایل‌های task-owned.
- تغییر schema: Django migration افزایشی و test با PostgreSQL.
- تغییر public: SSR، locale `fa/en`، empty/error، canonical/hreflang و عدم placeholder بررسی می‌شود.
- تغییر Admin: session/CSRF/RBAC، validation، 409، loading/empty/error و keyboard flow بررسی می‌شود.
- تغییر مستندات: مسیرها و فناوری واقعی‌اند؛ هر مورد معوق در ledger شناسه و trigger دارد.

نتیجهٔ test/build تنها همان verification را اثبات می‌کند و جای QA مرورگر، امنیت production یا بازبینی انسانیِ محتوا را نمی‌گیرد.
