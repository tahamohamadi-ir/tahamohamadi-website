# Frontend Rules

1. TypeScript strict و typeهای واقعی API را استفاده کنید؛ شکل response یا مسیر API را اختراع نکنید.
2. Public routeها locale-aware SSR هستند و failure شبکه/5xx را به missing content تبدیل نمی‌کنند؛ فقط 404ِ قراردادی می‌تواند `null` شود.
3. `fa` و `en` مستقل‌اند: `lang`/`dir` در layout، لینک locale-safe و نبود ترجمه به‌صورت صریح نمایش داده می‌شود.
4. محتوای CMS، تصاویر، metric و CTA را hardcode نکنید. در نبود داده، section را suppress کنید یا state صریح نشان دهید.
5. Admin باید loading/empty/error/conflict، keyboard flow، focus و پاسخ 409 را در سطح کاربر مدیریت کند؛ visibility رابط جای authorization نیست.
6. URL و rich content باید با helper امن/allowlist پردازش شوند. `dangerouslySetInnerHTML` فقط با مسیر sanitize‌شده و قرارداد مشخص مجاز است.
