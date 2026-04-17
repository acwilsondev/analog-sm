# Changelog

All notable changes to Analog SM are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — 2026-04-16

### Security — Stage 4

**Rate limiting** (`src/shell/ratelimit.ts` — new)
- Added in-memory sliding window rate limiter used across all sensitive actions
- Login: 10 attempts per 15 minutes per IP (in NextAuth `authorize` callback)
- Registration: 10 attempts per hour per IP
- Post creation: 20 per hour per user
- Search: 30 per minute per user
- Friend requests: 20 per hour per user
- Admin promote: 5 per 15 minutes per caller — brute-force protection on password confirmation
- Resolves HIGH-07, MED-02

**Promote/demote atomicity** (`src/shell/actions/admin.ts`)
- Wrapped `adminPromoteUserAction` and `adminDemoteUserAction` in `prisma.$transaction` with a read-check-write pattern
- Prevents a concurrent promote + demote from reaching an unexpected role state
- Resolves LOW-01

**Structured logging** (`src/shell/logger.ts` — new)
- Production: JSON output `{level, context, message, id, ts}` — correlation ID present, no stack traces
- Development: full `console.error` with context label
- Applied to `createPostAction` and `updateProfileAction`
- Resolves MED-10

**Avatar and image security** (`src/components/Avatar.tsx`, `next.config.mjs`)
- Switched `Avatar` component from `<img>` to `next/image`
- `next.config.mjs`: `remotePatterns` allowlist built from `S3_PUBLIC_URL` env var and `api.dicebear.com`
- Added security headers to all routes: `Content-Security-Policy` (img-src, frame-ancestors), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
- SVG uploads were already blocked by magic-byte validation (Stage 1); CSP provides browser-level defense-in-depth
- Resolves LOW-03, MED-06

**Friendship action documentation** (`src/shell/actions/friendship.ts`)
- Added comment to `handleRequestAction` documenting that client-supplied `requestId` is validated server-side against the session user
- Resolves MED-03

**Registration enumeration** (`src/shell/actions/auth.ts`)
- Mitigated by IP-based rate limit on registration; error message already generic
- Resolves LOW-05

---

### Security — Stage 3

**Entrypoint safety** (`entrypoint.sh`)
- Removed `--accept-data-loss` from `prisma db push`; breaking schema changes now fail loudly instead of silently dropping data
- Resolves HIGH-06

**MinIO network exposure** (`docker-compose.yml`)
- Bound MinIO ports `9000` and `9001` to `127.0.0.1` — API and admin console no longer reachable from other hosts
- Resolves MED-07

**Docker base image** (`Dockerfile`)
- Switched from mutable `node:20` tag to pinned `node:20-alpine@sha256:fb4cd12c...`
- Alpine reduces attack surface; `openssl` added for Prisma's query engine on musl
- Resolves MED-09

**Smoke test** (`scripts/smoke-test.sh`)
- Removed `-u root` overrides; commands now run as the `nextjs` container user
- Removed redundant `prisma db push` step (entrypoint already handles schema on startup)
- Updated postgres readiness check to use `POSTGRES_USER` env var
- Resolves LOW-04

---

### Security — Stage 2

**Next.js upgrade** (`package.json`)
- Upgraded from Next.js 14.1.4 to 15.5.15
- Eliminates 18 critical CVEs including middleware authorization bypass (GHSA-f82v-jwr5-mffw), cache poisoning, HTTP request smuggling, and multiple DoS vectors
- Resolves CRIT-01

**JWT role re-validation** (`src/shell/auth.ts`)
- `jwt` callback now re-fetches the user's role from the database on every token use
- If the user record is gone (banned/hard-deleted), the token is marked `invalid` and the `session` callback strips `session.user`, causing all auth guards to fail immediately — no waiting for token expiry
- Resolves HIGH-01

**Middleware auth always enforced** (`src/middleware.ts`)
- Removed the `PRIVATE_INSTANCE` early-exit; auth is now checked for all non-public routes regardless of deployment mode
- Invalid tokens (banned users) are also caught and redirected at the middleware layer
- Resolves HIGH-02

**Cookie security flags** (`src/shell/auth.ts`)
- Added explicit `httpOnly: true`, `sameSite: lax`, `path: /`, `secure: true` in production / `false` in development
- Resolves MED-01

---

### Security — Stage 1

**Secrets removed from committed files** (`docker-compose.yml`, `.env.example`, `entrypoint.sh`)
- All hardcoded credentials replaced with `${VAR}` substitution in `docker-compose.yml`
- `.env.example` rewritten with no working values and explicit generation instructions
- Startup guard in `entrypoint.sh` — exits with an error if `NEXTAUTH_SECRET` is empty or matches a known placeholder
- Resolves CRIT-02, CRIT-04

**Server-side file validation** (`src/shell/media/validate.ts` — new)
- Magic-byte detection (JPEG/PNG/GIF/WebP); SVG and all other types rejected at the server
- 10 MB file size limit enforced before upload
- Maximum 10 files per post enforced server-side
- `ContentType` stored in S3 is the server-detected type, not the client-supplied value
- Resolves CRIT-03

**Filename sanitization** (`src/shell/actions/post.ts`, `src/shell/actions/user.ts`)
- Client-supplied filenames stripped of path traversal characters and capped at 100 characters before use in S3 keys
- Resolves HIGH-05

**Auth checks on user search and profile** (`src/shell/actions/user.ts`)
- `searchUsersAction` and `getProfileAction` now require an authenticated session
- Search query validated: minimum 2, maximum 50 characters
- Resolves HIGH-03, MED-04

**Profile page pagination** (`src/app/profile/[username]/page.tsx`)
- Added `take: 20` to profile post query — prevents unbounded DB load for users with many posts
- Resolves HIGH-04

**Global setting key allowlist** (`src/shell/actions/admin.ts`)
- `adminSetGlobalSettingAction` validates `key` against `['registrations_open']` before writing to the database
- Resolves MED-05

**Username max length constant** (`src/core/validation.ts`, `src/shell/actions/auth.ts`)
- Introduced `USERNAME_MAX_LENGTH = 20` shared by both `RegisterSchema` and `UpdateProfileSchema`
- Resolves LOW-02

---

## Prior History

Refer to `git log` for pre-security-audit feature development.
