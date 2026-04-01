# EPIC 8 — Export, Portability & Stewardship

> “Can we leave if we want?”
>
> **Goal:** Sovereignty and portability.

---

## Story 8.1 — Full instance export (JSON + Media)

**As an** admin  
**I want** to export the entire archive into a portable format  
**So that** I am not locked into this specific software stack.

### Story 8.1 Acceptance Criteria

- CLI or API command to trigger a full export.
- Produces a directory or zip containing:
  - `data.json`: All users, entries, revisions, comments, likes, tags.
  - `media/`: All uploaded files.
  - `manifest.json`: Checksums and metadata for everything.

---

## Story 8.2 — Per-user "Takeout"

**As a** member  
**I want** to download all my own data and media  
**So that** I have a personal copy of my memories.

### Story 8.2 Acceptance Criteria

- API endpoint `GET /api/me/export`.
- Returns a zip of the user's entries, revisions, and media.

---

## Story 8.3 — Media integrity verification (Checksums)

**As an** admin  
**I want** to verify that all archived media is intact  
**So that** I can detect bit rot or storage failures.

### Story 8.3 Acceptance Criteria

- Script/Command to compare DB-stored checksums with actual files in S3/MinIO.
- Reports missing or corrupted files.

---

## Story 8.4 — Restore validation tooling

**As an** admin  
**I want** a tool to verify that an export is valid and restorable  
**So that** I can trust my backups.

### Story 8.4 Acceptance Criteria

- Command to validate an export package against the schema and checksums.

---

## Exit Criteria Checklist (EPIC 8)

- [ ] Archive is portable without proprietary tooling (standard JSON + files).
- [ ] Restore works on a clean instance using the export artifact.
- [ ] Media integrity is verifiable via checksums.
- [ ] Documentation explains the archive format for future historians.
