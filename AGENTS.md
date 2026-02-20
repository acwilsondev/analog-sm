# AGENTS

## Architecture

- **Prefer explicit, boring, durable design.**
  - Optimize for long-term maintainability, data safety, and clarity over novelty.
  - Avoid “clever” abstractions that obscure how data flows.

- **Favor modular, composable services over monolith logic.**
  - Isolate concerns: auth, media, archive, search, export, admin.
  - Avoid feature entanglement.

- **Keep boundaries explicit.**
  - Core domain logic must not depend on UI, framework, or deployment details.
  - External services (email, storage, queues) live at the edges.

- **Prefer composition over inheritance.**
  - Use small, focused modules.
  - Avoid deep class hierarchies.

- **Treat the database as a first-class system.**
  - Schema changes are architectural decisions.
  - Migrations must be reviewed carefully.
  - Backward compatibility and data preservation matter.

- **Design for portability.**
  - An Analog instance must be movable, restorable, and exportable.
  - No hard dependency on proprietary services.

---

## Functional & Compositional Style

- **Prefer functional, compositional design over imperative flows.**
  - Favor pure functions and explicit data transformations.
  - Model workflows as pipelines: `input → validate → transform → persist → emit`.
  - Avoid hidden state, mutation-heavy logic, and “action at a distance.”

- **Separate computation from effects.**
  - Core logic must be deterministic and testable.
  - IO, database access, storage, and messaging belong in adapters.

- **Prefer explicit data types over ad-hoc objects.**
  - Validate at boundaries.
  - Use discriminated unions / tagged types for domain states.
  - Avoid “stringly-typed” logic.

- **Compose behavior from small units.**
  - Prefer many small functions over large controllers.
  - Build features by wiring primitives together.

- **Make data flow visible.**
  - A reader should be able to follow request → domain → storage → response without jumping layers.
  - Avoid implicit context and global state.

- **Favor immutability.**
  - Domain objects are persistent values.
  - Updates create new versions or revisions.
  - Never mutate shared structures in place.

---

## CQRS (Command / Query Responsibility Segregation)

- **Separate write paths (Commands) from read paths (Queries).**
  - Commands mutate state.
  - Queries are read-only and side-effect free.

- **Commands represent intent.**
  - Examples:
    - `CreateEntry`
    - `AttachMedia`
    - `EditEntry`
    - `TombstoneEntry`
    - `CreateCollection`
    - `InviteMember`
  - Commands validate, authorize, then execute deterministic pipelines.
  - Commands return identifiers and minimal confirmation.

- **Queries never encode business rules.**
  - Queries may aggregate and denormalize.
  - They must not enforce invariants.

- **Prefer simple CQRS first.**
  - Single Postgres database.
  - Separate write/read modules.
  - Avoid event sourcing until a concrete need appears.

- **Maintain read models.**
  - Examples:
    - Timeline items
    - Collection summaries
    - Media grids
    - Member profiles
    - Search inputs
  - Projection logic must be isolated and testable.

- **Use an Outbox pattern for side effects.**
  - Commands write state + enqueue side effects transactionally.
  - Workers consume outbox entries idempotently.
  - Examples:
    - Thumbnail generation
    - Email invites
    - Search indexing

---

## Layered Structure

Organize the project into four conceptual layers.

### 1. Domain Core

- Entries, Collections, Media, Revisions, Members.
- Business rules and invariants.
- No framework imports.
- No direct IO.
- Target: **70–85% test coverage**
- Public APIs documented.

### 2. Infrastructure

- Prisma/Postgres
- Storage (MinIO/S3)
- Email
- Queues
- External services

Rules:

- May depend on Domain.
- Must not leak upward.
- Target: **60–75% test coverage**

### 3. Application / Features

- Use-case orchestration:
  - Posting
  - Uploads
  - Collections
  - Search
  - Export
  - Invites
- Validation and authorization.
- API handlers.

Rules:

- May depend on Domain + Infrastructure.
- Pragmatic and readable.
- Target: **40–60% test coverage**

### 4. Interface Layer

- Next.js components/pages
- Forms and layouts
- Client-side state

Rules:

- No business logic.
- No DB access.
- Thin adapters.
- Tests optional (prefer integration/e2e).

---

## Documentation

- **All domain entities require doc comments.**
  - Purpose
  - Invariants
  - Lifecycle
  - Non-responsibilities

- **Public services/functions must document:**
  - intent
  - inputs/outputs
  - side effects
  - failure modes
  - persistence impact

- **Infrastructure code requires operational notes.**
  - Setup assumptions
  - Backup/restore
  - Failure scenarios
  - Performance constraints

- **Each top-level directory requires a README.md**
  - Ownership
  - Responsibilities
  - Dependencies
  - Non-goals

Favor practical documentation over marketing language.

---

## Data & Safety Principles

- **Data is sacred.**
  - Never silently delete content.
  - Prefer tombstones.
  - Edits create revisions.

- **No destructive migrations without approval.**
  - Migration plan
  - Verified backup
  - Restore test

- **Design for recovery.**
  - Assume restore will be needed.
  - Export paths must remain functional.

- **Immutability over convenience.**
  - Timestamps are immutable.
  - Original media is never overwritten.

---

## Testing

- **Domain Core requires tests.**
  - Invariants
  - Edge cases
  - State transitions

- **Infrastructure tests focus on integration.**
  - Storage
  - Database
  - Export/import

- **Application tests cover workflows.**
  - Posting
  - Upload pipelines
  - Permissions
  - Invites

- **UI tests are optional but encouraged.**
  - Critical flows preferred.

- **Prefer tests when data integrity is involved.**
  - Persistence
  - Export
  - Permissions
  - Media

---

## Performance & Scalability

- Optimize for:
  - 20–200 members
  - Tens of thousands of entries
  - Hundreds of thousands of media files

- Priorities:
  1. Data safety
  2. Predictable performance
  3. Simplicity
  4. Raw speed

- Avoid premature caching.
- Measure before optimizing.

---

## Security & Privacy

- Default to private.
- No indexing.
- No analytics.
- Minimal third-party dependencies.

- Review all auth, sharing, and export code carefully.

- Treat invite and share links as credentials.

---

## Committing

- Run lint, typecheck, and tests before committing.
- Keep main deployable.

- **Use Conventional Commits.**
  Format: `type(scope): summary`

  Examples:
  - `feat(entries): add revision history`
  - `fix(upload): prevent orphaned media`
  - `refactor(domain): extract collection rules`
  - `docs: clarify backup process`
  - `test(export): add restore coverage`

- **One intention per commit.**
  - No mixed refactors + features.
  - No “misc cleanup.”

---

## Product Alignment

Every change must support:

> Analog is a private, durable, portable social archive.

When in doubt:

- Prefer clarity over cleverness
- Prefer durability over speed
- Prefer ownership over convenience
- Prefer archives over feeds

If a feature undermines these goals, reconsider it.
