# Components

**UX-DS-COMP-001 — Contract inventory.** Components below are status-labelled; planned contracts do not claim implementation. State definitions come only from [09](../09-interaction-and-page-states.md).

| Component | Status | Contract / accessibility boundary |
|---|---|---|
| `SiteHeader`, `SiteFooter` | CURRENT / TESTED | Localized persistent navigation; labelled nav; mobile keeps language/contact. |
| `SkipLink` | CURRENT / TESTED | Visible-on-focus link to sole main landmark. |
| `LanguageSwitch` | CURRENT shell; detail alternate propagation PLANNED | Accessible locale control; static target only without content alternate; detail receives API alternate path. |
| `Breadcrumbs` | PLANNED | Deep-route orientation; localized directional order and current-page semantics. |
| `SeoHead` | PLANNED | Consume supported response metadata only; no invented canonical/hreflang/JSON-LD facts. |
| `PageState` | PLANNED | Render applicable canonical state with recovery; no decorative empty-state dependency. |
| `TranslationUnavailable` | PLANNED | Localized unavailable explanation; API alternate only when supplied. |
| `MediaImage` | PLANNED | Stable media area; localized meaningful alt or empty decorative alt; no production placeholder asset. |
| `PaginationControl` | PLANNED | Use only supported list navigation; labelled keyboard controls and directional treatment. |
| `MarkdownContent` | PLANNED / BLOCKED sanitizer | Render only sanitized approved content; semantic prose and technical LTR isolation. |
| `FeaturedList`, `PostCard`, `ProjectCard`, `PublicationItem` | PLANNED | Repeated contract-backed record; stable media/metadata; no invented facts. |
| `SkillGroups`, `ResumeTimeline` | PLANNED | Scannable groups/chronology without card-stack treatment. |
| `ContactForm` | PLANNED | Contract-owned payload; labels, validation/summary, CSRF, single submit, retained recovery. |

**UX-DS-COMP-002 — Control hierarchy.** One primary command per context; secondary/tertiary actions subordinate; destructive action separated and confirmed. Controls expose semantic disabled/read-only/selected states, visible focus, usable target, and non-layout-shifting feedback.

**UX-DS-COMP-003 — Repetition threshold.** Abstract only after repeated behaviour exists. Repeated records use stable media and metadata placement; page sections, prose, citations, and resume chronology are not card stacks.
