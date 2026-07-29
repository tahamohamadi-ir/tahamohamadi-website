# 09 — Interaction and page states

**UX-STATE-001 — Canonical taxonomy.** This is sole authoritative state model. A page/component declares only applicable states; absence is `NOT APPLICABLE`, never an unexplained blank.

| State | Meaning and required treatment | Typical applicability |
|---|---|---|
| Loading | Initial data wait; skeleton matches eventual hierarchy and reserves layout. | API-backed read |
| Empty | Successful response without records; explain absence and safe next action. | Collections / optional sections |
| Recoverable failure | Request failed with usable recovery; retain context and offer safe retry. | API-backed read/mutation |
| Offline | Network unavailable; persistent unobtrusive notice, retry after connectivity. | API-backed read/mutation |
| Stale | Previously rendered data may remain visible with clear age/refresh state; never present stale as current. | Only if cache exists; otherwise NOT APPLICABLE |
| Unavailable translation | Requested locale lacks content; localized explanation and API-provided alternate only. | Localized CMS content |
| Not found | Route/resource unknown; localized recovery to known destination. | Catch-all / missing resource |
| Submitting | Mutation active; prevent duplicate action without hiding entered data. | Contact/mutation |
| Validation | Safe field errors plus summary/recovery. | Form |
| Disabled | Temporarily unavailable control, with semantic disabled state and reason where needed. | Controls |
| Read-only | Value visible but not editable; distinct from disabled. | Future admin / applicable forms |
| Success | Completed action; concise receipt, keyboard continuity, no sensitive echo. | Contact/mutation |
| Unauthorized | Authentication needed; explain safe next step, do not reveal protected data. | Protected route/action; public reads normally NOT APPLICABLE |
| Forbidden | Authenticated action denied, including CSRF failure; retain safe input and recovery. | Contact/mutation as applicable |
| Destructive confirmation | Explicit confirm/cancel before irreversible action. | Future admin; public M1 usually NOT APPLICABLE |

**UX-STATE-002 — State priority.** Unavailable translation and not-found replace content. Loading replaces no prior data; stale may keep prior data. Submitting overlays valid editable state. Validation/refusal keeps input. Offline describes transport, not content absence.

**UX-STATE-003 — Feedback integrity.** Controls have visible labels, semantic selected/disabled/read-only state, 44px target, and non-layout-shifting feedback. One primary action per context; destructive action is separate and confirmed. Motion communicates state, remains interruptible, uses performant properties, and respects reduced motion.
