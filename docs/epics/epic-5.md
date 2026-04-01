# EPIC 5 — Read Path (Queries & Projections)

> “How do people browse history?”
>
> **Goal:** Fast, predictable retrieval.

---

## Story 5.1 — Timeline projection & Pagination

**As a** member  
**I want** to see a paginated feed of recent entries  
**So that** I can browse history without being overwhelmed.

### Story 5.1 Acceptance Criteria

- API returns a paginated list of entries (e.g., 20 per page).
- Includes the latest revision and author info.
- Supports cursors or simple offset pagination.

---

## Story 5.2 — Media grid projection

**As a** member  
**I want** to browse all photos and videos in a grid  
**So that** I can focus on visual memories.

### Story 5.2 Acceptance Criteria

- API returns all `READY` media records, ordered by date.
- Includes basic metadata (fileName, mimeType).
- Supports filtering by mimeType (e.g., images only).

---

## Story 5.3 — Member profile projection

**As a** member  
**I want** to see a summary of my own or another member's contributions  
**So that** I can revisit their shared perspective.

### Story 5.3 Acceptance Criteria

- API returns a member's profile info and their recent entries.
- Includes stats like entry count.

---

## Story 5.4 — Collection summary projection

**As a** member  
**I want** to see my collections with meaningful summaries  
**So that** I can quickly decide which themed memory to revisit.

### Story 5.4 Acceptance Criteria

- API returns collections with entry counts and potentially a "cover" preview.

---

## Story 5.5 — Search v1 (SQL-based)

**As a** member  
**I want** to search for entries by keywords in their content  
**So that** I can find specific moments I remember.

### Story 5.5 Acceptance Criteria

- API endpoint `GET /api/search?q=...`.
- Uses SQL `ILIKE` or full-text search against the latest revisions.
- Results are ranked by relevance or date.

---

## Exit Criteria Checklist (EPIC 5)

- [ ] Queries never invoke command logic.
- [ ] Feeds load < 500ms locally.
- [ ] Read models are isolated and testable.
- [ ] Pagination is consistent across all listing endpoints.
