# Design System Summary — TahaMohamadi.ir

**Version:** 2.0  
**Last Updated:** 2026-07-28  
**Full Reference:** `docs/ui-ux/design-system/`  
**Runtime Source of Truth:** `frontend/src/css/tokens.scss` (when created)  

---

## 1. Design Direction

**Modern Clean + Academic Editorial**

Content-first, typography-driven, light-first system where hierarchy, reading measure, and deliberate whitespace do the work — not decoration.

---

## 2. Color System

### Semantic Roles (Light Theme)

| Role | Purpose | Usage |
|---|---|---|
| Canvas | Page background | Body, main content area |
| Surface | Card/component background | Cards, panels, modals |
| Text Primary | Main readable content | Body text, headings |
| Text Secondary | Supporting/muted text | Captions, metadata |
| Border Subtle | Separation lines | Dividers, card borders |
| Action Primary | Primary interactive color | CTAs, active states |
| Link | Inline text navigation | Links, anchors |
| Focus Ring | Keyboard focus indicator | All focusable elements |
| Success | Positive state | Confirmations, published |
| Warning | Caution state | Pending, attention needed |
| Danger | Negative/destructive | Errors, delete actions |

### Rules

- Components consume semantic roles, never raw hex values
- Color alone is never the sole state indicator (add icon/text)
- Dark mode is NOT approved for MVP (deferred)
- All text must meet WCAG 2.2 AA contrast (4.5:1 normal, 3:1 large)

---

## 3. Typography

### Font Stack

| Locale | Primary Font | Fallback |
|---|---|---|
| Persian (fa) | Vazirmatn Variable | Tahoma, Arial, sans-serif |
| English (en) | Inter | system-ui, -apple-system, sans-serif |
| Code | JetBrains Mono | Consolas, monospace |

### Scale

| Level | Desktop | Mobile | Weight |
|---|---|---|---|
| H1 | 2.25-3rem | 1.75-2rem | 700 |
| H2 | 1.75-2.25rem | 1.5-1.75rem | 600 |
| H3 | 1.5rem | 1.25rem | 600 |
| Body | 1rem (16px) | 1rem | 400 |
| Small | 0.875rem | 0.875rem | 400 |
| Caption | 0.75rem | 0.75rem | 400 |

### Rules

- One visible H1 per page (semantic heading hierarchy)
- Persian uses looser line-height (1.8-2.0 for body)
- English uses standard line-height (1.5-1.6)
- Prose constrained to ~65-75 characters
- No ultra-light weights (<300) at small sizes
- Technical text (URLs, DOIs, code) always LTR-isolated in Persian

---

## 4. Spacing

### Scale (4px base)

| Token | Value | Usage |
|---|---|---|
| space-1 | 4px | Tight internal spacing |
| space-2 | 8px | Compact elements |
| space-3 | 12px | Between related items |
| space-4 | 16px | Standard component spacing |
| space-6 | 24px | Section internal spacing |
| space-8 | 32px | Between sections |
| space-12 | 48px | Major section divisions |
| space-16 | 64px | Page-level breathing room |

### Rules

- Use token scale, never arbitrary values
- Comfortable vertical rhythm for content pages
- Dense spacing only for admin data tables
- Fixed chrome (header/footer) reserves content space

---

## 5. Borders & Radius

### Radius Scale

| Token | Value | Usage |
|---|---|---|
| radius-sm | 4px | Inputs, small elements |
| radius-md | 6px | Buttons, badges |
| radius-lg | 8px | Cards, panels |
| radius-xl | 12px | Dialogs, large containers |
| radius-full | 9999px | Pills, avatars |

### Rules

- Prefer borders over elevation for separation
- Cards frame repeated records (not every content section)
- No arbitrary shadows or nested surface framing
- Elevation only for justified overlays (dialogs, dropdowns)

---

## 6. Layout & Grid

### Breakpoints

| Name | Min-width | Usage |
|---|---|---|
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |
| 2xl | 1536px | Wide screens |

### Content Widths

| Token | Value | Usage |
|---|---|---|
| page-max-width | 1280px | Overall page container |
| prose-max-width | 65ch | Reading content |
| control-min-size | 44px | Touch/click target minimum |

### Layout Rules

- Mobile-first responsive design
- Start with single column, add columns when reading task is clear
- RTL/LTR parity — use logical CSS properties (start/end, not left/right)
- Header and footer use token-based logical layout
- Reserve space for fixed chrome

---

## 7. Component Hierarchy

### Buttons

| Level | Usage | Visual Weight |
|---|---|---|
| Primary | Main CTA per context (one per viewport) | Highest — filled, brand color |
| Secondary | Supporting action | Medium — outlined or toned |
| Tertiary/Ghost | Minor actions | Low — text-only |
| Destructive | Irreversible actions | Danger color, confirms first |

### Cards

- Frame repeated records (blog posts, portfolio items)
- DO NOT frame prose paragraphs or single content sections
- Consistent internal padding from spacing scale
- Subtle border, optional hover elevation for interactive cards

### Forms

- Label always visible (no placeholder-only)
- Error shown below field with icon + text
- Required indicator visible
- Disabled state explains why unavailable

---

## 8. States

### Interactive States

| State | Visual Change |
|---|---|
| Default | Base appearance |
| Hover | Subtle background/color shift |
| Focus | Visible focus ring (mandatory) |
| Active | Darker shade |
| Disabled | Reduced opacity, no pointer events |
| Loading | Spinner + reduced opacity |
| Error | Danger border + message |

### Data States (Pages)

| State | Behavior |
|---|---|
| Loading | Skeleton or spinner |
| Empty | Helpful message + action |
| Error | Error message + retry |
| Offline | Cached data or explicit message |
| Partial | Show what's available |

---

## 9. Accessibility Requirements

- WCAG 2.2 AA compliance
- Keyboard navigation everywhere (including admin composer)
- Focus indicators visible on all interactive elements
- Touch targets minimum 44x44px
- Screen reader: correct headings, landmarks, ARIA labels
- Color never sole indicator
- `prefers-reduced-motion` respected
- RTL/LTR: logical CSS, correct lang/dir attributes

---

## 10. Anti-Patterns (Explicitly Prohibited)

- ❌ Raw hex/color values in component code
- ❌ Glassmorphism, decorative gradients, glow effects
- ❌ Excessive cards around everything
- ❌ Arbitrary shadows without semantic justification
- ❌ Generic AI-generated UI appearance
- ❌ Placeholder content presented as real
- ❌ Skills progress bars without verifiable data
- ❌ Hero areas with only decorative content
- ❌ Autoplay carousels
- ❌ Scroll hijacking
- ❌ Motion that doesn't respect reduced-motion
- ❌ Dark mode implementation (deferred, not approved for MVP)
- ❌ Multiple competing design token files
- ❌ Emoji as structural icons
