# UI/UX documentation

Canonical project-wide UI/UX suite for M1 public frontend. It records approved intent, evidence, ownership, and implementation gates. It does not create CMS facts, token values, API fields, visual assets, or completed pages.

## Precedence and authority

When sources disagree, apply this order: accepted ADR and accepted backend contract; controlling plan `plans/008-public-frontend-mvp.md`; repository rules; executable source and tests for current behaviour; this suite for UI/UX semantics and delivery constraints. A higher source wins; record unresolved conflict in [13](13-decision-register.md), never silently reconcile it in UI.

| Authority | Owns | Does not own |
|---|---|---|
| Accepted contracts, ADRs, rules, plan | Scope, API facts, architecture, acceptance boundary | Component styling or page copy |
| Executable source and tests | Current runtime behaviour and token values | Approval of a future UX decision |
| This suite | UX semantics, state definitions, component contracts, traceability, gates | Executable CSS values, CMS content, unstated API fields |

Every normative rule has one authoritative home. Other documents link to it as a dependency, not a duplicate rule. `frontend/src/css/tokens.scss` alone owns token values, breakpoints, and custom properties; source alone owns route/component/test implementation.

## State vocabulary

| Label | Meaning | Evidence rule |
|---|---|---|
| CURRENT | Present in source. | Source inspected; not a claim that all routes are integrated. |
| TESTED | Current behaviour has an applicable checked-in test specification. | Test presence, not a test run in this pass. |
| PLANNED | Approved target, not implemented. | Needs RED, GREEN, browser evidence before CURRENT. |
| PROVISIONAL | Direction chosen pending named verification/approval. | Must name review trigger. |
| BLOCKED | Cannot proceed without external decision, asset, or contract. | Do not substitute placeholder production content. |
| FUTURE | Deliberately outside M1. | Requires separate scope. |
| UNRESOLVED | Evidence conflict or missing decision. | Stop affected claim; record owner/trigger. |
| SUPERSEDED | Replaced by named decision. | Link replacement. |
| NO API REQUIRED | Route/feature has no public API dependency. | State why. |
| NOT APPLICABLE | Requirement cannot apply to this route/component. | State why; never leave blank. |

## Canonical ownership map

| Topic | Authoritative document |
|---|---|
| Purpose, audience, content truth | [01](01-experience-principles.md) |
| Route inventory and navigation scope | [02](02-information-architecture.md) |
| Cross-route user outcomes | [03](03-user-journeys.md) |
| Per-route requirements and current state | [04](04-page-specifications.md) |
| Content, locale, bidi, alternates | [05](05-content-and-localization.md) |
| Responsive and directional layout | [06](06-responsive-rtl-ltr.md) |
| Accessibility | [07](07-accessibility.md) |
| SSR, hydration, SEO | [08](08-seo-ssr-hydration.md) |
| Page and component state taxonomy | [09](09-interaction-and-page-states.md) |
| Review procedure and evidence | [10](10-visual-qa.md) |
| Delivery order and Definition of Done | [11](11-implementation-roadmap.md) |
| Traceability and agent handoff | [12](12-agent-handoff-contract.md) |
| Material decisions and open gates | [13](13-decision-register.md) |
| Visual-system semantics | [design-system/README.md](design-system/README.md) |

`docs/frontend/design-system.md` is a compatibility redirect only; it creates no competing rule.
