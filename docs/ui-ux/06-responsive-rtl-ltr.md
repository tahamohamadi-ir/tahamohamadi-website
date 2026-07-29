# 06 — Responsive RTL/LTR

**UX-RESP-001 — Reflow.** Start with one readable column, add columns only when reading remains clear, and prohibit page-level horizontal overflow. Content must reflow at 200% zoom without loss of task completion or two-dimensional scrolling except where inherently required.

**UX-RESP-002 — Reading layout.** Constrain prose and avoid edge-to-edge Persian paragraphs. Runtime width, gutter, spacing, breakpoint, and safe-area values remain implementation-owned; see [design-system/layout-grid.md](design-system/layout-grid.md).

**UX-RESP-003 — Direction.** Use logical properties and alignment. Mirror directional navigation, pagination, and breadcrumbs. Do not mirror logos, media, code controls, DOI/URL copy controls, or non-directional icons.

**UX-RESP-004 — Mobile shell.** Navigation may become labelled drawer navigation; language and contact remain reachable. Fixed chrome/actions reserve content space. Drawer interaction follows [07](07-accessibility.md).

**UX-RESP-005 — Review set.** Review 375, 768, 1024, and 1440 logical pixels in both locales, including narrow RTL and 200% zoom. Existing Persian shell 375px evidence is TESTED by specification; all CMS route evidence is PLANNED.
