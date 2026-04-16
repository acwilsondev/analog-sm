# Role-Based Access Control

Analog SM uses a three-tier role hierarchy stored on the `User` model (`Role` enum in Prisma).

## Roles

| Role | Description |
|------|-------------|
| `USER` | Default role for all registered accounts. No administrative capabilities. |
| `ADMIN` | Can moderate content and manage regular users. Cannot act on other admins. |
| `OWNER` | Single site owner. Full authority, including demotion of admins. Cannot be acted on by anyone. |

There is one `OWNER` per instance. The owner is set directly in the database (via seed or manual update) — there is no UI path to create a second owner.

## Permission Matrix

| Action | USER | ADMIN | OWNER |
|--------|:----:|:-----:|:-----:|
| Post / interact | ✓ | ✓ | ✓ |
| Access `/admin` dashboard | — | ✓ | ✓ |
| Delete any post | — | ✓ | ✓ |
| Ban (delete) a `USER` | — | ✓ | ✓ |
| Ban an `ADMIN` or `OWNER` | — | ✗ | ✗ |
| Promote `USER` → `ADMIN` | — | ✓ | ✓ |
| Demote `ADMIN` → `USER` | — | ✗ | ✓ |
| Toggle public registrations | — | ✓ | ✓ |

## Enforcement

Permissions are enforced in two places:

1. **Server actions** (`src/shell/actions/admin.ts`) — every action re-validates the caller's role and the target's role server-side before writing to the database. The UI state is never trusted.
2. **UI** (`src/app/admin/AdminUserRow.tsx`) — action buttons are hidden based on `viewerRole` and `user.role` to avoid presenting options that would be rejected server-side anyway.

The key invariant: **elevated roles (`ADMIN`, `OWNER`) are immune to ban**. The server action checks the target's current role from the database before proceeding, so a client that sends a crafted request is still rejected.

## Changing Roles

To designate an owner on a fresh instance, run the seed (`npx prisma db seed`) — Alice (`alice@example.com`) is seeded as `OWNER`. To change the owner on a live instance:

```sql
UPDATE "User" SET role = 'OWNER' WHERE email = 'you@example.com';
UPDATE "User" SET role = 'USER'  WHERE email = 'old-owner@example.com';
```

Or via Prisma Studio (`npx prisma studio`).

## Session Propagation

The role is stored in the NextAuth JWT at sign-in via the `jwt` callback in `src/shell/auth.ts` and read from the session object as `(session.user as any).role`. Changing a user's role in the database takes effect at their next sign-in.
