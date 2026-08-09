# Implementation Plan: Portfolio Filters & Case Study Composition

این سند برنامه‌ی پیاده‌سازی دو اولویت اصلی از تحلیل شکاف است: **فیلترهای پورتفولیو (Portfolio Listing Filters)** و **تکمیل ساختار Case Study**.

---

## 1. Portfolio Listing Filters (Role Filter)

در حال حاضر فیلتر بر اساس Technology به صورت کامل (هم در بک‌اند و هم فرانت‌اند) پیاده‌سازی شده است. نیاز است فیلتر `role` نیز برای تفکیک دقیق‌تر پروژه‌ها اضافه شود.

### 1.1 Backend (`backend/apps/portfolio/views.py`)
- بروزرسانی `PublicCaseStudyListView` جهت پشتیبانی از `?role=...`.
- فیلتر روی فیلدهای `role_fa` یا `role_en` (یا هردو) بر اساس کوئری ارسال شده.

### 1.2 Frontend (`frontend/src/app/[locale]/portfolio/page.tsx`)
- استخراج مقادیر یکتای role از پروژه‌های دریافتی (همانند `technologies`).
- ایجاد کامپوننت `<RoleFilter />` (مشابه `<TechnologyFilter />`) برای مدیریت state در URL.

---

## 2. Case Study Composition (Limitations & Outcome)

بر اساس مستند WordPress Capability (§5.3)، ساختار یک کیس‌استادی باید غنی‌تر از صرفاً عنوان و گالری باشد. فیلدهای `statement`، `problem` و `outcome` در مدل وجود دارند، اما `limitations` باید اضافه شود و هیچ‌کدام در رابط کاربری به‌صورت بلاک‌های ساختاریافته رندر نمی‌شوند.

### 2.1 Backend Models & Serializers
- **`models.py`**: افزودن فیلدهای `limitations_fa` و `limitations_en` (از نوع TextField با `blank=True`) به مدل `CaseStudy`.
- اجرای دستور `makemigrations` برای ایجاد فایل مایگریشن.
- **`serializers.py`**: اضافه کردن فیلدهای جدید `limitations_fa/en` به تمامی سریالایزرهای `CaseStudy` (شامل Admin و Public).

### 2.2 Frontend Admin Editor
- **`CaseStudyEditor.tsx`**: اضافه کردن ورودی‌های Textarea برای `statement` (شرح/رویکرد)، `problem` (چالش/مسئله)، `limitations` (محدودیت‌ها) و `outcome` (دست‌آوردها) به بخش Metadata تب.

### 2.3 Frontend Public View (`[slug]/page.tsx`)
- بروزرسانی تایپ `CaseStudyDTO` در `frontend/src/lib/types/portfolio.ts` (افزودن `limitations_fa/en`، `statement_fa/en`، `problem_fa/en`).
- در صفحه `portfolio/[slug]/page.tsx`، قبل از رندر شدن Narrative Blocks، بررسی کنیم اگر هر یک از فیلدهای متنی (چالش، رویکرد، نتایج، محدودیت‌ها) مقداری داشتند، آن‌ها را در یک `<section>` مشخص با عنوان مربوطه رندر کنیم.
  - این بخش‌ها به عنوان Guard عمل می‌کنند؛ در صورت خالی بودن در دیتابیس، هیچ تگ HTML اضافه رندر نمی‌شود.

## 3. Admin Dashboard Actionable Widgets (Priority: P1)

بر اساس `012-cms-v2-wordpress-capability-task-list.md` (بخش T5.4)، داشبورد ادمین باید widgetهای عملیاتی برای Translation issues، SEO Blockers و Contact Messages داشته باشد.

### 3.1 Backend API (`backend/apps/cms/views.py` یا `backend/apps/blog/views.py`)
- ایجاد اندپوینت تجمیعی برای داشبورد جهت دریافت موارد Actionable:
  - مقالات Outdated یا Missing translation.
  - کیس‌استادی‌هایی که ترجمه ندارند.
  - (بخش SEO Blocker در Content Health موجود است).

### 3.2 Frontend Admin Dashboard (`frontend/src/app/admin/(dashboard)/page.tsx`)
- افزودن ۳ ویجت جدید به داشبورد ادمین:
  - **Translation Issues**: نمایش لیست لینک‌ها به محتواهای Outdated/Missing.
  - **SEO Warnings**: اتصال به سیستم Content Health موجود.
  - **Unread Messages**: اتصال به پیام‌های Contact.

---

## 4. Article Editor Paste Cleanup (Priority: P1)

بر اساس مستند قابلیت‌ها (T3.3)، Editor باید در هنگام paste کردن متون، فرمت‌های اضافی HTML یا Office را پاکسازی کند.

### 4.1 Frontend (`frontend/src/components/admin/composer/plugins/...` یا `tiptap`)
- افزودن `PasteRule` یا تنظیمات Tiptap برای Strip کردن استایل‌های inline (مانند color, font-family) هنگام Paste از Word/Google Docs.

---

## Verification Plan

### Automated Tests
- اطمینان از بیلد موفق فرانت‌اند (`npm run build`).
- بررسی عدم وجود خطای Type checking (`npx tsc --noEmit`).

### Manual Verification
- اجرای مایگریشن‌های دیتابیس (در صورت نیاز).
- بررسی ویجت‌های داشبورد.
- تست پیست کردن یک متن استایل‌دار از Word در ویرایشگر Article و بررسی پاک شدن استایل‌های inline.
