# Backlog and Technical Debt

**Created:** 2026-08-09

This document tracks items that were deferred from the primary MVP development cycles (P2/P3 tasks) to ensure the project ships as quickly as possible without losing track of important improvements.

## 1. Technical Debt

- **Full test coverage for CMS views**: We have basic unit tests but need E2E tests for the `BlockInspector` and localized nested block data updates.
- **Refactoring of BlockInspector**: The file is quite large. Consider breaking it down into smaller components (e.g. `editors/HeroEditor.tsx`, `editors/TextEditor.tsx`).

## 2. Deferred P2/P3 Tasks

### Accessibility Audit (P2)
- **Goal**: Perform a comprehensive WCAG 2.1 AA audit of the live production site.
- **Tasks**:
  - Run Lighthouse accessibility checks in CI pipeline.
  - Test screen-reader compatibility with Composer blocks (specifically nested galleries and complex animations).
  - Verify focus traps inside all custom admin modals.
- **Status**: Deferred to post-launch optimization sprint.

### Performance Budget (P3)
- **Goal**: Establish and enforce performance budgets for the frontend Next.js app.
- **Tasks**:
  - Set limits for First Contentful Paint (FCP) and Largest Contentful Paint (LCP) in `vitest`/Lighthouse CI.
  - Establish a strict limit on initial JavaScript bundle sizes (e.g. <150KB for standard pages).
  - Add build-time warnings for asset sizes in `next.config.ts`.
- **Status**: Deferred to post-launch optimization sprint.
