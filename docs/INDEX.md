# 📑 فهرست راهنما و مرجع جامع تمامی مستندات معتبر پروژه (Master Documentation Index)

**آخرین به‌روزرسانی:** مرداد ۱۴۰۵ (August 2026)  
**مسیر پوشه مستندات:** `docs/`

---

## 🏛️ مستند مرجع اصلی و شاه‌کلید معماری (Master Architecture Handbook)

| مستند | موضوع و هدف | مخاطبان |
| :--- | :--- | :--- |
| 📄 **[project_architecture_and_technical_documentation.md](project_architecture_and_technical_documentation.md)** | **دفترچه مرجع الترا-تفصیلی و دایرةالمعارف کامل معماری** شامل مدل‌های دیتابیس پایتون، اینترفیس‌های TypeScript، نمونه کامل APIs، ۳۵+ کامپوننت بوم، الگوریتم Autosave، WebSocket، تعاملات و کانفیگ‌های Docker/Nginx. | **تمامی تیم توسعه / معماران سیستم** |

---

## 📐 مستندات فنی پایه‌ای (Core Technical Architecture)

| مستند | موضوع و هدف |
| :--- | :--- |
| 📄 **[architecture.md](architecture.md)** | معماری کلان سیستم، زیرسیستم‌ها و تصمیمات فنی اولیه |
| 📄 **[tech-stack.md](tech-stack.md)** | استک تکنولوژی‌های انتخابی (Django, Next.js, Postgres, Redis) و دلایل انتخاب |
| 📄 **[scalability.md](scalability.md)** | استراتژی مقیاس‌پذیری و مسیر توسعه آینده |
| 📄 **[ci-cd.md](ci-cd.md)** | پایپلاین استقرار سرور، CI/CD و ساختار Docker Compose |
| 📄 **[incident-runbook.md](incident-runbook.md)** | دستورالعمل مدیریت خطاها و بازیابی در شرایط بحرانی |

---

## 🎨 صفحه‌ساز بصری، CMS و دیزاین سیستم (Visual Builder, CMS & Design)

| مستند | موضوع و هدف |
| :--- | :--- |
| 📄 **[composer-block-catalog.md](composer-block-catalog.md)** | کاتالوگ بلاک‌های محتوایی و کامپوننت‌های بوم صفحه‌ساز |
| 📄 **[design-system-summary.md](design-system-summary.md)** | خلاصه دیزاین سیستم (تایپوگرافی، پالت رنگ، فواصل) |
| 📄 **[design-system.md](design-system.md)** | قوانین و مشخصات تفصیلی دیزاین سیستم |
| 📄 **[ui-ux/README.md](ui-ux/README.md)** | راهنمای کامل سوئیت UI/UX به همراه اصالت طراحی و User Journeys |
| 📄 **[wordpress-capability-extraction-and-cms-reference.md](wordpress-capability-extraction-and-cms-reference.md)** | مرجع قابلیت‌های پیشرفته CMS و قابلیت‌های استخراج شده از وردپرس |

---

## 🗺️ برنامه توسعه، برنامه‌ریزی و نقشه‌راه (Product Planning & Roadmap)

| مستند | موضوع و هدف |
| :--- | :--- |
| 📄 **[master-plan.md](master-plan.md)** | برنامه جامع فنی و محصولات پروژه (Master Product & Technical Plan) |
| 📄 **[roadmap.md](roadmap.md)** | نقشه راه فازبندی شده توسعه پروژه |
| 📄 **[goals-and-vision.md](goals-and-vision.md)** | اهداف، چشم‌انداز، مخاطبان هدف و دامنه MVP |
| 📄 **[tahamohamadi_site_cms_v2_development_plan.md](tahamohamadi_site_cms_v2_development_plan.md)** | برنامه توسعه ارتقای CMS v2 |
| 📄 **[walkthrough.md](walkthrough.md)** | گزارش تست‌ها و تغییرات فازهای اجرا شده |

---

## 🔬 ارزیابی‌های کیفی و تست‌ها (Quality Audits & Compliance)

| مستند | موضوع و هدف |
| :--- | :--- |
| 📄 **[accessibility-audit.md](accessibility-audit.md)** | ارزیابی و گزارش دسترس‌پذیری استاندارد WCAG |
| 📄 **[performance-audit.md](performance-audit.md)** | ارزیابی عملکرد و سرعت بارگذاری (Lighthouse / Web Vitals) |
| 📄 **[reduced-motion-audit.md](reduced-motion-audit.md)** | ارزیابی انیمیشن‌ها و انطباق با درخواست کاهش انیمیشن کاربر |
| 📄 **[manual-test-responsive.md](manual-test-responsive.md)** | دستورالعمل تست دستی واکنش‌گرایی در دستگا‌ه‌ها |
| 📄 **[manual-test-rtl-ltr.md](manual-test-rtl-ltr.md)** | دستورالعمل تست دستی جهت‌های فارسی و انگلیسی (RTL / LTR) |

---

## 🥇 اولویت و اعتبار مستندات (Document Precedence)

1. **`docs/project_architecture_and_technical_documentation.md`** — مرجع نهایی و الترا-تفصیلی کد و معماری فعلی سیستم (Implementation Truth)
2. **`docs/INDEX.md`** — فهرست راهنما و مرجع جستجوی مستندات
3. **`docs/architecture.md`** — تصمیمات کلان معماری سیستم
4. **`docs/design-system-summary.md`** — قوانین دیزاین سیستم
5. **سورس‌کد پروژه (`backend/` و `frontend/`)** — عملکرد سیستم در زمان اجرا
