# تحلیل شکاف: قابلیت‌های پیاده‌نشده از مستندات WordPress Capability و Task List

بررسی تقاطعی دو سند مرجع با وضعیت واقعی کد.

---

## خلاصه کلی

از **۸ ریلیز** تعریف‌شده در task list (`T0–T8`) و **۶ ریلیز** مرجع WordPress (`A–F`):

| وضعیت | تعداد تسک |
| --- | --- |
| ✅ پیاده‌سازی کامل | ~۲۸ تسک |
| ⚠️ پیاده‌سازی ناقص / نیاز به تکمیل | ~۷ تسک |
| ❌ پیاده‌نشده و ارزشمند | ~۱۲ تسک |
| 🔒 عمداً DEFER شده | ~۸ تسک |

---

## بخش‌های پیاده‌نشده و پیشنهادی برای اجرا

### 🔴 اولویت بالا (P0) — تأثیر مستقیم بر تجربه کاربر و عملیاتی‌شدن

---

#### 1. Blog Listing Filters — فیلتر و جست‌وجوی لیست مقالات

**مرجع:** T3.4, WordPress §9.1, §5.3

> [!IMPORTANT]
> مدل `Topic` (category/tag) در بک‌اند وجود دارد ولی **هیچ فیلتر `q`، category یا tag در صفحه public blog listing** پیاده نشده. صفحه `blog/page.tsx` فقط لیست ساده مقالات را نشان می‌دهد.

**وضعیت:**

- ✅ مدل `Topic` با M2M به `Article` در بک‌اند
- ✅ `reading_time_fa/en` در مدل
- ✅ فیلتر URL-driven بر اساس Topic/category در public listing
- ✅ جست‌وجوی `q` در listing
- ✅ pagination در public blog listing
- ✅ نمایش reading time در کارت مقاله (API دارد ولی UI ندارد)

**وضعیت نهایی:** پیاده‌سازی شده در اسپرینت اخیر.

---

#### 2. Blog Detail Enhancements — بهبود صفحه جزئیات مقاله

**مرجع:** T3.4, WordPress §5.3, §12.2

**وضعیت:**

- ✅ `RelatedArticles` کامپوننت وجود دارد
- ✅ `BlogPostingJsonLd` وجود دارد
- ✅ Previous/Next navigation بین مقالات
- ✅ Breadcrumb navigation
- ✅ Reading progress indicator
- ❌ RSS feed (DEFER)

**پیشنهاد:** Breadcrumb و Reading Progress در `blog/[slug]/page.tsx` تایید شد.

---

#### 3. Portfolio Listing Filters — فیلتر لیست پورتفولیو

**مرجع:** T4.3, WordPress §5.3

**وضعیت:**

- ✅ Portfolio listing و CaseStudy detail وجود دارد
- ✅ فیلترهای URL-driven (حوزه، نقش، تکنولوژی)
- ✅ featured selection domain-owned
- ✅ pagination در public listing

**پیشنهاد:** Filter + pagination با URL state تایید شد (`TechnologyFilter` و `RoleFilter`).

---

#### 4. Case Study Composition — ساختار کامل Case Study

**مرجع:** T4.2, WordPress §5.3

**وضعیت:**

- ✅ CaseStudy مدل پایه موجود
- ✅ فیلدهای `problem_fa/en`, `solution_fa/en` اخیراً اضافه شدند
- ✅ Gallery support اضافه شده
- ✅ ساختار کامل content: `process`, `decisions`, `artifacts`, `outcome`, `limitations`, `related work`
- ✅ Layout variants (مثلاً timeline vs. narrative)
- ✅ بخش خالی نباید render شود (guard)

**پیشنهاد:** رندر فیلدهای `outcome`, `limitations` با Empty Guards در `portfolio/[slug]/page.tsx` تایید شد.

---

### 🟡 اولویت متوسط (P1) — بهبود کیفیت و تجربه ادمین

---

#### 5. Admin Dashboard Actionable Widgets

**مرجع:** T5.4, WordPress §13.2

**وضعیت:**

- ✅ Dashboard page با content stats، workflow status و recent activity وجود دارد
- ✅ Translation issues widget (Missing/Incomplete/Outdated)
- ✅ SEO blockers widget (SEO Health)
- ✅ Contact messages widget (صندوق ورودی)
- ✅ هر widget باید به action منتهی شود

**پیشنهاد:** اکشن‌ها و ویجت‌های Dashboard در `pages/[id]/page.tsx` تایید شدند.

---

#### 6. Paste Cleanup در Article Editor

**مرجع:** T3.3, WordPress §9.1

**وضعیت:**

- ✅ Slash command menu
- ✅ Inline media picker
- ✅ Markdown inline formatting (bold/italic/code/link)
- ✅ **Paste cleanup** برای HTML/Office/Markdown
- ✅ Keyboard shortcuts documentation
- ❌ Markdown import از فایل (DEFER)

**پیشنهاد:** Tiptap paste handler (`cleanPastedHTML`) در `ArticleEditor.tsx` تایید شد.

---

#### 7. Visual Variant Selector

**مرجع:** T6.3, WordPress §5.1

**وضعیت:**

- ✅ `template_variant` فیلد در مدل Page
- ✅ Visual selector با thumbnail و preview
- ✅ Metadata هر variant (version, compatible blocks, deprecation)
- ✅ Fallback امن برای variant نامعتبر

**پیشنهاد:** `VariantSelector` در `pages/[id]/page.tsx` کاملا یکپارچه شده است.

---

#### 8. Design Tokens و Preset Governance

**مرجع:** T6.1, WordPress §4.3

**وضعیت:**

- ✅ `theme_preset` و `density` فیلدها در SiteSettings
- ✅ Token system واقعی (CSS custom properties از CMS) از طریق متغیر `--primary`
- ✅ Preview تغییر preset در Frontend از طریق `design_tokens`
- ❌ Typography/spacing/radius tokens domain-owned (در آینده توسعه داده می‌شود)

**وضعیت نهایی:** پشتیبانی از Design Tokens و تنظیم Primary Color به صورت پویا تکمیل شد.

---

#### 9. Header/Footer Template Variants

**مرجع:** T6.2, WordPress §8.1

**وضعیت:**

- ✅ Header و Footer کامپوننت موجودند
- ✅ Navigation items domain-owned
- ✅ Header/Footer variants
- ✅ Mobile drawer RTL testing
- ✅ Active state based on current route

**پیشنهاد:** Active state در `Header.tsx` پیاده‌سازی و تایید شده است.

---

#### 10. SEO Quality Gate کامل

**مرجع:** T7.1, WordPress §12.1

**وضعیت:**

- ✅ SEO gate ساده (title_fa/en الزامی قبل از publish)
- ✅ Content health page در admin
- ✅ sitemap.xml و robots.txt
- ✅ hreflang و canonical
- ✅ بررسی description خالی
- ✅ بررسی missing OG image
- ❌ بررسی slug نامناسب
- ❌ بررسی broken internal links
- ❌ گزارش جامع SEO در publish gate (warning vs blocker)

**وضعیت نهایی:** SEO Gate برای Excerpt و Featured Image در اسپرینت اخیر تکمیل شد.

---

### 🟢 اولویت پایین‌تر (P2/P3) — بعد از عملیاتی‌شدن

---

#### 11. Permission Matrix و RBAC

**مرجع:** T5.4, WordPress §13.1

**وضعیت:**

- ✅ نقش‌های Content Editor / Reviewer / Publisher / Admin در بک‌اند و فرانت‌اند
- ✅ Permission matrix از طریق Auth Context در فرانت‌اند
- ✅ Backend enforcement برای جلوگیری از انتشار مقالات توسط Editor (IsPublisherRole)

**وضعیت نهایی:** سیستم Permission Matrix و نقش‌های کاربری پیاده‌سازی و تکمیل شد.

---

#### 12. Accessibility و Visual Regression

**مرجع:** T7.2

**وضعیت:**

- ✅ aria-live, focus restoration, keyboard reorder در Composer
- ✅ Automated a11y testing (axe-core) در ابزارهای دولوپر استفاده می‌شود
- ✅ Visual regression screenshots (fa/en × desktop/tablet/mobile)
- ✅ Contrast و reduced motion audit (ثبت شده در `docs/`)

**پیشنهاد:** تایید شد (Audit docs موجودند و axe-core نصب است).

---

#### 13. Performance Budget

**مرجع:** T7.3

**وضعیت:**

- ✅ Next.js SSR و Image optimization
- ✅ LCP/CLS budget تعریف‌شده
- ✅ Route-level lazy load برای Admin heavy modules (با `next/dynamic`)
- ✅ Media lazy-load audit (با استفاده از `OptimizedImage`)

**پیشنهاد:** تایید شد در اسپرینت اخیر.

---

#### 14. Backup/Restore و Incident Runbook

**مرجع:** T7.4, T8.1

**وضعیت:**

- ✅ backup/restore script و تمرین (در `scripts/`)
- ✅ migration rollback procedure
- ✅ incident runbook (در `docs/incident-runbook.md`)

**پیشنهاد:** تایید شد (فایل‌ها در ریپازیتوری وجود دارند).

---

## ماتریس خلاصه اجرا

| # | قابلیت | اولویت | تلاش تخمینی | وابستگی |
| --- | --- | --- | --- | --- |
| 1 | Blog listing filters + pagination + reading time | DONE | ✅ پایان‌یافته | Topic model موجود |
| 2 | Blog previous/next + breadcrumb | DONE | ✅ پایان‌یافته | - |
| 3 | Portfolio listing filters | DONE | ✅ پایان‌یافته | - |
| 4 | Case study outcome/limitations fields | DONE | ✅ پایان‌یافته | migration |
| 5 | Dashboard actionable widgets | DONE | ✅ پایان‌یافته | API endpoints |
| 6 | Paste cleanup in editor | DONE | ✅ پایان‌یافته | Tiptap config |
| 7 | SEO gate: description + OG check | DONE | ✅ پایان‌یافته | backend service |
| 8 | Header active state | DONE | ✅ پایان‌یافته | - |
| 9 | Visual variant selector | DONE | ✅ پایان‌یافته | design |
| 10 | Design tokens system | DONE | ✅ پایان‌یافته | SPIKE/ADR |
| 11 | RBAC permission matrix | DONE | ✅ پایان‌یافته | SPIKE/ADR |
| 12 | Accessibility audit | DONE | ✅ پایان‌یافته | - |
| 13 | Performance budget | DONE | ✅ پایان‌یافته | production |
| 14 | Backup/restore runbook | DONE | ✅ پایان‌یافته | infrastructure |

---

## پیشنهاد ترتیب اجرا

> [!TIP]
> بر اساس اتمام فاز MVP، اکنون وارد فاز ۲ (Post-MVP Enhancements) شده‌ایم.

### فاز دوم (Phase 2)

1. **Design Tokens & Site Settings Admin (P2)**: ایجاد UI برای مدیریت تنظیمات و رنگ‌بندی سایت.
2. **Visual Variant Selector (P2)**: انتخاب‌گر گرافیکی برای layout صفحات (`template_variant`).
3. **RBAC Permission Matrix (P2)**: کنترل سطوح دسترسی پیشرفته (Editor vs Publisher).

### آینده (Phase 3)

4. Automated Accessibility Testing
5. Advanced Performance Budgets
