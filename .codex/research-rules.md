# Research and Dependency Rules

1. A sample project, WordPress package or UI library is evidence for a capability, not executable product code and not a dependency approval.
2. Before a new dependency, verify the real need, maintenance/security posture, license, bundle/runtime impact, accessibility and removal path.
3. Record material decisions as an ADR with alternatives, scope, owner, rollback and the verification trigger.
4. Do not claim product behavior from a dependency name, README or marketing page; inspect the installed version and the consuming code.
5. Preserve the current architecture unless an approved ADR changes it: Django/DRF, PostgreSQL/Django migrations and Next.js/React/TypeScript.
