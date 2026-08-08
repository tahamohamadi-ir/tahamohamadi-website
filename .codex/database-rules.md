# Database Rules

1. PostgreSQL 16 is the target database. Backend behavior that depends on SQL, ordering, JSON, locking or migrations is verified against PostgreSQL Compose, not an invented local substitute.
2. Use additive Django migrations under the owning app. Do not edit an applied migration; destructive data cleanup needs an explicit backup, rollback plan and user authorization.
3. Domain models keep typed relational fields; JSON is limited to schema-validated block settings and never replaces public DTOs or core relations.
4. Public queries filter published/active content at the database/query boundary and apply stable ordering with pagination bounds where lists can grow.
5. Mutable Admin resources use `version`/optimistic locking. A stale write returns a usable 409 and must not silently overwrite newer data.
6. Seed commands must be idempotent, profile-guarded and draft-only unless an explicit reviewed publish workflow says otherwise.
