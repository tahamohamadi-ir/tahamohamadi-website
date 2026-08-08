# Task 3b report: complete Composer preview fixture

## Scope

Base inspected: `6d6bd0c77f6b27941a0de17ed5fc50735358ad6a`.

The all-library PreviewPanel fixture retained all 16 Django-registered composer types and their schema-valid defaults. No block type, default, renderer registration, error boundary, dependency, or sample content was changed.

## Diagnosis and repair

The fixture rendered four Framer Motion viewport blocks. In Vitest's jsdom environment, `IntersectionObserver` was absent, so those blocks raised four `ReferenceError` instances that React aggregated as an `AggregateError`.

`frontend/tests/setup.ts` now supplies the minimal no-op `IntersectionObserver` API needed by those renderer lifecycle hooks. The existing all-library test remains the regression assertion; it was not weakened or changed.

## Verification

- `npm.cmd run test:run -- src/components/admin/composer/PreviewPanel.test.tsx` — 13 passed.
- `npm.cmd run test:run -- src/components/blocks/animation/AnimationBlocks.test.tsx` — 9 passed.
- `git diff --check` — passed.
- `graphify update .` — completed; graph refresh reported its pre-existing extraction warnings.
