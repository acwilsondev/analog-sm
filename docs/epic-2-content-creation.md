# Epic 2: Content Creation

This epic focuses on providing users with the ability to share updates and media.

## User Stories

### Content Sharing

- **As a user (US3),** I want to post short status updates (text-only) or long-form notes.
- **As a user (US4),** I want to upload a single photo or a set of photos with a caption.
- **As a user (US5),** I want to delete my own posts if I change my mind.

## Technical Tasks

- Create a `Post` database table with support for both text and photo sets (discriminative union).
- Implement a post creation interface with text input and file upload (Shadcn/UI).
- (FR4) Implement support for JPEG, PNG, and WebP formats.
- (FR5) Implement server-side image optimization and resizing.
- (FR6) Integrate with an S3-compatible object store (MinIO/S3).
- Implement delete functionality for posts with proper authorization checks.
- (FR8) Add loading states for post-upload actions.
