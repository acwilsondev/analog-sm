# EPIC 6 — Interaction Layer

> “How do people respond to memories?”
>
> **Goal:** Minimal, humane interaction.

---

## Story 6.1 — Like & Unlike commands

**As a** member  
**I want** to show appreciation for an entry (like) or remove it (unlike)  
**So that** I can express resonance with the community.

### Story 6.1 Acceptance Criteria

- `ToggleLikeCommand` (or separate Like/Unlike) implemented.
- Enforces unique like invariant (via `invariants.ts`).
- Unlike removes the `Like` record.
- Audit log records the action.

---

## Story 6.2 — Comment posting & threading

**As a** member  
**I want** to discuss an entry with others  
**So that** we can share additional context or feelings.

### Story 6.2 Acceptance Criteria

- `CreateCommentCommand` implemented.
- Supports threading (reply to parent comment).
- Threading depth limited to 1 (replies to replies are not allowed).
- Enforces comment invariants (length, etc.).

---

## Story 6.3 — Mentions (@member)

**As a** member  
**I want** to mention others in my comments  
**So that** they are notified of the discussion.

### Story 6.3 Acceptance Criteria

- Domain logic to parse `@email` or `@id` in comments.
- Mentions result in a `Notification` for the target member.

---

## Story 6.4 — In-app notifications

**As a** member  
**I want** to see when someone interacts with my content or mentions me  
**So that** I don't miss community activity.

### Story 6.4 Acceptance Criteria

- `Notification` model in Prisma.
- Notifications created for:
  - New comment on my entry.
  - Mention in a comment.
- Simple API to list/mark-as-read notifications.

---

## Story 6.5 — Activity view (basic)

**As a** member  
**I want** a stream of recent interactions  
**So that** I can see what's happening in the archive.

### Story 6.5 Acceptance Criteria

- API returns recent likes and comments across the archive.
- Focus is on "memories resurfacing" rather than "engagement metrics".

---

## Exit Criteria Checklist (EPIC 6)

- [ ] No gamification mechanics (e.g., no public like counts).
- [ ] Stable comment threading (depth=1).
- [ ] Clear notification boundaries (no email spam by default).
- [ ] All interactions are auditable.
