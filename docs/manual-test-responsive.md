# Manual Responsive Test Checklist

Manual testing guide for verifying responsive behavior across both Persian (`/fa`) and English (`/en`) locales at key viewport breakpoints.

## Test Environment Setup

- Browser: Chrome (latest) with DevTools responsive mode
- Disable browser extensions that may affect layout
- Clear cache between locale switches
- Test with real content (not placeholder text)

## Breakpoints

| Breakpoint | Width | Device Class |
| ------------ | ------- | -------------- |
| Mobile | 375px | iPhone SE / small phones |
| Tablet | 768px | iPad Mini / tablets |
| Desktop | 1024px | Small laptops |
| Large Desktop | 1440px | Standard desktop monitors |

---

## 1. Navigation & Header

### At 375px (Mobile)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 1.1 | Hamburger menu visible and tappable (≥44×44px) | ☐ | ☐ |
| 1.2 | Logo fits without overflow | ☐ | ☐ |
| 1.3 | Language switcher accessible | ☐ | ☐ |
| 1.4 | Mobile menu opens/closes smoothly | ☐ | ☐ |
| 1.5 | Menu items readable (≥16px font) | ☐ | ☐ |
| 1.6 | No horizontal scroll on page | ☐ | ☐ |

### At 768px (Tablet)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 1.7 | Navigation fits in single row or collapses cleanly | ☐ | ☐ |
| 1.8 | Touch targets ≥44px for all nav items | ☐ | ☐ |
| 1.9 | Logo and nav don't overlap | ☐ | ☐ |

### At 1024px (Desktop)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 1.10 | Full desktop navigation visible | ☐ | ☐ |
| 1.11 | Nav items properly aligned (RTL: right-to-left order) | ☐ | ☐ |
| 1.12 | Active page indicator visible | ☐ | ☐ |

### At 1440px (Large Desktop)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 1.13 | Content max-width constrains layout appropriately | ☐ | ☐ |
| 1.14 | Navigation centered or properly aligned | ☐ | ☐ |
| 1.15 | No excessive whitespace | ☐ | ☐ |

---

## 2. Typography & Readability

### At 375px (Mobile)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 2.1 | Body text ≥16px, readable without zooming | ☐ | ☐ |
| 2.2 | Headings scale down appropriately | ☐ | ☐ |
| 2.3 | Line length comfortable (no edge-to-edge text) | ☐ | ☐ |
| 2.4 | Vazirmatn font renders correctly for /fa | ☐ | — |
| 2.5 | Inter font renders correctly for /en | — | ☐ |
| 2.6 | No text truncation or overflow | ☐ | ☐ |

### At 768px (Tablet)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 2.7 | Text measure (line length) stays readable | ☐ | ☐ |
| 2.8 | Heading hierarchy clear | ☐ | ☐ |
| 2.9 | Spacing between sections proportional | ☐ | ☐ |

### At 1024px / 1440px (Desktop)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 2.10 | Body text line length ≤75 characters | ☐ | ☐ |
| 2.11 | Headings appropriately sized for viewport | ☐ | ☐ |
| 2.12 | Paragraph spacing consistent | ☐ | ☐ |

---

## 3. Layout & Grid

### At 375px (Mobile)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 3.1 | Single-column layout for all content | ☐ | ☐ |
| 3.2 | Cards stack vertically | ☐ | ☐ |
| 3.3 | Images scale to fit viewport | ☐ | ☐ |
| 3.4 | Horizontal padding ≥16px on both sides | ☐ | ☐ |
| 3.5 | No content hidden behind edges | ☐ | ☐ |

### At 768px (Tablet)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 3.6 | 2-column grid where appropriate | ☐ | ☐ |
| 3.7 | Grid columns flow correctly (RTL: right-first) | ☐ | ☐ |
| 3.8 | Sidebar collapses or stacks | ☐ | ☐ |
| 3.9 | Card widths balanced | ☐ | ☐ |

### At 1024px (Desktop)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 3.10 | Multi-column layouts render correctly | ☐ | ☐ |
| 3.11 | Grid direction matches locale (RTL/LTR) | ☐ | ☐ |
| 3.12 | Content areas have proper max-width | ☐ | ☐ |

### At 1440px (Large Desktop)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 3.13 | Page doesn't stretch beyond max-width | ☐ | ☐ |
| 3.14 | 3+ column grids display correctly | ☐ | ☐ |
| 3.15 | Adequate gutters between columns | ☐ | ☐ |

---

## 4. RTL/LTR Direction

### All Breakpoints

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 4.1 | `dir="rtl"` set on HTML element for /fa | ☐ | — |
| 4.2 | `dir="ltr"` set on HTML element for /en | — | ☐ |
| 4.3 | `lang="fa"` / `lang="en"` set correctly | ☐ | ☐ |
| 4.4 | Text alignment matches direction | ☐ | ☐ |
| 4.5 | Icons/arrows mirror for RTL (chevrons, arrows) | ☐ | — |
| 4.6 | Form labels align to correct side | ☐ | ☐ |
| 4.7 | Breadcrumbs flow in correct direction | ☐ | ☐ |
| 4.8 | Lists (ordered/unordered) align correctly | ☐ | ☐ |
| 4.9 | Padding/margins mirror for RTL layout | ☐ | ☐ |
| 4.10 | No mixed-direction content breaks | ☐ | ☐ |

---

## 5. Touch Targets & Interaction

### At 375px (Mobile)

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 5.1 | All buttons/links ≥44×44px touch area | ☐ | ☐ |
| 5.2 | Adequate spacing between tappable elements | ☐ | ☐ |
| 5.3 | No overlapping interactive elements | ☐ | ☐ |
| 5.4 | Form inputs tall enough for comfortable touch | ☐ | ☐ |
| 5.5 | Footer links have enough spacing | ☐ | ☐ |

### At 768px (Tablet)

| # | Check | /fa (RTL) | /en (LTR) |
|---|-------|-----------|-----------|
| 5.6 | Touch targets still ≥44px (tablet often touch) | ☐ | ☐ |
| 5.7 | Hover states don't block touch interaction | ☐ | ☐ |

---

## 6. Images & Media

### All Breakpoints

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 6.1 | Images resize without distortion | ☐ | ☐ |
| 6.2 | No images overflow their container | ☐ | ☐ |
| 6.3 | Gallery/portfolio grid adapts to breakpoint | ☐ | ☐ |
| 6.4 | Image alt text present (inspect via DevTools) | ☐ | ☐ |
| 6.5 | Lazy loading works (images load on scroll) | ☐ | ☐ |

---

## 7. Page-Specific Checks

### Home Page

| # | Check | Breakpoints | /fa | /en |
| --- | ------- | ------------- | ----- | ----- |
| 7.1 | Hero section scales properly | 375, 768, 1024, 1440 | ☐ | ☐ |
| 7.2 | CTA button visible without scrolling on mobile | 375 | ☐ | ☐ |
| 7.3 | Featured sections stack on mobile | 375 | ☐ | ☐ |

### Blog Listing

| # | Check | Breakpoints | /fa | /en |
| --- | ------- | ------------- | ----- | ----- |
| 7.4 | Article cards adapt columns per breakpoint | 375, 768, 1024, 1440 | ☐ | ☐ |
| 7.5 | Pagination controls accessible on mobile | 375 | ☐ | ☐ |
| 7.6 | Topic filters usable at all sizes | 375, 768 | ☐ | ☐ |

### Blog Detail

| # | Check | Breakpoints | /fa | /en |
| --- | ------- | ------------- | ----- | ----- |
| 7.7 | Article body readable at all widths | 375, 768, 1024, 1440 | ☐ | ☐ |
| 7.8 | TOC collapses or hides on mobile | 375 | ☐ | ☐ |
| 7.9 | Code blocks scroll horizontally, not page | 375, 768 | ☐ | ☐ |

### Portfolio

| # | Check | Breakpoints | /fa | /en |
|---|-------|-------------|-----|-----|
| 7.10 | Case study cards grid adapts | 375, 768, 1024, 1440 | ☐ | ☐ |
| 7.11 | Gallery images viewable on mobile | 375 | ☐ | ☐ |

### Contact

| # | Check | Breakpoints | /fa | /en |
| --- | ------- | ------------- | ----- | ----- |
| 7.12 | Form fills viewport width on mobile | 375 | ☐ | ☐ |
| 7.13 | Submit button full-width on mobile | 375 | ☐ | ☐ |
| 7.14 | Input labels visible and aligned per direction | 375, 768, 1024, 1440 | ☐ | ☐ |

---

## 8. Footer

### All Breakpoints

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 8.1 | Footer columns stack on mobile (375px) | ☐ | ☐ |
| 8.2 | Links readable and tappable | ☐ | ☐ |
| 8.3 | Social icons properly spaced | ☐ | ☐ |
| 8.4 | Copyright text doesn't overflow | ☐ | ☐ |
| 8.5 | Footer alignment matches locale direction | ☐ | ☐ |

---

## 9. Performance & Loading

| # | Check | /fa (RTL) | /en (LTR) |
| --- | ------- | ----------- | ----------- |
| 9.1 | No layout shift during page load (CLS < 0.1) | ☐ | ☐ |
| 9.2 | Fonts load without FOUT causing layout jump | ☐ | ☐ |
| 9.3 | Content visible within 2.5s (LCP) | ☐ | ☐ |
| 9.4 | Skeleton/loading states show on slow connections | ☐ | ☐ |

---

## Test Execution Notes

### How to Test

1. Open Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Set viewport width to each breakpoint (375, 768, 1024, 1440)
3. Navigate to `/fa` first, complete all checks for that breakpoint
4. Navigate to `/en`, repeat checks for same breakpoint
5. Move to next breakpoint and repeat

### Reporting Issues

For each failed check, document:

- **Breakpoint** where issue occurs
- **Locale** affected (/fa, /en, or both)
- **Page URL** where issue is visible
- **Screenshot** showing the problem
- **Expected vs Actual** behavior

### Test Frequency

- Before each production deployment
- After major layout/CSS changes
- After adding new pages or sections
- After updating fonts or i18n configuration
