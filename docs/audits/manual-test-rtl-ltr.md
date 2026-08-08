# Manual Test: RTL/LTR Visual Regression Checklist

> **Requirement:** 15.7  
> **Purpose:** Verify that Persian (RTL) and English (LTR) layouts render correctly with real content across all public pages and admin interfaces.

## Prerequisites

- Application running locally or in staging environment
- Real content available in both Persian (fa) and English (en) locales
- Browser DevTools open for inspecting computed styles
- Test at minimum breakpoints: 375px, 768px, 1024px, 1440px

---

## 1. Text Alignment

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 1.1 | Body text aligns to the correct side | Right-aligned | Left-aligned | ☐ |
| 1.2 | Headings (h1–h6) align correctly | Right-aligned | Left-aligned | ☐ |
| 1.3 | Paragraphs with mixed content (numbers, English words in Persian text) display inline correctly | — | — | ☐ |
| 1.4 | Lists (ul/ol) bullet/number position matches direction | Right side | Left side | ☐ |
| 1.5 | Blockquotes border appears on correct side | Right border | Left border | ☐ |
| 1.6 | Text truncation/ellipsis appears on correct end | Left end (…) | Right end (…) | ☐ |
| 1.7 | Multi-line text wraps correctly without layout breaking | — | — | ☐ |

---

## 2. Navigation Direction

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 2.1 | Main nav items order is reversed | Right-to-left order | Left-to-right order | ☐ |
| 2.2 | Logo positioned on correct side | Top-right | Top-left | ☐ |
| 2.3 | Language switcher positioned on opposite side of logo | Top-left | Top-right | ☐ |
| 2.4 | Breadcrumb separator direction correct | ← (left arrow) | → (right arrow) | ☐ |
| 2.5 | Mobile hamburger menu icon on correct side | Left side | Right side | ☐ |
| 2.6 | Mobile slide-out menu enters from correct side | From left | From right | ☐ |
| 2.7 | Pagination arrows direction is correct | ← next, → prev | → next, ← prev | ☐ |
| 2.8 | Footer nav items order matches direction | Right-to-left | Left-to-right | ☐ |

---

## 3. Card Layouts

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 3.1 | Blog post cards: thumbnail position consistent | Image on right or full-width top | Image on left or full-width top | ☐ |
| 3.2 | Card text content aligns to correct side | Right-aligned | Left-aligned | ☐ |
| 3.3 | Card grid order fills from correct direction | Right-to-left fill | Left-to-right fill | ☐ |
| 3.4 | Portfolio case study cards display correctly | — | — | ☐ |
| 3.5 | Card metadata (date, read time, tags) align correctly | Right-aligned or end-aligned | Left-aligned or start-aligned | ☐ |
| 3.6 | Card action buttons/links position correctly | Start-aligned per direction | Start-aligned per direction | ☐ |
| 3.7 | Card hover effects work consistently in both directions | — | — | ☐ |

---

## 4. Form Field Alignment

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 4.1 | Input labels align to correct side | Right-aligned | Left-aligned | ☐ |
| 4.2 | Input text entry starts from correct side | Right side | Left side | ☐ |
| 4.3 | Placeholder text aligns correctly | Right-aligned | Left-aligned | ☐ |
| 4.4 | Validation error messages appear on correct side | Right-aligned below field | Left-aligned below field | ☐ |
| 4.5 | Form submit button aligns correctly | Start-aligned (right) | Start-aligned (left) | ☐ |
| 4.6 | Textarea text direction correct | RTL input | LTR input | ☐ |
| 4.7 | Select/dropdown options align correctly | Right-aligned | Left-aligned | ☐ |
| 4.8 | Checkbox/radio label text on correct side | Label on right of control (or left in RTL context) | Label on right of control | ☐ |
| 4.9 | Search input icon position correct | Icon on right (leading) | Icon on left (leading) | ☐ |

---

## 5. Padding/Margin Direction

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 5.1 | Container padding mirrors correctly | padding-right for start | padding-left for start | ☐ |
| 5.2 | Section margins are symmetric or correctly mirrored | — | — | ☐ |
| 5.3 | Inline elements (badges, tags) have correct spacing | margin-left between items | margin-right between items | ☐ |
| 5.4 | Sidebar content has correct inset | Right-side content padding | Left-side content padding | ☐ |
| 5.5 | Nested indentation (comments, replies) indents from correct side | Indent from right | Indent from left | ☐ |
| 5.6 | Gap between icon and text consistent and on correct side | Gap on left of icon | Gap on right of icon | ☐ |

---

## 6. Icon Placement

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 6.1 | Directional icons (arrows, chevrons) flip horizontally | ← means forward/next | → means forward/next | ☐ |
| 6.2 | Non-directional icons (search, settings, close) do NOT flip | Same orientation | Same orientation | ☐ |
| 6.3 | Icon + text combos: icon on correct side | Icon on right (leading) | Icon on left (leading) | ☐ |
| 6.4 | Social media icons row order | Right-to-left | Left-to-right | ☐ |
| 6.5 | External link icon position (trailing) | On left side of text | On right side of text | ☐ |
| 6.6 | Loading spinner position (if inline) | Correct side | Correct side | ☐ |

---

## 7. Modal/Dialog Positioning

| # | Check | RTL (Persian /fa) | LTR (English /en) | Status |
| --- | ------- | ------------------- | ------------------- | -------- |
| 7.1 | Modal close button position | Top-left corner | Top-right corner | ☐ |
| 7.2 | Modal title/header text alignment | Right-aligned | Left-aligned | ☐ |
| 7.3 | Modal body content text alignment | Right-aligned | Left-aligned | ☐ |
| 7.4 | Modal footer buttons order | Primary on left, secondary on right | Primary on right, secondary on left | ☐ |
| 7.5 | Toast/notification appears from correct side | Top-left or bottom-left | Top-right or bottom-right | ☐ |
| 7.6 | Drawer/panel slides from correct side | From left | From right | ☐ |
| 7.7 | Dropdown menus align to correct edge of trigger | Right-aligned to trigger | Left-aligned to trigger | ☐ |

---

## 8. Page-Specific Checks

### 8.1 Home Page

| # | Check | Status |
| --- | ------- | -------- |
| 8.1.1 | Hero section text and CTA alignment correct for both locales | ☐ |
| 8.1.2 | Featured work section cards order and alignment correct | ☐ |
| 8.1.3 | Contact CTA section mirrors correctly | ☐ |

### 8.2 Blog Listing

| # | Check | Status |
| --- | ------- | -------- |
| 8.2.1 | Featured article layout mirrors correctly | ☐ |
| 8.2.2 | Topic filter tags flow from correct direction | ☐ |
| 8.2.3 | Pagination component direction correct | ☐ |

### 8.3 Blog Article Detail

| # | Check | Status |
| --- | ------- | -------- |
| 8.3.1 | Table of contents positioning correct | ☐ |
| 8.3.2 | Article body text direction and alignment correct | ☐ |
| 8.3.3 | Code blocks remain LTR in both locales | ☐ |
| 8.3.4 | Related articles section mirrors correctly | ☐ |

### 8.4 Portfolio

| # | Check | Status |
| --- | ------- | -------- |
| 8.4.1 | Case study facts/metadata layout mirrors correctly | ☐ |
| 8.4.2 | Gallery navigation arrows direction correct | ☐ |
| 8.4.3 | Technology tags flow from correct direction | ☐ |

### 8.5 Contact Page

| # | Check | Status |
|---|-------|--------|
| 8.5.1 | Contact form fields and labels align correctly | ☐ |
| 8.5.2 | Social links and contact info section mirrors correctly | ☐ |

---

## 9. Cross-Cutting Concerns

| # | Check | Status |
| --- | ------- | -------- |
| 9.1 | `<html dir="rtl" lang="fa">` set correctly on Persian pages | ☐ |
| 9.2 | `<html dir="ltr" lang="en">` set correctly on English pages | ☐ |
| 9.3 | Font family switches correctly (Vazirmatn for fa, Inter for en) | ☐ |
| 9.4 | No horizontal overflow or scrollbar in either direction | ☐ |
| 9.5 | Transitions/animations direction-aware (slide-in from correct side) | ☐ |
| 9.6 | Scrollbar position (right in LTR, left in RTL) handled by browser | ☐ |
| 9.7 | CSS logical properties used (`margin-inline-start` etc.) — verify no hardcoded `margin-left`/`margin-right` causing issues | ☐ |
| 9.8 | Tab focus order follows visual reading direction | ☐ |
| 9.9 | Switching locale mid-session preserves page context and updates direction instantly | ☐ |

---

## 10. Regression Test Procedure

1. **Navigate to /fa** (Persian) — verify `dir="rtl"` on `<html>`
2. **Navigate to /en** (English) — verify `dir="ltr"` on `<html>`
3. For each page (Home, Blog, Blog Detail, Portfolio, Portfolio Detail, About, Contact, Resume):
   - Open in Persian locale → visually inspect all items in sections 1–7
   - Switch to English locale → visually inspect all items in sections 1–7
   - Compare side-by-side if possible (two browser windows)
4. Test at each breakpoint: 375px, 768px, 1024px, 1440px
5. Document any misalignments, overflow issues, or non-mirrored elements
6. Take screenshots for before/after comparison in future releases

---

## Result Summary

| Section | Pass | Fail | N/A | Notes |
| --------- | ------ | ------ | ----- | ------- |
| 1. Text Alignment | | | | |
| 2. Navigation Direction | | | | |
| 3. Card Layouts | | | | |
| 4. Form Field Alignment | | | | |
| 5. Padding/Margin Direction | | | | |
| 6. Icon Placement | | | | |
| 7. Modal/Dialog Positioning | | | | |
| 8. Page-Specific Checks | | | | |
| 9. Cross-Cutting Concerns | | | | |

**Tester:** _______________  
**Date:** _______________  
**Build/Commit:** _______________  
**Overall Result:** ☐ Pass / ☐ Fail  
