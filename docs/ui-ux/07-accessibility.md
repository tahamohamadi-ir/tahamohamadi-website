# 07 — Accessibility

**UX-A11Y-001 — AA baseline.** Public M1 targets WCAG 2.2 AA intent: one `main` landmark, one H1, sequential headings, semantic regions, descriptive localized links, and SSR-readable text. `PublicLayout` is the sole owner of `main#main-content`; its children do not create another main or `q-page`.

**UX-A11Y-002 — Keyboard and focus.** Every action is keyboard-operable without hover-only or gesture-only dependence. Tab order follows visual order. Skip link focuses main content; route changes focus main; visible focus survives all themes/states; interactive targets meet the implementation minimum of 44px.

**UX-A11Y-003 — Overlays.** Drawer, menu, and dialog require accessible name, focus containment, a visible close control, Escape where applicable, and focus restoration to trigger. Route navigation initiated from drawer also closes it without losing keyboard continuity.

**UX-A11Y-004 — Forms.** Inputs use persistent labels and suitable semantics. Validation identifies cause and recovery near the field, announces errors, focuses first invalid field after failed submit, preserves recoverable input, and provides linked summary for multi-field errors. Disabled, read-only, submitting, unauthorized, and forbidden states are distinct; no state is colour-only.

**UX-A11Y-005 — Perception and reflow.** Meaningful images have localized alternatives; decorative images use empty alternatives. Status/selection/validation pair colour with text or icon. Reduced motion, text scaling, wrapping, 200% zoom, and reflow are supported. Captions/transcripts are FUTURE unless media contract requires them.

Current shell has checked-in specifications for skip-link, one main, locale direction, 44px token, and reduced-motion safeguards. Overlay, page content, media, form, and assistive-technology browser evidence are PLANNED.
