# Analog v1 Spec (MVP) — Private Social Archive per Group

## 0) One-sentence

Analog is an invite-only, self-hosted, chronological archive for a single community to store and revisit posts, photos, and event collections—designed for longevity, portability, and “going dark.”

---

## 1) Non-goals (v1)

- No federation / ActivityPub
- No DMs
- No algorithmic feed, trending, recommendations
- No stories / ephemeral content
- No multi-group / multi-tenant instances
- No complex reaction system (one “Like” only)
- No real-time chat; comments are enough

---

## 2) Personas

- **Admin**: sets up instance, invites members, manages basic moderation, runs backups.
- **Member**: posts, uploads media, comments/likes, organizes collections.
- **Viewer (Share Link)**: optional read-only access to a specific shared entry/collection via secret link.

---

## 3) Information Architecture

Primary navigation (top-level):

1. **Collections**
2. **Timeline**
3. **People**
4. **Search**
5. **New Entry** (prominent)

Secondary:

- **Settings** (profile, notifications, export)
- **Admin** (invites, members, instance settings, backups status)

---

## 4) Core Objects

### 4.1 Member

- name (display)
- avatar
- joinedAt
- role: `admin | member`
### 4.2 Entry (the atomic archive unit)

- body (markdown-lite or plain text)
- media attachments: photos/videos (v1: photos required; video optional)
- author
- createdAt (immutable)
- editedAt (optional)
- visibility: `group` (default), `sharedLink` (optional)
### 4.3 Collection (event / chapter)

- title
- slug
- description
- date range (start/end, optional)
- cover media (optional)
- entries (many)
### 4.4 Comment

- body
- author
- createdAt
### 4.5 Like

- memberId + entryId (unique)
### 4.6 Media

- original file
- derived thumbnails (generated)
- metadata: mime, size, width/height, duration, checksum

---

## 5) Required Features (v1)

### 5.1 Capture

- Create Entry with:
    - text (required OR at least 1 media)
    - attach 1–20 photos (drag/drop + mobile picker)
    - optional: attach 1 video (v1 limit)
    - choose collection (optional)
    - add tags (optional)
- Upload must be resilient:
    - show progress
    - retry failed uploads
    - don’t lose text draft on refresh
### 5.2 Browse / Revisit

- **Timeline**: chronological entries with pagination (no infinite scroll required)
- **Collections**:
    - list collections (newest updated first)
    - collection page shows entries + media grid
- **People**:
    - member directory
    - profile page: entries, collections participated in
### 5.3 Interaction

- Like / unlike
- Comment on an entry
- Mentions `@name` (simple autocomplete)
### 5.4 Organize

- Create/edit collection
- Add/remove entry from a collection
- Edit entry text (creates a revision record)
- Tags: add/remove from entries; tag page lists entries
### 5.5 Privacy / Sharing

- Entire site requires login by default
- Optional “Share Link”:
    - per-entry and/or per-collection
    - secret, unlisted URL token
    - view-only (no comments/likes)
### 5.6 Invites
- Admin generates invite links (single-use or multi-use with max uses)
- Members can be allowed N invites (config toggle; default off)

### 5.7 Export & Backups (must-have)

- **Per-member export**: my entries + media
- **Per-collection export**: entries + media + metadata
- Export format: `.zip` containing:
    - `metadata.json`
    - `media/` originals
    - `thumbnails/` (optional)
    - `entries/` rendered HTML or markdown snapshots (optional but nice)

---

## 6) Admin & Moderation (minimal)

- Member list
- Revoke invite links
- Disable member (soft delete / access revoke)
- Remove an entry (tombstone; admin-only)
- Instance settings:
    - name, logo, theme accent
    - default privacy (always group-only in v1)
    - max upload sizes

---

## 7) Technical Constraints (v1 targets)

- Single instance supports: ~20–200 members
- Emphasis: photos over video
- Storage approach: object storage (MinIO/S3) strongly preferred
- DB: Postgres
- Derived media: thumbnails + medium size (e.g., 2048px max) generated server-side

---

## 8) Suggested Stack (implementation guidance)

- Next.js (App Router) + TypeScript
- Prisma + Postgres
- Auth.js (email magic links) + invites
- MinIO + presigned uploads
- Image processing: Sharp
- Jobs: simplest workable (inline first, queue later)

---

## 9) MVP Acceptance Criteria

You can call v1 “done” when:

- A member can post text + photos from a phone in < 30 seconds
- Collections make it easy to find “that weekend” months later
- Search/tag pages make retrieval plausible
- Admin can invite/revoke and export/backup without heroics
- The archive is portable (zip export works, restore documented)

---

## 10) “v1.1 / v2” Parking Lot (do not build yet)

- Offline queued uploads (PWA)
- Video transcoding
- Map pins
- Event RSVP
- Reactions beyond like
- Read-only public yearbook
- Federation/export to ActivityPub

---

If you want, next I can turn this into:

1. a **route map** (pages + API endpoints), and
2. a **Prisma schema draft** (tables + relations) that matches the spec.
