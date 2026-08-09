# CMS Composer block catalog

This is the canonical authoring catalog for the 16 registered Composer blocks. The authoritative validation source is `backend/apps/cms/block_registry.py` (`BLOCK_SCHEMAS`); `frontend/src/components/admin/composer/block-defaults.ts` supplies new-block defaults and the Inspector/preview/public renderer must remain aligned with both.

## Locale and compatibility contract

- Canonical schemas are locale-neutral: the public API returns settings projected for the requested `fa` or `en` locale, never a cross-locale fallback.
- `hero` and `text` are the only accepted legacy bilingual settings shapes. New Canvas defaults currently preserve those editable shapes: `heading_fa`/`heading_en` and `body_fa`/`body_en`. `is_legacy_localized_settings()` accepts them narrowly and `public_block_settings()` projects them to canonical `title`/`subtitle`/`cta_label` and `content` fields for one locale.
- Canonical `hero` (`title`, `subtitle`, `cta_label`, `cta_url`, `media_id`) and canonical `text` (`content`, `alignment`) are distinct from those legacy shapes. They must not be mixed in one settings object.
- The other 14 blocks have no block-local bilingual fields. Their strings belong to the page composition being authored and are returned unchanged for that page locale.

## Registered blocks and defaults

| Block | New-block defaults | Backend schema summary | Locale fields | Media / URL policy |
|---|---|---|---|---|
| `hero` | legacy: `heading_fa/en: ""`, `subheading_fa/en: ""`, `cta_text_fa/en: ""`, `cta_link: ""`, `media_id: null` | canonical requires string `title`; optional nullable `subtitle`, `cta_url`, `cta_label`, UUID `media_id`; no extra fields. Narrow legacy shape is also accepted. | Legacy fields are independently editable and projected to canonical fields for the requested locale. | `media_id` must be an active MediaAsset UUID. `cta_url` or legacy `cta_link` must be an internal path or absolute HTTPS URL. |
| `text` | legacy: `body_fa/en: ""`, `alignment: "start"` | canonical requires string `content` and `alignment` in `start/center/end`; no extra fields. Narrow legacy shape is also accepted. | Legacy `body_fa` and `body_en` are independent and project to canonical `content`. | No media or URL field. Raw HTML is rejected by composition/template validation and is never rendered as an HTML sink. |
| `gallery` | `media_ids: []`, `layout: "grid"` | requires UUID array and `layout` in `grid/carousel`; no extra fields. | None. Media alt/caption comes from the requested-locale MediaAsset projection. | Every ID must identify an active MediaAsset; clients do not supply media URLs. |
| `cta` | `label: ""`, `url: "/"`, `variant: "primary"` | requires strings `label`, `url`, and `variant` in `primary/secondary`; no extra fields. | None. | `url` must be an internal path or absolute HTTPS URL. |
| `collection` | `source: "portfolio"`, `filter: {}`, `limit: 6`, `order: "default"` | source allowlist; source-specific typed filter; limit 1–12; optional order `default/newest/oldest`; no extra fields. | None; collection resolvers project only requested-locale published records. | No caller-owned media/URL. Resolved records use safe public paths and active localized media. |
| `quote` | `text: ""`, `attribution: null` | requires string `text`; nullable string attribution; no extra fields. | None. | No media or URL field; raw HTML is rejected. |
| `divider` | `style: "line"` | requires `style` in `line/space/dots`; no extra fields. | None. | No media or URL field. |
| `research_focus` | `title: ""`, `description: ""`, `icon: null` | requires string title/description; nullable string icon; no extra fields. | None. | `icon` is a symbolic value, not a raw HTML or URL slot. |
| `scroll_reveal` | title/description plus animation defaults (`duration: 600`, `delay: 0`, `easing: "ease-out"`, `trigger: "scroll"`), direction `"up"` | title required; nullable description; direction allowlist; common bounded duration/delay and easing/trigger allowlists. | None. | No media or URL field. |
| `parallax` | `title: ""`, `subtitle: null`, `media_url: null`, `speed: 0.5`, animation defaults | title required; nullable subtitle/media URL; speed -2…2; common animation constraints. | None. | Non-empty `media_url` must be an internal path or absolute HTTPS URL; it is not a MediaAsset reference. |
| `text_stagger` | `content: ""`, `stagger_delay: 50`, animation defaults | content max 500; stagger delay 10–500; common animation constraints. | None. | No media or URL field; raw HTML is rejected. |
| `fade_in_sequence` | `items: []`, animation defaults | string array plus common animation constraints. | None. | No media or URL field; item strings are content, not HTML. |
| `hover_card` | `title: ""`, `description: ""`, `icon: null`, `hover_effect: "lift"`, animation defaults | title/description required; description max 500; nullable icon; effect allowlist; common animation constraints. | None. | `icon` is symbolic; no media or URL field. |
| `counter_animation` | `label: ""`, `target_number: 0`, `suffix: null`, animation defaults | label and integer target required; nullable suffix; common animation constraints. | None. | No media or URL field. |
| `image_reveal` | `media_url: ""`, `alt: null`, `reveal_direction: "left"`, animation defaults | media URL required; nullable alt; direction allowlist; common animation constraints. | None. `alt` is the authored page-locale alternative text. | `media_url` must be an internal path or absolute HTTPS URL; it is not a MediaAsset ID. |
| `section_transition` | `transition_type: "fade"`, animation defaults | transition in `fade/slide/zoom/clip`; common animation constraints. | None. | No media or URL field. |

Common animation constraints are: integer `duration` 50–3000 ms, integer `delay` 0–2000 ms, easing in `ease-in/ease-out/ease-in-out/linear/spring/cubic-bezier`, and trigger in `scroll/load/hover/click`. Unknown block types/settings and non-contiguous ordering fail closed with Problem Details; public serialization suppresses unknown or invalid stored blocks.
