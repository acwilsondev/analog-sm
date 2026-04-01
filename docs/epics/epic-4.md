# EPIC 4 — Write Path (Commands)

> “How does state change?”
>
> **Goal:** Explicit, auditable mutation.

---

## Story 4.1 — Command architecture & logging

**As a** contributor  
**I want** all mutations to flow through a dedicated command layer  
**So that** business logic is central, explicit, and auditable.

### Story 4.1 Acceptance Criteria

- All write operations (CreateEntry, EditEntry, etc.) use a command pattern.
- Every command execution is logged (AuditLog).
- Commands are responsible for enforcing domain invariants (via `invariants.ts`).

---

## Story 4.2 — `CreateEntry` & `EditEntry` commands

**As a** member  
**I want** to create and edit entries with revision history  
**So that** I can share memories and correct them later.

### Story 4.2 Acceptance Criteria

- `CreateEntry` creates an `Entry` and its initial `Revision`.
- `EditEntry` creates a new `Revision` for an existing `Entry`.
- Author/Admin permission check is enforced.

---

## Story 4.3 — `AttachMedia` command

**As a** member  
**I want** to link uploaded media to a revision  
**So that** my posts can include photos/videos.

### Story 4.3 Acceptance Criteria

- Links a `READY` media record to a `Revision`.
- Ensures media isn't orphaned.

---

## Story 4.4 — `CreateCollection` & `InviteMember` commands

**As an** admin/member  
**I want** to create collections and invite others via commands  
**So that** the system state is updated consistently.

### Story 4.4 Acceptance Criteria

- `CreateCollection` command implemented.
- `InviteMember` command replaces/augments the CLI-only flow.

---

## Story 4.5 — `TombstoneEntry` command (soft delete)

**As a** member  
**I want** to be able to remove an entry  
**So that** I have control over my content.

### Story 4.5 Acceptance Criteria

- Soft-deletes an entry (tombstone record or flag).
- All associated revisions and media are kept (durable archive principle) but hidden from main feeds.

---

## Exit Criteria Checklist (EPIC 4)

- [ ] All writes flow through command handlers.
- [ ] No direct DB mutation from API routes or queries.
- [ ] Every command is unit tested.
- [ ] Command logging captures Who, What, When.
