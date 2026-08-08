# Security Rules

1. session-cookie و CSRF مدل احراز هویت Admin است؛ token یا credential مرورگر را استخراج، ذخیره یا log نکنید.
2. همهٔ mutationها permission و CSRF دارند؛ test منفی unauthenticated/unauthorized و stale-version بخشی از برش backend است.
3. Public تنها دادهٔ published، active و locale-owned را می‌بیند. preview خصوصی no-store/noindex است و token آن نباید در log، analytics، referrer یا تاریخچهٔ عمومی بماند.
4. URLها allowlist/parse می‌شوند؛ raw HTML، JavaScript، arbitrary CSS و embed غیرمجاز در CMS ذخیره یا render نمی‌شوند.
5. رسانه‌ها با نام فایل نامطمئن، MIME/signature، اندازه، path containment و عدم افشای storage path کنترل می‌شوند.
6. ریسک امنیتی قابل defer فقط با شناسه، mitigation، owner و trigger بازگشت در ledger ثبت می‌شود؛ این ثبت مجوز publish یا bypass نیست.
