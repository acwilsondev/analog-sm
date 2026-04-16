# Epic 1: Profile & Identity

This epic focuses on allowing users to establish and manage their identity within the Analog SM instance.

## User Stories

### Identity Setup

- **As a user (US1),** I want to host a profile with a bio and avatar so others can identify me.
- **As a user (US2),** I want to edit my profile details at any time.

## Technical Tasks

- Implement user authentication with email/password (NextAuth.js).
- Create a profile schema and database table (PostgreSQL/Prisma).
- Implement a profile editing page with bio and avatar upload.
- (FR1) Secure sign-in using NextAuth.js.
- (FR2) Implement private instance toggle for the host.
- (FR3) Standard "Forgot Password" flow via SMTP.
- (FR9) Ensure mobile-responsive layout for the profile page.
