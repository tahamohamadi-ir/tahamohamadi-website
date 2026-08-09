# ADR 014: Design Tokens and Component Variants

**تاریخ:** 2026-08-09
**وضعیت:** تأیید شده

## 1. زمینه و هدف (Context)
با گسترش کامپوننت‌های وبسایت و به ویژه معرفی Blockهای متنوع در Composer، نیاز به یکپارچگی ظاهری (Visual Consistency) و جلوگیری از پراکندگی کلاس‌های استایل احساس می‌شود. استفاده مستقیم از مقادیر Hardcoded در Tailwind به مرور باعث بروز ناسازگاری در فاصله‌ها، رنگ‌ها و تایپوگرافی می‌شود. همچنین در Composer نیازمند سازوکاری هستیم که به ادمین اجازه دهد بدون کدنویسی، از بین Variantهای از پیش طراحی شده (مثلاً یک بلاکِ متنِ تاریک یا روشن) انتخاب کند.

## 2. تصمیم (Decision)
ما از یک معماری دو لایه برای استایل‌دهی استفاده می‌کنیم:

### 2.1 لایه Design Tokens (Primitive & Semantic)
توکن‌های پایه (رنگ‌ها، فاصله‌ها، تایپوگرافی) را در فایل `tailwind.config.ts` و از طریق متغیرهای CSS تعریف می‌کنیم.
این توکن‌ها جایگزین utility classهای دلخواه می‌شوند. به عنوان مثال، به جای استفاده از `text-[#1a202c]` از `text-brand-primary` استفاده خواهد شد.
این کار از طریق متغیرهای CSS در `index.css` مدیریت می‌شود تا در آینده امکان پیاده‌سازی Dark Mode بدون تغییر کدهای React فراهم باشد.

### 2.2 لایه Component Variants (Visual Selector)
برای Blockهای موجود در Composer (مثل `TextBlock`, `HeroBlock`, `GalleryBlock`)، ما مفهومی به نام `variant` را به مدل داده‌های بلاک اضافه می‌کنیم. 
هر بلاک می‌تواند لیستی از Variantهای مجاز داشته باشد (مثلاً `default`, `inverted`, `highlight`). 
انتخاب این Variant از طریق یک **Visual Variant Selector** در `BlockInspector.tsx` انجام می‌شود. 

## 3. پیامدها (Consequences)
- **مثبت:** 
  - یکپارچگی ظاهری بسیار بالا.
  - توسعه و طراحی مجدد بسیار سریعتر (با تغییر توکن در یک نقطه).
  - آزادی عمل ایمن به ویرایشگران محتوا از طریق Variantهای از پیش‌تأییدشده.
- **منفی:** 
  - نیاز به تعریف توکن برای هر رنگ و فاصله جدید.
  - کمی افزایش حجم کدهای پیکربندی.

## 4. رویکرد فنی (Implementation Plan)
1. به‌روزرسانی `tailwind.config.ts` برای اتصال به متغیرهای CSS.
2. تعریف متغیرهای پایه (Colors, Spacing, Typography) در فایل `index.css`.
3. اضافه کردن قابلیت انتخاب `variant` در ساختار Blockها (`frontend/src/components/admin/composer/BlockInspector.tsx`).
4. اضافه کردن یک UI جذاب و Visual برای انتخاب این Variantها در Inspector.
