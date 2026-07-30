# R1 Public Research and Publications — Deferred Validation

Status date: 2026-07-29

This file records validation intentionally deferred while delivering the public
Research and Publications route slice quickly. It does not mark the remaining
items as complete.

## Completed automated evidence

- `npm.cmd run test:run -- src/lib/api.test.ts`: 9 tests passed.
- `npm.cmd exec tsc -- --noEmit`: passed.
- `npm.cmd run build`: compilation and type validation completed, but static
  prerendering stopped because the local API was unavailable (`ECONNREFUSED`)
  while rendering the existing `/en/about` page. This is not evidence of a
  failure in the new Research or Publications pages.

## Required follow-up

- [ ] Re-run the production frontend build with the API service available via
  Docker; confirm prerendering can fetch the existing About-page dependencies.
- [ ] Perform browser QA for `/fa/research`, `/en/research`,
  `/fa/publications`, and `/en/publications` using approved published data.
- [ ] Open at least one locale-specific Research and Publication detail URL in
  each locale; confirm titles, summaries/abstracts, metadata, and back/forward
  navigation use the requested locale without fallback.
- [ ] Verify Publications type and four-digit year filters, pagination, empty
  state, and unavailable-API error state in both RTL and LTR layouts.
- [ ] Verify all public records have approved same-locale content. Draft,
  unpublished, and incomplete locale variants must remain absent from public
  results.

## Scope boundary

This slice consumes the existing public identity-resource API only. It does not
alter navigation, site-wide header/footer configuration, seed content, or
unrelated pending frontend changes in the shared worktree.
