# Product Requirements Document (PRD): Analog SM (MVP)

## 1. Executive Summary
**Analog SM** is a self-hostable, "Digital Living Room" designed for small groups (1-10 users). It prioritizes simplicity, temporal order, and data ownership over algorithmic engagement. It aims to recapture the "Indie Web" feel of early social networks like MySpace, without the complexity of modern ad-driven platforms.

## 2. Target Audience
- **The Self-Hoster:** Technically literate users who want a private social space for friends/family.
- **The Close Circle:** Non-technical users invited by a host to share updates in a "low-noise" environment.

## 3. User Stories
### Profile & Identity
- **US1:** As a user, I want to host a profile with a bio and avatar so others can identify me.
- **US2:** As a user, I want to edit my profile details at any time.

### Content Creation
- **US3:** As a user, I want to post short status updates (text-only) or long-form notes.
- **US4:** As a user, I want to upload a single photo or a set of photos with a caption.
- **US5:** As a user, I want to delete my own posts if I change my mind.

### Social Connectivity
- **US6:** As a user, I want to search for other users on the instance by username.
- **US7:** As a user, I want to send and accept "Friend Requests" to establish a mutual connection.
- **US8:** As a user, I want to see a list of my friends.

### The Timeline
- **US9:** As a user, I want to see a feed of posts from my friends in **strictly reverse-chronological order**.
- **US10:** As a user, I want the timeline to be simple, with no "Recommended" or "Sponsored" content.

## 4. Functional Requirements
### Authentication & Authorization
- **FR1:** Secure sign-in using email/password (NextAuth.js).
- **FR2:** Private instance toggle: The host can disable open registration (invite-only).
- **FR3:** Standard "Forgot Password" flow via SMTP.

### Media Management
- **FR4:** Support for JPEG, PNG, and WebP formats.
- **FR5:** Server-side image optimization/resizing to save disk space.
- **FR6:** Storage on an S3-compatible object store (e.g., Minio for self-hosting, AWS S3/R2 for cloud).

### Production Standards
- **FR7:** Graceful error handling (Next.js `error.tsx` and standard API responses).
- **FR8:** Loading states for all asynchronous actions (Shadcn/UI Skeletons).
- **FR9:** Mobile-responsive layout (Tailwind CSS).
- **FR10:** Basic SEO meta tags for profile links.

## 5. Non-Functional Requirements
- **Performance:** Initial page load < 1.5s for 10 concurrent users.
- **Portability:** The entire app must run via `docker-compose up`.
- **Durability:** Use a relational database (PostgreSQL) with automated migration handling.

## 6. Success Metrics for MVP
- Successful deployment on a standard VPS (2GB RAM).
- Successful upload and rendering of a 10-photo set.
- Zero algorithmic injection in the timeline.
