# پلن پیاده‌سازی Advanced Visual Page Builder

## خلاصه پروژه

ریفکتور و ارتقای سامانه CMS/Page Builder فعلی بر اساس [Blueprint فنی](file:///d:/Project/Taha/tahamohamadi-website/docs/new%20page%20builder/advanced_visual_page_builder_architecture_blueprint_fa.md) با معماری **Core-owned Hybrid**. هدف: تبدیل سیستم فعلی (Section/Block ساده) به یک Visual Page Builder حرفه‌ای با Normalized Node Model، Command Engine، iframe Canvas، Design Tokens و Plugin SDK.

---

## تحلیل وضعیت فعلی (Gap Analysis)

### آنچه داریم

| لایه | وضعیت فعلی | فایل‌های کلیدی |
|---|---|---|
| **Backend Models** | `Page → Section → Block` ساختار خطی | [models.py](file:///d:/Project/Taha/tahamohamadi-website/backend/apps/cms/models.py) |
| **Block Registry** | JSON Schema validation با ≈16 block type | [block_registry.py](file:///d:/Project/Taha/tahamohamadi-website/backend/apps/cms/block_registry.py) |
| **Validation** | composition validation + URL safety | [services.py](file:///d:/Project/Taha/tahamohamadi-website/backend/apps/cms/services.py) |
| **API** | REST ModelViewSet + optimistic locking | [views.py](file:///d:/Project/Taha/tahamohamadi-website/backend/apps/cms/views.py) |
| **Frontend Composer** | DnD-based SortableSection/SortableBlock | [composer/](file:///d:/Project/Taha/tahamohamadi-website/frontend/src/components/admin/composer) |
| **Block Renderer** | Component-per-block-type rendering | [BlockRenderer.tsx](file:///d:/Project/Taha/tahamohamadi-website/frontend/src/components/blocks/BlockRenderer.tsx) |
| **Editor** | Article rich text editor (Tiptap-based) | [editor/](file:///d:/Project/Taha/tahamohamadi-website/frontend/src/components/admin/editor) |
| **Templates** | Portable manifest system | [TemplatePanel.tsx](file:///d:/Project/Taha/tahamohamadi-website/frontend/src/components/admin/composer/TemplatePanel.tsx) |
| **Preview** | Draft preview panel | [PreviewPanel.tsx](file:///d:/Project/Taha/tahamohamadi-website/frontend/src/components/admin/composer/PreviewPanel.tsx) |

### آنچه نداریم (بر اساس Blueprint)

| قابلیت | Gap | اولویت |
|---|---|---|
| **Normalized Node Model** | فعلی: Section→Block خطی. نیاز: `nodes{}` flat با slots | 🔴 Critical |
| **Page Schema v1** | فعلی: relational sections/blocks. نیاز: JSONB document | 🔴 Critical |
| **Command Engine** | فعلی: مستقیم state mutation. نیاز: CommandBus + patches | 🔴 Critical |
| **History (Undo/Redo)** | وجود ندارد | 🔴 Critical |
| **iframe Canvas** | فعلی: inline DOM. نیاز: same-origin iframe | 🟡 High |
| **Style Engine** | فعلی: hardcoded per block. نیاز: token-based styles | 🟡 High |
| **Design Token System** | وجود ندارد | 🟡 High |
| **Responsive/Breakpoint** | وجود ندارد (ردیف تکی) | 🟡 High |
| **Component Registry (TS)** | فعلی: Python-only block_registry. نیاز: TS defineComponent | 🟡 High |
| **Interaction DSL** | وجود ندارد | 🟢 Medium |
| **Animation DSL** | فعلی: block-level animations. نیاز: library-neutral DSL | 🟢 Medium |
| **Data Binding DSL** | وجود ندارد | 🟢 Medium |
| **Expression Engine** | وجود ندارد | 🟢 Medium |
| **Plugin SDK** | وجود ندارد | 🟢 Medium |
| **Autosave + Revision** | فعلی: manual save. نیاز: debounced autosave | 🟢 Medium |
| **PageDraft / PageVersion** | فعلی: single status field. نیاز: Draft + immutable Version | 🟡 High |
| **Publishing Pipeline** | فعلی: status toggle. نیاز: validation → render → CDN | 🟢 Medium |
| **RBAC granular** | فعلی: role-based. نیاز: resource-level capabilities | 🔵 Low |
| **Collaboration** | وجود ندارد | 🔵 Low (Phase 9) |
| **AI Integration** | وجود ندارد | 🔵 Low (Phase 10) |

---

## تصمیمات طراحی کلیدی

> [!IMPORTANT]
> ### استراتژی مهاجرت: Parallel + Gradual Migration
> سیستم فعلی (Section/Block) را **نمی‌شکنیم**. Page Builder جدید در مسیر جداگانه `/admin/builder/` ساخته می‌شود. صفحات قبلی با renderer قدیمی خوانده می‌شوند. پس از تثبیت، migration tool برای تبدیل صفحات قدیم به schema جدید نوشته می‌شود.

> [!IMPORTANT]
> ### Source of Truth
> `Page Schema (JSONB)` تنها Source of Truth محتوای Page Builder است — نه HTML، نه DOM، نه React Tree.

> [!WARNING]
> ### Scope Control
> طبق Blueprint (Part 65)، این‌ها را در MVP **نمی‌سازیم**: full CRDT collaboration, arbitrary JS, WebGL canvas, marketplace, AI generation, advanced GSAP timeline, multi-framework renderer.

---

## Open Questions

> [!IMPORTANT]
> **1. استراتژی Migration داده‌های فعلی**
> آیا صفحات فعلی (Section/Block) باید به schema جدید migrate شوند، یا سیستم قدیم کنار جدید کار کند تا صفحات جدید فقط با Builder ساخته شوند؟

> [!IMPORTANT]
> **2. Monorepo vs Single Package**
> Blueprint پیشنهاد monorepo با packages مجزا دارد (Part 60). آیا با ساختار فعلی Next.js `frontend/src/` ادامه دهیم با folder boundaries، یا به monorepo واقعی (Turborepo) مهاجرت کنیم؟

> [!IMPORTANT]
> **3. اولویت‌بندی Phase ها**
> آیا ترتیب Phase 0→10 Blueprint مورد تأیید است، یا اولویت متفاوتی دارید؟ (مثلاً Style Engine قبل از Component Ecosystem)

---

## Proposed Changes — فاز‌بندی

---

### 🏗️ Phase 0 — Architecture Spike (Proof of Concept)

**هدف:** اثبات معماری Core-owned Hybrid با 10 کامپوننت ساده

---

#### Backend

##### [NEW] `backend/apps/pages/` — Django app جدید

- **models.py**: مدل‌های `BuilderPage`, `BuilderPageDraft`, `BuilderPageVersion` طبق Part 36 Blueprint
  - `BuilderPageDraft.schema` → JSONB (Normalized Node Model)
  - `BuilderPageDraft.revision` → optimistic concurrency
  - `BuilderPageVersion` → immutable snapshots
- **serializers.py**: DRF serializers for new page schema
- **views.py**: REST API endpoints (Part 59)
  - `GET/POST /api/v1/builder/pages`
  - `GET/PATCH /api/v1/builder/pages/{id}/draft`
  - `POST /api/v1/builder/pages/{id}/validate`
- **schema_validator.py**: JSON Schema validation (Ajv-compatible schemas in Python via jsonschema)
- **migrations/**: Initial migration

##### [MODIFY] `backend/config/urls.py`
- اضافه کردن URL patterns برای app جدید

---

#### Frontend — Core Packages (folder-based boundaries)

##### [NEW] `frontend/src/builder/schema/`
- **document.ts**: `PageDocument`, `PageNode` TypeScript interfaces (Part 10)
- **node-types.ts**: Node type constants (namespaced: `core.page`, `layout.section`, `content.heading`, `ui.button`)
- **validation.ts**: Zod schemas for client-side validation
- **migrations.ts**: Schema migration chain stub

##### [NEW] `frontend/src/builder/core/`
- **command-bus.ts**: Command Engine (Part 30) — `execute()`, `validate()`, `apply()`, `patch/inversePatch`
- **commands/**: Individual command implementations (`node.insert`, `node.delete`, `node.updateProps`, `node.move`)
- **history.ts**: History Engine (Part 32) — undo/redo stack with coalescing
- **selection.ts**: Selection state management
- **clipboard.ts**: Copy/paste operations
- **events.ts**: EventBus for internal communication

##### [NEW] `frontend/src/builder/state/`
- **document-store.ts**: Zustand store for normalized document state
- **editor-store.ts**: Zustand store for editor session state (selection, hover, drag, zoom)
- **store-types.ts**: Store type definitions

##### [NEW] `frontend/src/builder/registry/`
- **component-registry.ts**: `defineComponent()` API (Part 12)
- **registry-types.ts**: Component definition types
- **built-in/**: Initial 10 components:
  - `core.page`, `layout.section`, `layout.container`, `layout.box`
  - `content.heading`, `content.text`, `content.paragraph`
  - `ui.button`, `media.image`, `layout.spacer`

##### [NEW] `frontend/src/builder/canvas/`
- **canvas-frame.tsx**: Same-origin iframe wrapper (Part 26)
- **bridge.ts**: MessageChannel protocol (SELECT, HOVER, RECT_CHANGED, DROP_TARGET, SCROLL)
- **canvas-renderer.tsx**: React renderer inside iframe
- **selection-overlay.tsx**: Visual selection/hover indicators

##### [NEW] `frontend/src/builder/renderer/`
- **node-renderer.tsx**: Deterministic React renderer from schema
- **runtime-resolver.ts**: Resolves node type → React component from registry

##### [NEW] `frontend/src/builder/editor/`
- **editor-shell.tsx**: Main editor layout (canvas + panels)
- **layers-panel.tsx**: Node tree navigator
- **inspector-panel.tsx**: Property inspector
- **toolbar.tsx**: Editor toolbar (undo, redo, preview, breakpoints, save)

##### [NEW] `frontend/src/app/admin/(dashboard)/builder/`
- **page.tsx**: Builder pages list
- **[id]/page.tsx**: Builder editor page (mounts EditorShell)

---

#### Acceptance Criteria (Phase 0)

```
✅ 100 nodes — nested slots — drag/drop — resize
✅ Undo/redo works correctly
✅ Save → reload → identical render
✅ Schema roundtrip: frontend → API → DB → API → frontend
✅ No architecture-specific hacks
```

---

### 📐 Phase 1 — Editor Kernel

**بر Phase 0 سوار می‌شود**

##### [MODIFY] `frontend/src/builder/core/`
- Refine command granularity
- Multi-selection support
- Keyboard shortcuts (Ctrl+Z, Ctrl+C, Delete, etc.)
- Transient drag/resize states (Part 31)

##### [NEW] `frontend/src/builder/canvas/dnd/`
- **dnd-adapter.ts**: dnd-kit port/adapter (Part 4 — Adapter Pattern)
- **drop-indicators.tsx**: Visual drop zone indicators
- **drag-preview.tsx**: Ghost preview during drag

##### [NEW] `frontend/src/builder/canvas/geometry/`
- **geometry-service.ts**: hitTest, getRect, nearestEdges (Part 16)
- **resize-adapter.ts**: Moveable port/adapter

##### [MODIFY] Backend autosave
- **`PATCH /api/v1/builder/pages/{id}/draft`**: Accept `baseRevision` + `patches[]` (Part 33)
- 409 Conflict on revision mismatch
- IndexedDB recovery on frontend (`draft-recovery.ts`)

##### Acceptance
```
✅ 500-node benchmark — no full-document rerender
✅ Stable undo/redo across complex operations
✅ Crash recovery via IndexedDB
```

---

### 🎨 Phase 2 — Layout + Style + Responsive

##### [NEW] `frontend/src/builder/style-engine/`
- **style-resolver.ts**: Style Resolution chain (Part 17)
- **css-compiler.ts**: Schema → generated CSS + CSS variables (Part 19)
- **pseudo-states.ts**: hover, focus, active support (Part 20)

##### [NEW] `frontend/src/builder/responsive/`
- **breakpoints.ts**: Breakpoint definitions + overrides (Part 17)
- **responsive-store.ts**: Active breakpoint in editor session
- **viewport-controls.tsx**: Desktop/tablet/mobile switcher

##### [NEW] `frontend/src/builder/tokens/`
- **token-store.ts**: Design token storage/resolution (Part 18)
- **token-editor.tsx**: Visual token editor panel
- **default-tokens.ts**: Default color/spacing/typography tokens

##### Acceptance
```
✅ Landing page ساخته شود بدون Custom CSS
✅ 3 breakpoint (desktop/tablet/mobile) تغییر layout بدهد
✅ Token change → همه node‌های وابسته update شوند
```

---

### 🧩 Phase 3 — Component Ecosystem

##### [MODIFY] `frontend/src/builder/registry/built-in/`
- اضافه شدن 30-40 core component (Part 14):
  - Layout: Grid, Columns, Flex, Stack, Masonry, Divider, AspectRatio
  - Typography: RichText, Blockquote, List, Code, Badge
  - Media: Video, Gallery, Carousel, Icon, Avatar
  - UI: Card, Tabs, Accordion, Modal, Tooltip, Dropdown
  - Navigation: Navbar, Breadcrumb, Footer
  - Forms: Form, Input, Select, Checkbox, Switch, Submit

##### [NEW] `frontend/src/builder/richtext/`
- **richtext-adapter.ts**: Tiptap port/adapter (Part 6 — Rich Text)
- **richtext-node.tsx**: RichText component that wraps Tiptap editor in builder context

##### [NEW] `frontend/src/builder/plugin-sdk/`
- **plugin-types.ts**: `BuilderPlugin` interface (Part 48)
- **plugin-context.ts**: `PluginContext` implementation
- **plugin-registry.ts**: Plugin lifecycle management

##### Acceptance
```
✅ Developer بتواند بدون تغییر Editor Core یک Component جدید اضافه کند
✅ Component migration (v1→v2) بدون data loss
```

---

### 🎭 Phase 4 — Design System

##### [NEW] `frontend/src/builder/design-system/`
- **themes.ts**: Theme management
- **global-classes.ts**: Reusable style classes
- **variants.ts**: Component variant system (Part 43)

##### [NEW] `frontend/src/builder/symbols/`
- **symbol-service.ts**: Global components (Part 42)
- **symbol-instance.tsx**: Symbol instance renderer with overrides
- **detach.ts**: Symbol detach operation

##### [NEW] Backend `backend/apps/themes/`
- Theme, DesignTokenSet, GlobalComponent, GlobalComponentVersion models

##### Acceptance
```
✅ Navbar global تغییر کند → همه instance‌ها update شوند
✅ Theme switch → همه token‌ها تغییر کنند
```

---

### 📊 Phase 5 — Dynamic Data

##### [NEW] `frontend/src/builder/data/`
- **bindings.ts**: Data Binding DSL (Part 23)
- **expressions.ts**: Safe Expression Engine (Part 22) — JSONLogic-like, no eval
- **queries.ts**: Query DSL (Part 24)
- **repeater.tsx**: Collection/Repeater component

##### [NEW] Backend `backend/apps/data_sources/`
- DataSource registry model
- `register_data_source()` API (Part 24)
- Query AST → Django ORM translator
- `POST /api/v1/queries/validate`, `POST /api/v1/queries/preview`

##### Acceptance
```
✅ Product Listing + Detail فقط با Builder ساخته شود
✅ Repeater با dynamic query data render کند
```

---

### ✨ Phase 6 — Interactions + Animation

##### [NEW] `frontend/src/builder/interactions/`
- **interaction-dsl.ts**: Trigger → Condition → Action model (Part 21)
- **trigger-registry.ts**: Built-in triggers (click, hover, scroll, viewport)
- **action-registry.ts**: Built-in actions (navigate, modal, state, animation)

##### [NEW] `frontend/src/builder/animations/`
- **animation-dsl.ts**: Library-neutral animation schema (Part 7)
- **animation-compiler.ts**: DSL → CSS/WAAPI/Motion/GSAP
- **motion-adapter.ts**: Motion library port
- **gsap-adapter.ts**: GSAP port (future)

##### Acceptance
```
✅ Landing page حرفه‌ای با Scroll/Hover/Timeline بدون Custom JS
```

---

### 🚀 Phase 7 — Production Renderer

##### [NEW] `render-service/` (or `frontend/src/builder/publish/`)
- **ssr-renderer.ts**: Server-side rendering from schema
- **css-compiler.ts**: Production CSS output
- **asset-manifest.ts**: Asset collection + CDN mapping
- **seo-renderer.ts**: Meta tags, JSON-LD, Open Graph

##### [MODIFY] Backend `backend/apps/pages/`
- Publishing workflow: Draft → Review → Approved → Published → Archived (Part 38)
- `POST /api/v1/builder/pages/{id}/publish`
- `POST /api/v1/builder/pages/{id}/schedule`
- RenderArtifact model for compiled output
- Rollback via release pointer switch

##### Acceptance
```
✅ Published page هیچ Editor dependency لود نکند
✅ Lighthouse score ≥ 90 for published pages
```

---

### 🔒 Phase 8 — Hardening

- Granular RBAC (Part 47): `page.create`, `component.editStyle`, `plugin.install`, etc.
- CSP headers + Trusted Types
- SVG sanitization pipeline
- Accessibility audit integration (Part 55)
- RTL / CSS Logical Properties (Part 56)
- SEO validation (Part 57)
- Observability + telemetry (Part 58)
- AuditLog model

---

### 👥 Phase 9 — Collaboration (Future)

- Comments system
- Presence awareness
- Component locking
- Yjs + Django Channels adapter

---

### 🤖 Phase 10 — AI (Future)

- AI → Command API (never direct schema mutation)
- Layout generation
- Copy suggestions
- Accessibility audit

---

## Verification Plan

### Automated Tests

```bash
# Backend
cd backend && python -m pytest apps/pages/ -v

# Frontend unit/integration
cd frontend && npx vitest run src/builder/

# E2E
cd e2e && npx playwright test builder/
```

### Performance Benchmarks
- 100 nodes: Phase 0 acceptance
- 500 nodes: Phase 1 acceptance  
- 1000 nodes: Phase 2+ stress test

### Manual Verification
- ساخت Landing Page واقعی با Builder
- Test undo/redo across complex operations
- Verify schema roundtrip (save → reload)
- Published page بدون editor JS

---

## جمع‌بندی

| Metric | Value |
|---|---|
| **Total Phases** | 11 (Phase 0–10) |
| **MVP Phases** | 0–3 (Core Builder قابل استفاده) |
| **Estimated Scope Phase 0** | ~40 files, ~5000 LoC |
| **معماری** | Core-owned Hybrid |
| **Backward Compatible** | ✅ سیستم فعلی CMS دست‌نخورده باقی می‌ماند |
| **Migration Path** | Parallel → Gradual migration tool |
