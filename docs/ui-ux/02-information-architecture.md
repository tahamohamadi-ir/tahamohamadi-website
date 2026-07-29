# 02 — Information architecture

**UX-IA-001 — Route inventory.** This table is the complete public route inventory from `frontend/src/router/routes.js`. `/admin` exists in source but is outside public M1 and is not a public route.

| Route | Current component role | State | API operation when integrated |
|---|---|---|---|
| `/` | Redirect to language choice | CURRENT / TESTED | NO API REQUIRED |
| `/language` | Language choice | CURRENT / TESTED | NO API REQUIRED |
| `/{lang}` | Localized home | CURRENT shell; page integration PLANNED | `getHome(lang)` |
| `/{lang}/about` | Profile page | CURRENT route shell; integration PLANNED | `getPage(lang, 'about')` |
| `/{lang}/research` | Research page | CURRENT route shell; integration PLANNED | `getPage(lang, 'research')` |
| `/{lang}/skills` | Skills page | CURRENT route shell; integration PLANNED | `getSkills(lang)` |
| `/{lang}/resume` | Resume page | CURRENT route shell; integration PLANNED | `getResume(lang)` |
| `/{lang}/blog` | Post list | CURRENT route shell; integration PLANNED | `listPosts(lang, params)` |
| `/{lang}/blog/:slug` | Post detail | CURRENT route shell; integration PLANNED | `getPost(lang, slug)` |
| `/{lang}/portfolio` | Project list | CURRENT route shell; integration PLANNED | `listPortfolio(lang, params)` |
| `/{lang}/portfolio/:slug` | Project detail | CURRENT route shell; integration PLANNED | `getProject(lang, slug)` |
| `/{lang}/publications` | Publication list | CURRENT route shell; integration PLANNED | `listPublications(lang, params)` |
| `/{lang}/publications/:slug` | Publication detail | CURRENT route shell; integration PLANNED | `getPublication(lang, slug)` |
| `/{lang}/contact` | Contact page | CURRENT route shell; form integration PLANNED | `submitContact(payload)` |
| `/{lang}/translation-unavailable` | Localized recovery | CURRENT / TESTED shell | NO API REQUIRED; entered from API error handling |
| localized catch-all | Localized not-found | CURRENT / TESTED shell | NO API REQUIRED |

`lang` is only `fa` or `en`. The source routes map Persian to RTL and English to LTR. Route components for CMS-backed destinations are placeholders; this suite must not describe their content as implemented.

**UX-IA-002 — Public orientation.** `PublicLayout` owns the persistent header, footer, skip link, and only `main#main-content`. Desktop and drawer navigation preserve localized home, profile/research/resume, content, language, and contact paths.

**UX-IA-003 — Admin boundary.** Admin IA, editor flow, dashboard metrics, media browser, theme/menu controls, and admin localization are FUTURE. Accepted backend capability is not a frontend specification.

**UX-IA-004 — Route/API distinction.** Public UI paths (`/blog`) and backend resource paths (`/posts`) are separate contracts. Never derive one from the other. A returned `canonicalPath` or `hreflang` value may be used only after the page's route/SEO integration verifies it represents the rendered public URL.
