# EPIC 9 — Admin & Moderation

> “Can humans govern this?”
>
> **Goal:** Lightweight governance.

---

## Story 9.1 — Member list & management

**As an** admin  
**I want** to see a list of all members and their status  
**So that** I can manage community membership.

### Story 9.1 Acceptance Criteria

- API returns a list of all users with their email, role, and active status.
- Supports filtering by status (active/inactive).

---

## Story 9.2 — Role management & deactivation

**As an** admin  
**I want** to change user roles or deactivate accounts  
**So that** I can adjust permissions or handle problematic behavior.

### Story 9.2 Acceptance Criteria

- `UpdateUserRoleCommand` implemented.
- `ToggleUserStatusCommand` (Activate/Deactivate) implemented.
- Admin cannot deactivate themselves (invariant).

---

## Story 9.3 — Entry moderation (Hard delete/Redact)

**As an** admin  
**I want** to remove problematic content entirely if necessary  
**So that** I can maintain community standards.

### Story 9.3 Acceptance Criteria

- `ModerationDeleteEntryCommand` implemented (different from member's soft-delete/tombstone).
- Hard delete removes revisions and media if requested, or just hides it globally.
- (Archive principle: default to tombstone, but admin has override).

---

## Story 9.4 — Invite management & revocation

**As an** admin  
**I want** to see all active invites and revoke them if needed  
**So that** I can control access to the instance.

### Story 9.4 Acceptance Criteria

- API to list all invites (used/unused).
- `RevokeInviteCommand` implemented.

---

## Story 9.5 — Storage & system metrics view

**As an** admin  
**I want** to see how much storage is used and the status of backups  
**So that** I can ensure the instance's health.

### Story 9.5 Acceptance Criteria

- API returns counts of entries, media, and total storage size (from DB metadata).
- (Optional) Status of last backup.

---

## Exit Criteria Checklist (EPIC 9)

- [ ] No CLI required for normal admin ops (all available via API).
- [ ] Admin workflows are clear and safe.
- [ ] No hidden moderation paths.
- [ ] Critical actions (deactivation, deletion) are logged in AuditLog.
