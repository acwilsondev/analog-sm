# EPIC 7 — Archive Navigation & Revisit

> “Can I find ‘that night’ years later?”
>
> **Goal:** Long-term discoverability.

---

## Story 7.1 — Timeline navigation (Year/Month)

**As a** member  
**I want** to browse entries by specific year and month  
**So that** I can easily find memories from a certain time period.

### Story 7.1 Acceptance Criteria

- API returns a summary of years/months that have entries (count per month).
- API supports filtering entries by `year` and `month`.
- Results are ordered chronologically (or reverse).

---

## Story 7.2 — Collection browser

**As a** member  
**I want** to browse my collections and see the entries within them  
**So that** I can revisit themed memories.

### Story 7.2 Acceptance Criteria

- API to list all collections (with summary like entry count, cover image from last entry).
- API to get all entries for a specific collection.

---

## Story 7.3 — People index

**As a** member  
**I want** to see a list of everyone who has contributed to the archive  
**So that** I can find memories shared by specific people.

### Story 7.3 Acceptance Criteria

- API returns a list of members who have authored at least one active entry.
- API to filter entries by `authorId`.

---

## Story 7.4 — Tag index & pages

**As a** member  
**I want** to categorize entries with tags and browse them  
**So that** I can find related content across different times and collections.

### Story 7.4 Acceptance Criteria

- Support for tags on entries (schema update might be needed).
- API to list all unique tags.
- API to filter entries by `tag`.

---

## Story 7.5 — “On This Day” resurfacing

**As a** member  
**I want** to see entries from the same calendar day in previous years  
**So that** I can revisit anniversaries and recurring moments.

### Story 7.5 Acceptance Criteria

- API returns entries where the `createdAt` day and month match today (but from previous years).
- Minimalist, non-intrusive presentation.

---

## Exit Criteria Checklist (EPIC 7)

- [ ] ≤ 3 clicks to reach any old content (via Timeline -> Year -> Month).
- [ ] Predictable navigation structure (Date, People, Tags, Collections).
- [ ] No algorithmic surfacing (purely chronological or relational).
- [ ] Performance: Navigation queries resolve < 200ms locally.
