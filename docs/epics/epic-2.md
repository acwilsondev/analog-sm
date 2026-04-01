# EPIC 2 — Domain Core (Archive Primitives)

> “What *is* an archive entry?”
>
> **Goal:** Stable, versioned domain model.

---

## Story 2.1 — Entry & Revision aggregate

**As a** contributor  
**I want** entries to be versioned via revisions  
**So that** we have a stable history of content changes.

### Story 2.1 Acceptance Criteria

- `Entry` is the top-level aggregate.
- `Revision` contains the actual content (text, metadata).
- Revisions are immutable once created.
- An entry always has at least one revision.

---

## Story 2.2 — Collection model

**As a** member  
**I want** to group entries into collections  
**So that** I can organize related memories.

### Story 2.2 Acceptance Criteria

- `Collection` model exists with name and description.
- Entries can belong to multiple collections.
- Collections have an owner (`User`).

---

## Story 2.3 — Media metadata model

**As a** contributor  
**I want** media to be tracked with metadata  
**So that** we can handle various file types and sizes safely.

### Story 2.3 Acceptance Criteria

- `Media` model links a revision to a file in storage.
- Includes metadata: `fileName`, `fileSize`, `mimeType`, `blurHash` (optional).
- Media is immutable and content-addressable (ideally).

---

## Story 2.4 — Like & Comment models

**As a** member  
**I want** to react and discuss entries  
**So that** the community can interact.

### Story 2.4 Acceptance Criteria

- `Like` model links a `User` to an `Entry`.
- `Comment` model allows threaded discussions on an `Entry`.
- Comments are also versioned (optional) or at least editable.

---

## Story 2.5 — Domain invariants enforcement

**As a** developer  
**I want** business rules to be enforced at the domain layer  
**So that** the system state remains consistent.

### Story 2.5 Acceptance Criteria

- Domain functions validate rules (e.g., "cannot like twice", "cannot comment on non-existent entry").
- Invariants are tested without database dependencies.

---

## Exit Criteria Checklist (EPIC 2)

- [ ] All core entities implemented in `src/domain/entities.ts`.
- [ ] Prisma schema updated and migrated.
- [ ] No business logic in controllers/infrastructure.
- [ ] 100% test coverage for domain invariants.
