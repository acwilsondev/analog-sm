# EPIC 1 — Identity, Access & Trust

> “Who is allowed in, and how do they stay safe?”
>
> **Goal:** Private, invite-only community.

---

## Story 1.1 — Auth.js integration with Magic Link provider

**As a** user  
**I want** to log in securely without a password  
**So that** my account is safe from password-based attacks.

### Story 1.1 Acceptance Criteria

- Auth.js (NextAuth.js or equivalent) is integrated.
- Only "Email" (Magic Link) provider is enabled by default.
- Users can only sign up/in if their email is already in the `User` table or they have a valid invite.

---

## Story 1.2 — Role-based access control (RBAC)

**As an** admin  
**I want** to distinguish between admins and regular members  
**So that** I can restrict sensitive operations.

### Story 1.2 Acceptance Criteria

- `User` table has a `role` column (enum: `admin`, `member`).
- Middleware or decorators enforce role requirements on sensitive routes.
- Initial admin (created via bootstrap) has the `admin` role.

---

## Story 1.3 — Invite code system (single & multi-use)

**As an** admin  
**I want** to invite new people to the community  
**So that** I can control growth and maintain privacy.

### Story 1.3 Acceptance Criteria

- Admins can create invite codes.
- Invites can be:
  - **Single-use**: One-time use link.
  - **Multi-use**: Shared link with a usage limit or expiration.
- Redeeming an invite creates a new `User` record.

---

## Story 1.4 — Session management & logout

**As a** user  
**I want** to be able to log out and manage my sessions  
**So that** I can secure my account on shared devices.

### Story 1.4 Acceptance Criteria

- Logout clears the session cookie.
- Sessions are persisted in the database (via Auth.js adapter).

---

## Story 1.5 — Account disable & revocation

**As an** admin  
**I want** to deactivate members or revoke invites  
**So that** I can manage community membership in case of issues.

### Story 1.5 Acceptance Criteria

- Admins can "disable" a `User`.
- Disabled members are immediately logged out and cannot log back in.
- Admins can revoke pending/active invite codes.

---

## Story 1.6 — Lightweight audit log for access changes

**As an** admin  
**I want** to see when access changes occur  
**So that** I can audit security events.

### Story 1.6 Acceptance Criteria

- Log events for:
  - Successful logins.
  - New member registration (via invite).
  - Role changes.
  - Account deactivation.
- Audit log is visible to admins.

---

## Exit Criteria Checklist (EPIC 1)

- [x] Public access is blocked; only authenticated members can see content.
- [x] No registration without an invite.
- [x] Admin can deactivate any user instantly.
- [x] Session persistence survives app restarts.
