# Analog — v1 Epic Map

Analog is a private, durable, portable social archive for a single community.

These epics define the roadmap for v1. They are organized to reinforce

- Archive-first design
- Functional + CQRS architecture
- Data durability and portability
- Calm, humane UX

---

## EPIC 0 — Foundation & Operability

> “Can this run, be upgraded, and be recovered?”

**Goal:** A deployable, backup-safe instance.

### Stories

- Repository scaffold (layers enforced: domain / infra / app / ui)
- Docker compose (app, db, storage)
- Environment configuration
- Secrets management
- Health checks
- Backup script (database + media)
- Restore script
- Versioned migrations
- Admin bootstrap user

### Exit Criteria

- Fresh instance → usable in <30 minutes
- Backup → restore → identical state
- Migrations reversible and documented

---

## EPIC 1 — Identity, Access & Trust

> “Who is allowed in, and how do they stay safe?”

**Goal:** Private, invite-only community.

### EPIC 1 - Stories

- Auth.js integration
- Magic link login
- Invite codes (single-use and multi-use)
- Role system (`admin`, `member`)
- Session management
- Account disable / revoke
- Lightweight audit log

## EPIC 1 - Exit Criteria

- No public access
- Invites fully control membership
- Admin can lock down instance instantly

---

## EPIC 2 — Domain Core (Archive Primitives)

> “What *is* an archive entry?”

**Goal:** Stable, versioned domain model.

### EPIC 2 - Stories

- Entry aggregate
- Revision system
- Collection model
- Media metadata model
- Like model
- Comment model
- Domain invariants enforcement

## EPIC 2 - Exit Criteria

- Domain rules fully encoded
- No business logic in controllers
- Core entities tested with invariants covered

---

## EPIC 3 — Capture & Upload Pipeline

> “Can people post from a phone in chaos?”

**Goal:** Fast, reliable capture.

### EPIC 3 - Stories

- Presigned upload URLs
- Multipart upload
- Upload progress UI
- Retry logic
- Draft persistence (local)
- Media validation (size/type)
- Thumbnail generation
- Outbox worker for side effects

### EPIC 3 - Exit Criteria

- 10 photos upload on LTE without data loss
- No orphaned media records
- Failed uploads recover safely

---

## EPIC 4 — Write Path (Commands)

> “How does state change?”

**Goal:** Explicit, auditable mutation.

### EPIC 4 - Stories

- `CreateEntry` command
- `EditEntry` command
- `AttachMedia` command
- `TombstoneEntry` command
- `CreateCollection` command
- `InviteMember` command
- Permission enforcement layer
- Command logging (minimal audit trail)

### EPIC 4 - Exit Criteria

- All writes flow through command handlers
- No direct DB mutation from UI or queries
- Commands are deterministic and testable

---

## EPIC 5 — Read Path (Queries & Projections)

> “How do people browse history?”

**Goal:** Fast, predictable retrieval.

### EPIC 5 - Stories

- Timeline projection
- Collection summary projection
- Media grid projection
- Member profile projection
- Tag index
- Pagination
- Search v1 (SQL-based)

### EPIC 5 - Exit Criteria

- Queries never invoke command logic
- Feeds load <500ms locally
- Read models are isolated and testable

---

## EPIC 6 — Interaction Layer

> “How do people respond to memories?”

**Goal:** Minimal, humane interaction.

### EPIC 6 - Stories

- Like / unlike
- Comment posting
- Mentions (`@member`)
- In-app notifications
- Activity view

### EPIC 6 - Exit Criteria

- No gamification mechanics
- Stable comment threading
- Clear notification boundaries

---

## EPIC 7 — Archive Navigation & Revisit

> “Can I find ‘that night’ years later?”

**Goal:** Long-term discoverability.

### EPIC 7 - Stories

- Timeline by year/month
- Collection browser
- People index
- Tag pages
- Related entries
- Optional: “On This Day”

### EPIC 7 - Exit Criteria

- ≤ 3 clicks to reach old content
- Predictable navigation structure
- No algorithmic surfacing

---

## EPIC 8 — Export, Portability & Stewardship

> “Can we leave if we want?”

**Goal:** Sovereignty and portability.

### EPIC 8 - Stories

- Per-user export
- Per-collection export
- Full instance export
- Restore validation tooling
- Export documentation
- Checksum validation for media

### EPIC 8 - Exit Criteria

- Archive portable without proprietary tooling
- Restore works on clean instance
- Media integrity verifiable

---

## EPIC 9 — Admin & Moderation

> “Can humans govern this?”

**Goal:** Lightweight governance.

### EPIC 9 - Stories

- Member list
- Role management
- Entry moderation
- Tombstone UI
- Invite revocation
- Storage metrics view
- Backup status view

### EPIC 9 - Exit Criteria

- No CLI required for normal ops
- Admin workflows are clear and safe
- No hidden moderation paths

---

## EPIC 10 — UX & Aesthetic Cohesion

> “Does it feel like Analog?”

**Goal:** Calm, durable interface.

### EPIC 10 - Stories

- Typography system
- Light/dark themes
- Mobile-first layouts
- Offline indicators
- Thoughtful empty states
- Thoughtful loading states

### EPIC 10 - Exit Criteria

- No “startup dashboard” feel
- Calm, archival aesthetic
- Feels built for memory, not engagement

---

## Guiding Constraint

Every epic must support:

> Analog is a private, durable, portable social archive.

If a feature undermines durability, sovereignty, or clarity, reconsider it.
