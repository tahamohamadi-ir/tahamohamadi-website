# Reduced-Motion Compliance Audit

> **Date:** 2025-01-20
> **Requirement:** 13.9 — `prefers-reduced-motion` disables non-essential animations
> **Status:** ✅ Compliant (after fixes applied)

## Summary

All CSS animations and transitions in the frontend now respect `prefers-reduced-motion: reduce`. A global media query in `globals.css` acts as a catch-all, and individual components have been annotated with Tailwind's `motion-reduce:` variant for explicit control.

## Global Rule

Added to `frontend/src/app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This ensures any animation or transition not explicitly handled at the component level is still disabled for users who prefer reduced motion.

## Components Audited & Fixed

### 1. Skeleton (`components/ui/skeleton.tsx`)

| Animation | Type | Fix Applied |
|-----------|------|-------------|
| `animate-pulse` | Pulse/opacity loop | Added `motion-reduce:animate-none` |

**Before:** `animate-pulse rounded-md bg-[hsl(var(--primary)/0.1)]`
**After:** `animate-pulse motion-reduce:animate-none rounded-md bg-[hsl(var(--primary)/0.1)]`

### 2. OptimizedImage (`components/ui/optimized-image.tsx`)

| Animation | Type | Fix Applied |
|-----------|------|-------------|
| `transition-opacity duration-300` | Fade-in on load | Added `motion-reduce:transition-none` |

### 3. Dialog (`components/ui/dialog.tsx`)

| Animation | Type | Fix Applied |
| ----------- | ------ | ------------- |
| `animate-in`/`animate-out` (overlay) | Fade in/out | Added `motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none` |
| `animate-in`/`animate-out` + zoom + slide (content) | Zoom + slide in/out | Added `motion-reduce:duration-0 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none` |
| `transition-opacity` (close button) | Opacity on hover | Handled by global rule |

### 4. ArticleCard (`components/blog/ArticleCard.tsx`)

| Animation | Type | Fix Applied |
| ----------- | ------ | ------------- |
| `transition-shadow hover:shadow-md` (card) | Shadow transition | Added `motion-reduce:transition-none` |
| `transition-transform duration-300 group-hover:scale-105` (image) | Scale on hover | Added `motion-reduce:transition-none motion-reduce:group-hover:transform-none` |
| `transition-colors group-hover:text-primary` (title) | Color transition | Handled by global rule (non-movement, but covered) |

### 5. RelatedArticles (`app/[locale]/blog/[slug]/RelatedArticles.tsx`)

| Animation | Type | Fix Applied |
|-----------|------|-------------|
| `transition-shadow hover:shadow-md` | Shadow transition | Added `motion-reduce:transition-none` |

### 6. CaseStudyCard (`app/[locale]/portfolio/_components/CaseStudyCard.tsx`)

| Animation | Type | Fix Applied |
|-----------|------|-------------|
| `transition-shadow hover:shadow-md` | Shadow transition | Added `motion-reduce:transition-none` |

### 7. ResearchFocusBlock (`components/blocks/cms/ResearchFocusBlock.tsx`)

| Animation | Type | Fix Applied |
|-----------|------|-------------|
| `transition-shadow hover:shadow-md` | Shadow transition | Added `motion-reduce:transition-none` |

### 8. Admin Media Page (`app/admin/(dashboard)/media/page.tsx`)

| Animation | Type | Fix Applied |
|-----------|------|-------------|
| `transition-shadow hover:shadow-md` | Shadow transition | Added `motion-reduce:transition-none` |

## Components Audited — No Fix Needed

### Loading Spinners (`animate-spin`)

Found in:

- `components/contact/ContactForm.tsx` — submit button spinner
- `components/admin/auth-guard.tsx` — auth check spinner
- `app/admin/login/page.tsx` — login page spinner (×3)

**Decision:** These are functional loading indicators. The global `prefers-reduced-motion` rule stops the spin animation, but the element remains visible as a static circle with differentiated border colors — users can still recognize a loading state. The accompanying text labels ("Checking authentication...", "Signing in...") provide additional context.

### `transition-colors` on Interactive Elements

Found in: `Button`, `Badge`, `Input`, `Select`, `Header`, `Footer`, `LanguageSwitcher`, `ContactForm`

**Decision:** Color transitions are not movement-based animations. They change hue/opacity without spatial displacement and are generally acceptable for reduced-motion users. However, the global rule disables them as well for maximum compliance.

### Admin Loading Skeletons (`animate-pulse`)

Found in: `TranslationQueue.tsx`, `MediaPicker.tsx`, `ArticleEditor.tsx`

**Decision:** These use the same `animate-pulse` class. The global CSS rule handles them. They also render as static colored blocks with reduced motion — perfectly functional as loading placeholders.

## Verification Approach

To verify reduced-motion compliance:

1. **Chrome DevTools:** Open Rendering tab → Enable "Emulate CSS media feature prefers-reduced-motion: reduce"
2. **Firefox:** `about:config` → `ui.prefersReducedMotion` → set to `1`
3. **OS-level:** Enable "Reduce motion" in system accessibility settings

Expected behavior:

- Skeleton loading placeholders appear as static colored blocks
- Dialog open/close is instant (no fade/zoom/slide)
- Card hover shadows apply instantly (no transition)
- Image hover scale effects are disabled
- Loading spinners appear as static circles
- Color changes on hover are instant

## Architecture Notes

- **Tailwind v4** (`@tailwindcss/postcss`) is used — `motion-reduce:` variant is natively supported
- **Global catch-all** in `globals.css` ensures future animations are compliant by default
- **Component-level annotations** with `motion-reduce:` provide explicit documentation and guarantee correct behavior even if the global rule were removed
- Dialog uses `tailwindcss-animate`-style data-attribute animations — both the global rule and explicit `motion-reduce:` classes handle these
