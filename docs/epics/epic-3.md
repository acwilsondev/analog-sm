# EPIC 3 — Capture & Upload Pipeline

> “Can people post from a phone in chaos?”
>
> **Goal:** Fast, reliable capture.

---

## Story 3.1 — Presigned upload URLs

**As a** user  
**I want** to upload media directly to storage  
**So that** the app server isn't a bottleneck for large files.

### Story 3.1 Acceptance Criteria

- API endpoint `/api/media/presigned-url` returns a PUT URL for MinIO/S3.
- URL is short-lived (e.g., 15 minutes).
- Includes required headers/metadata for consistency.

---

## Story 3.2 — Media validation (size/type)

**As an** admin  
**I want** to restrict the types and sizes of uploaded media  
**So that** storage costs and security are managed.

### Story 3.2 Acceptance Criteria

- Validation enforced at the API layer (before granting URL).
- Supported types: `image/*`, `video/*`.
- Max size configurable (default 100MB).

---

## Story 3.3 — Multipart upload support

**As a** user with a poor connection  
**I want** large uploads to be chunked  
**So that** they can resume after failure.

### Story 3.3 Acceptance Criteria

- API supports initiating, uploading parts, and completing multipart uploads.
- Works with standard S3 multipart API.

---

## Story 3.4 — Upload progress & state tracking

**As a** user  
**I want** to see my upload progress  
**So that** I know it's working.

### Story 3.4 Acceptance Criteria

- `Media` record created in `PENDING` state when upload starts.
- Client can report progress (optional but encouraged).
- State updated to `READY` once storage confirms receipt.

---

## Story 3.5 — Thumbnail & Blurhash generation

**As a** member  
**I want** to see fast previews of media  
**So that** I don't wait for full-res downloads.

### Story 3.5 Acceptance Criteria

- Generate `blurhash` for images.
- Create small thumbnails for grid views.
- Side-effect worker (or simple hook) handles this after upload completion.

---

## Exit Criteria Checklist (EPIC 3)

- [ ] 10 photos upload on LTE without data loss.
- [ ] No orphaned media records in the database.
- [ ] Failed uploads recover safely or are cleaned up.
- [ ] Media metadata (size, type) correctly populated.
