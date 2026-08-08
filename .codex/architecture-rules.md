# Architecture Rules

1. ساختار modular monolith Django حفظ شود: appهای domain-owned، serializer/view/service روشن و وابستگی یک‌طرفه به `core`.
2. schema فقط با Django migration افزایشی تغییر می‌کند؛ migration موجود بازنویسی نمی‌شود.
3. API عمومی DTO/serializer محدود و published-only ارائه می‌کند؛ UUID، وضعیت داخلی، storage key و دادهٔ خصوصی را افشا نکنید.
4. Next App Router مالک routeهای عمومی SSR است. componentهای Admin فقط زیر `src/app/admin` و `src/components/admin` قرار می‌گیرند و نباید به bundle عمومی نشت کنند.
5. renderer فقط blockهای allowlisted را می‌پذیرد؛ unknown block/settings/media باید fail closed باشد.
6. هر mutation Admin version، authorization، validation، audit و پاسخ conflict قابل نمایش دارد.
7. dependency جدید، تغییر قرارداد عمومی یا تغییر مدل محتوا پیش از اجرا به ADR یا تکمیل task list نیاز دارد.
