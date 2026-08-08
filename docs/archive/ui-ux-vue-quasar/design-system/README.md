# Design-system governance and legacy migration

Implementation-facing index. This directory owns visual-system semantics and component contracts without copying executable values. Runtime values, breakpoints, and custom properties are owned only by [`../../../frontend/src/css/tokens.scss`](../../../frontend/src/css/tokens.scss).

| Need | Canonical file |
|---|---|
| Direction, semantic visual roles, icon decision | [foundations.md](foundations.md) |
| Runtime-token consumption and change control | [tokens.md](tokens.md) |
| Locale typography and technical text | [typography.md](typography.md) |
| Responsive grid, measure, directional layout | [layout-grid.md](layout-grid.md) |
| Component contracts and hierarchy | [components.md](components.md) |
| Reusable page/content patterns | [patterns.md](patterns.md) |
| Prohibited visual/structural patterns | [anti-patterns.md](anti-patterns.md) |

**UX-DS-GOV-001 — Semantic consumption.** Components consume semantic roles/contracts. Visual literals do not enter component source. A new token, font delivery, dark theme, Quasar mapping, or component primitive needs applicable decision and evidence before approval.

**UX-DS-GOV-002 — Division of responsibility.** This directory owns visual semantics. [09](../09-interaction-and-page-states.md) owns state definitions, [07](../07-accessibility.md) owns accessibility requirements, [10](../10-visual-qa.md) owns review procedure, and [13](../13-decision-register.md) owns decisions.

## Legacy design-system inventory and mapping

Former `docs/frontend/design-system.md` was reduced to a compatibility redirect. Every legacy set remains mapped once below; mapping is traceability, not a second normative source.

| Legacy set | Canonical destination |
|---|---|
| L-01 design goals | 01, 02, 07, 08 |
| L-02 audiences | 01 |
| L-03 visual direction/dark exclusion | foundations, anti-patterns, 13 |
| L-04 public layout/shell | 02, 04, layout-grid |
| L-05 admin layout boundary | 02, 13 |
| L-06 grid/gutters/measure | layout-grid, 06 |
| L-07 semantic colour/status | foundations, tokens, 07 |
| L-08 locale typography | typography, 05 |
| L-09 spacing/radius/elevation/motion | tokens, layout-grid, 09 |
| L-10 Quasar mapping | foundations, tokens |
| L-11 custom-property mapping | tokens |
| L-12 component rules | components, patterns |
| L-13 button hierarchy | components |
| L-14 form validation | components, 07, 09 |
| L-15 status/feedback | patterns, 09 |
| L-16 content presentation | 04, patterns |
| L-17 accessibility baseline | 07 |
| L-18 contrast | 07, 10 |
| L-19 keyboard/focus | 03, 07 |
| L-20 reduced motion | 07, 09 |
| L-21 RTL/LTR | 05, 06 |
| L-22 bidirectional content | 05 |
| L-23 responsive behaviour | 06, 10 |
| L-24 data states | 09, patterns |
| L-25 anti-patterns | anti-patterns |
| L-26 review checklist | 10 |
| L-27 open decisions | 13 |

Migration status: complete. All 27 legacy rule sets map to canonical owners; no executable token values are duplicated; compatibility redirect remains non-normative.
