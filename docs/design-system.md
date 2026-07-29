# Design System — TahaMohamadi.ir

> **نسخه:** 1.0  
> **آخرین بروزرسانی:** 2025-07  
> **فلسفه طراحی:** Modern Clean + Academic Editorial

---

## 1. فلسفه طراحی (Design Philosophy)

> **"Modern Clean + Academic Editorial"**

سایت باید حرفه‌ای، خوانا و قابل اعتماد به نظر برسد. هدف: ترکیب aesthetic مدرن مینیمال با ساختار editorial مناسب محتوای علمی و فنی.

### اصول کلیدی:

1. **Content-first** — محتوا قهرمان است، نه decoration
2. **Whitespace-rich** — فضای خالی = تنفس بصری
3. **Typography-driven** — تایپوگرافی هویت بصری اصلی
4. **Subtle motion** — حرکت فقط هدف‌دار (نه decorative)
5. **Professional restraint** — رنگ کم، contrast بالا، هیچ glitter

---

## 2. سیستم رنگ (Color System)

### Semantic Tokens (Light Mode)

```css
:root {
  /* Background */
  --tm-color-bg-page: #FFFFFF;
  --tm-color-bg-surface: #F9FAFB;
  --tm-color-bg-muted: #F3F4F6;

  /* Text */
  --tm-color-text-primary: #111827;
  --tm-color-text-secondary: #6B7280;
  --tm-color-text-muted: #9CA3AF;

  /* Brand */
  --tm-color-brand-primary: #2563EB;
  --tm-color-brand-primary-hover: #1D4ED8;
  --tm-color-brand-accent: #059669;

  /* Semantic */
  --tm-color-success: #22C55E;
  --tm-color-warning: #F59E0B;
  --tm-color-error: #EF4444;
  --tm-color-info: #3B82F6;

  /* Border */
  --tm-color-border: #E5E7EB;
  --tm-color-border-strong: #D1D5DB;
}
```

### قوانین رنگ:

- **Light-first:** تم اول و اصلی سایت، Light mode است
- **No dark mode in M1:** بررسی و اجرا در Milestone 2
- **Never hardcode colors:** همیشه از tokens استفاده کنید
- **Contrast:** body text ≥ 4.5:1 | large text ≥ 3:1 | interactive ≥ 3:1

---

## 3. تایپوگرافی (Typography)

### فونت‌ها

| نقش | فونت | Direction | Weight‌ها |
|-----|------|-----------|----------|
| متن فارسی (RTL) | **Vazirmatn** | RTL | 300, 400, 500, 600, 700 |
| متن انگلیسی (LTR) | **Inter** | LTR | 300, 400, 500, 600, 700 |
| Monospace/Code | **JetBrains Mono** | LTR | 400, 500 |

### Type Scale (Desktop)

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--tm-text-xs` | 12px | 1.4 | Caption, badge |
| `--tm-text-sm` | 14px | 1.5 | Helper text, metadata |
| `--tm-text-base` | 16px | 1.6 | Body text |
| `--tm-text-lg` | 18px | 1.6 | Body large, lead |
| `--tm-text-xl` | 20px | 1.5 | H4, card title |
| `--tm-text-2xl` | 24px | 1.35 | H3 |
| `--tm-text-3xl` | 30px | 1.3 | H2 |
| `--tm-text-4xl` | 36px | 1.2 | H1 |
| `--tm-text-5xl` | 48px | 1.1 | Display, hero |

### قوانین تایپوگرافی:

- **Prose measure:** max-width: 65ch (خوانایی بهینه)
- **Paragraph spacing:** `1rem` بین پاراگراف‌ها
- **No uppercase for body:** فقط در labels و badges مجاز
- **Font loading:** `display: swap` — FOUT بهتر از FOIT

---

## 4. سیستم Spacing

### Base Unit: 4px

```css
:root {
  --tm-space-0: 0;
  --tm-space-1: 0.25rem;   /* 4px */
  --tm-space-2: 0.5rem;    /* 8px */
  --tm-space-3: 0.75rem;   /* 12px */
  --tm-space-4: 1rem;      /* 16px */
  --tm-space-5: 1.25rem;   /* 20px */
  --tm-space-6: 1.5rem;    /* 24px */
  --tm-space-8: 2rem;      /* 32px */
  --tm-space-10: 2.5rem;   /* 40px */
  --tm-space-12: 3rem;     /* 48px */
  --tm-space-16: 4rem;     /* 64px */
  --tm-space-20: 5rem;     /* 80px */
  --tm-space-24: 6rem;     /* 96px */
}
```

### Semantic Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tm-space-component` | 16px | Internal padding of components |
| `--tm-space-section` | 48-64px | Between page sections |
| `--tm-space-page-x` | 16-32px | Horizontal page margins |
| `--tm-space-page-y` | 24-48px | Vertical page padding |

---

## 5. کامپوننت‌ها (Components)

### ابزارها

- **shadcn/ui** — Accessible primitives based on Radix UI
- **Tailwind CSS** — Utility-first styling layer
- **Token Consumption** — همه components از semantic tokens استفاده کنند

### قوانین مصرف Token:

```tsx
// ✅ درست — از token استفاده می‌کند
<div className="bg-background text-foreground border-border">

// ❌ غلط — hardcoded color
<div className="bg-[#F9FAFB] text-[#111827]">
```

### Component Categories

| Category | Examples |
|----------|---------|
| Form | Button, Input, Select, Textarea, Checkbox, Switch |
| Layout | Card, Container, Separator, Skeleton |
| Navigation | Tabs, Breadcrumb, Pagination |
| Overlay | Dialog, Drawer, Popover, Toast |
| Data Display | Table, Badge, Avatar, Progress |
| Feedback | Alert, Toast, Skeleton |

---

## 6. اصول Layout

### Single-Column Default

- صفحات عمومی: single-column centered
- Max content width: `768px` (prose)
- Max page width: `1200px` (with sidebar)
- Admin: sidebar + content area

### Responsive Breakpoints

| Breakpoint | Width | Device |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

### Grid System

```css
/* Public pages */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--tm-space-page-x);
}

/* Prose content */
.prose-container {
  max-width: 65ch;
}
```

---

## 7. RTL/LTR Handling

### Logical Properties (همیشه)

```css
/* ✅ درست — logical properties */
margin-inline-start: 1rem;
padding-inline-end: 0.5rem;
border-start-start-radius: 8px;

/* ❌ غلط — physical properties */
margin-left: 1rem;
padding-right: 0.5rem;
border-top-left-radius: 8px;
```

### Direction-Aware Layout

```tsx
// Root layout sets direction
<html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
```

### Tailwind RTL Utilities

```html
<!-- Tailwind built-in RTL/LTR -->
<div class="ms-4">          <!-- margin-inline-start -->
<div class="pe-2">          <!-- padding-inline-end -->
<div class="text-start">    <!-- text-align: start -->
```

---

## 8. Accessibility (WCAG 2.2 AA)

| Rule | Standard |
|------|----------|
| Touch targets | ≥ 44×44px |
| Focus indicators | Visible ring (2px, offset 2px) |
| Keyboard navigation | تمام interactive elements قابل دسترسی |
| Color contrast | Body ≥ 4.5:1, Large text ≥ 3:1 |
| Labels | تمام فرم‌ها label دارند |
| Alt text | تمام تصاویر معنادار alt دارند |
| Skip link | "Skip to content" اولین focusable element |
| Reduced motion | `prefers-reduced-motion` رعایت شود |
| Screen readers | ARIA labels on icon-only buttons |
| Focus trapping | در dialogs و modals |

---

## 9. Anti-Patterns (چه چیزهایی استفاده نشود)

| ❌ Anti-Pattern | دلیل |
|----------------|------|
| Glassmorphism | خوانایی متن را کاهش می‌دهد |
| Decorative gradients | حواس‌پرتی از محتوا |
| Glow effects / neon | مناسب personal academic site نیست |
| Oversized hero sections | فضای بالای fold هدر نمی‌رود |
| Parallax scrolling | Performance cost + motion sickness |
| Carousel/slider | کاربران slide دوم را نمی‌بینند |
| Decorative animations | فقط هدف‌دار (state change, loading) |
| Custom scrollbars | Platform-native بهتر |
| Fixed/sticky CTAs | مزاحم خواندن محتوا |
| Emoji as structural icons | inconsistent across platforms |

---

## 10. Admin vs Public Design Separation

| Aspect | Public | Admin |
|--------|--------|-------|
| Rendering | SSR/RSC | CSR/SPA |
| Typography | Prose-optimized | Dense, data-friendly |
| Spacing | Generous (editorial) | Compact (dashboard) |
| Components | Content blocks | Forms, tables, editors |
| Motion | Minimal, subtle | Functional feedback |
| Color | Muted, brand | Utility, status-heavy |
| RTL | Full bidirectional | LTR-first (UI chrome) |

---

## 11. Token Architecture

```
┌─────────────────────────────────────────┐
│  Component Tokens                       │
│  --button-bg, --card-padding            │
├─────────────────────────────────────────┤
│  Semantic Tokens                        │
│  --tm-color-brand-primary               │
│  --tm-space-section                     │
├─────────────────────────────────────────┤
│  Primitive Tokens                       │
│  --tm-blue-600, --tm-space-4            │
└─────────────────────────────────────────┘
```

### Naming Convention

```
--tm-{category}-{item}-{variant}-{state}

Examples:
--tm-color-brand-primary
--tm-color-brand-primary-hover
--tm-space-section
--tm-text-xl
```

### Token File Structure

```
frontend/styles/
├── tokens/
│   ├── primitives.css       # Raw values
│   ├── semantic.css         # Purpose aliases
│   └── components.css       # Component-level tokens
└── globals.css              # Imports + Tailwind
```
