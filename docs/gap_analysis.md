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
- ❌ Breadcrumb navigation
- ❌ Reading progress indicator
- ❌ RSS feed

**پیشنهاد:** Breadcrumb و موارد دیگر در فازهای بعدی به عنوان P2 بررسی شود.

---

#### 3. Portfolio Listing Filters — فیلتر لیست پورتفولیو

**مرجع:** T4.3, WordPress §5.3

**وضعیت:**

- ✅ Portfolio listing و CaseStudy detail وجود دارد
- ❌ فیلترهای URL-driven (حوزه، نقش، تکنولوژی)
- ❌ featured selection domain-owned
- ❌ pagination در public listing

**پیشنهاد:** Filter + pagination ساده با URL state.

---

#### 4. Case Study Composition — ساختار کامل Case Study

**مرجع:** T4.2, WordPress §5.3

**وضعیت:**

- ✅ CaseStudy مدل پایه موجود
- ✅ فیلدهای `problem_fa/en`, `solution_fa/en` اخیراً اضافه شدند
- ✅ Gallery support اضافه شده
- ❌ ساختار کامل content: `process`, `decisions`, `artifacts`, `outcome`, `limitations`, `related work`
- ❌ Layout variants (مثلاً timeline vs. narrative)
- ❌ بخش خالی نباید render شود (guard)

**پیشنهاد:** تکمیل فیلدهای `outcome`, `limitations` و empty-section guard.

---

### 🟡 اولویت متوسط (P1) — بهبود کیفیت و تجربه ادمین

---

#### 5. Admin Dashboard Actionable Widgets

**مرجع:** T5.4, WordPress §13.2

**وضعیت:**

- ✅ Dashboard page با content stats، workflow status و recent activity وجود دارد
- ❌ Translation issues widget (Missing/Incomplete/Outdated)
- ❌ Media failures widget
- ❌ SEO blockers widget
- ❌ Contact messages widget (صفحه contact جداست ولی در dashboard نیست)
- ❌ هر widget باید به action منتهی شود

**پیشنهاد:** افزودن ۳ widget: Translation issues، unread contacts و SEO warnings.

---

#### 6. Paste Cleanup در Article Editor

**مرجع:** T3.3, WordPress §9.1

**وضعیت:**

- ✅ Slash command menu
- ✅ Inline media picker
- ✅ Markdown inline formatting (bold/italic/code/link)
- ❌ **Paste cleanup** برای HTML/Office/Markdown
- ❌ Keyboard shortcuts documentation
- ❌ Markdown import از فایل

**پیشنهاد:** Tiptap paste handler برای strip HTML/Office formatting.

---

#### 7. Visual Variant Selector

**مرجع:** T6.3, WordPress §5.1

**وضعیت:**

- ✅ `template_variant` فیلد در مدل Page
- ❌ Visual selector با thumbnail و preview
- ❌ Metadata هر variant (version, compatible blocks, deprecation)
- ❌ Fallback امن برای variant نامعتبر

**پیشنهاد:** DEFER — فعلاً مقادیر ساده کافی است. وقتی variant واقعی طراحی شد اجرا شود.

---

#### 8. Design Tokens و Preset Governance

**مرجع:** T6.1, WordPress §4.3

**وضعیت:**

- ✅ `theme_preset` و `density` فیلدها در SiteSettings
- ❌ Token system واقعی (CSS custom properties از CMS)
- ❌ Preview تغییر preset قبل از اعمال
- ❌ Typography/spacing/color/radius tokens domain-owned

**پیشنهاد:** SPIKE — طراحی token system. فعلاً preset ساده + CSS variables ایستا کافی است.

---

#### 9. Header/Footer Template Variants

**مرجع:** T6.2, WordPress §8.1

**وضعیت:**

- ✅ Header و Footer کامپوننت موجودند
- ✅ Navigation items domain-owned
- ❌ Header/Footer variants (مثلاً centered logo vs. left-aligned)
- ❌ Mobile drawer RTL testing
- ❌ Active state based on current route

**پیشنهاد:** ۱-۲ variant ساده Header/Footer کافی است. Active state اولویت‌دار.

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

- ✅ `IsAuthenticated` permission در viewها
- ❌ نقش‌های Content Editor / Reviewer / Publisher / Admin
- ❌ Permission matrix
- ❌ Backend enforcement فراتر از authenticated/anonymous

**پیشنهاد:** DEFER — فعلاً single-admin. وقتی تیم محتوایی شد اجرا شود.

---

#### 12. Accessibility و Visual Regression

**مرجع:** T7.2

**وضعیت:**

- ✅ aria-live, focus restoration, keyboard reorder در Composer
- ❌ Automated a11y testing (axe-core)
- ❌ Visual regression screenshots (fa/en × desktop/tablet/mobile)
- ❌ Contrast و reduced motion audit

**پیشنهاد:** DEFER — بعد از تثبیت طراحی.

---

#### 13. Performance Budget

**مرجع:** T7.3

**وضعیت:**

- ✅ Next.js SSR و Image optimization
- ❌ LCP/CLS budget تعریف‌شده
- ❌ Route-level lazy load برای Admin heavy modules
- ❌ Media lazy-load audit

**پیشنهاد:** DEFER — بعد از production deploy.

---

#### 14. Backup/Restore و Incident Runbook

**مرجع:** T7.4, T8.1

**وضعیت:**

- ❌ backup/restore script و تمرین
- ❌ migration rollback procedure
- ❌ incident runbook

**پیشنهاد:** قبل از production deploy باید انجام شود.

---

## ماتریس خلاصه اجرا

| # | قابلیت | اولویت | تلاش تخمینی | وابستگی |
| --- | --- | --- | --- | --- |
| 1 | Blog listing filters + pagination + reading time | DONE | ✅ پایان‌یافته | Topic model موجود |
| 2 | Blog previous/next + breadcrumb | DONE | ✅ پایان‌یافته | - |
| 3 | Portfolio listing filters | P1 | 🟡 متوسط | - |
| 4 | Case study outcome/limitations fields | P1 | 🟢 کم | migration |
| 5 | Dashboard actionable widgets | P1 | 🟡 متوسط | API endpoints |
| 6 | Paste cleanup in editor | P1 | 🟢 کم | Tiptap config |
| 7 | SEO gate: description + OG check | DONE | ✅ پایان‌یافته | backend service |
| 8 | Header active state | P1 | 🟢 کم | - |
| 9 | Visual variant selector | P2 | 🔴 زیاد | design |
| 10 | Design tokens system | P2 | 🔴 زیاد | SPIKE/ADR |
| 11 | RBAC permission matrix | P2 | 🔴 زیاد | SPIKE/ADR |
| 12 | Accessibility audit | P2 | 🟡 متوسط | - |
| 13 | Performance budget | P3 | 🟡 متوسط | production |
| 14 | Backup/restore runbook | P1 | 🟡 متوسط | infrastructure |

---

## پیشنهاد ترتیب اجرا

> [!TIP]
> بر اساس فلسفه «سریع‌ترین مسیر به عملیاتی‌شدن»:

### فاز بعدی فوری (Sprint)

1. Portfolio listing filters
2. Dashboard widgets تکمیلی
3. Paste cleanup
4. Header active state

### قبل از Production

5. Backup/restore runbook
6. Performance audit اولیه
