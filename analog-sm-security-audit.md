# Security Audit Report: Analog SM

**Date:** 2026-04-16  
**Auditor:** Claude Code (Sonnet 4.6)  
**Target:** `/home/aaron/projects/analog-sm`  
**Stack:** Next.js 14.1.4 (App Router), NextAuth v4 (JWT), Prisma + PostgreSQL, MinIO S3-compatible storage  
**Scope:** Full codebase review — authentication, authorization, input validation, file upload, XSS, CSRF, API routes, environment/secrets, Docker/infra, information disclosure, rate limiting, open redirect, dependency vulnerabilities

---

## Executive Summary

The application has a clean architectural foundation (functional core / imperative shell separation, consistent use of Zod, no raw SQL). However, several significant security gaps exist: the Next.js version is severely out-of-date with **18 critical CVEs**, the middleware-based auth model has a meaningful bypass condition, file uploads lack server-side validation entirely, no rate limiting exists anywhere, and default credentials are shipped in both `.env` and `docker-compose.yml`. None of these are theoretical — they represent concrete exploitable or operational risks.

### Severity Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 7 |
| Medium | 8 |
| Low | 5 |
| Info | 4 |

---

## 1. Authentication & Session

### CRIT-01 — Next.js 14.1.4 Has 18 Critical CVEs Including Authorization Bypass

**Severity:** Critical  **Status:** ✅ Fixed (upgraded to 15.5.15)  
**File:** `package.json:22`

The pinned version `14.1.4` of Next.js has accumulated 18 critical advisories, including:

- **GHSA-f82v-jwr5-mffw** — Authorization Bypass in Next.js Middleware. Middleware can be bypassed entirely via crafted requests, allowing unauthenticated access to protected routes. **This directly undermines the PRIVATE_INSTANCE mode.**
- **GHSA-7gfc-8cq8-jh5f** — Next.js authorization bypass vulnerability.
- **GHSA-ggv3-7p47-pfv8** — HTTP request smuggling in rewrites.
- **GHSA-g5qg-72qw-gw5v** / **GHSA-gp8f-8m3g-qvj9** — Cache poisoning attacks.
- Multiple DoS via Server Actions, Server Components, and Image Optimizer.

**Recommendation:** Upgrade to the latest stable Next.js 15.x. Run `npm audit` after upgrading and resolve remaining advisories. This is the single highest-impact fix available.

---

### CRIT-02 — NEXTAUTH_SECRET Is a Weak Placeholder in All Environments

**Severity:** Critical  **Status:** ✅ Fixed  
**Files:** `.env:2`, `docker-compose.yml:8`

Both the local `.env` file and the Docker Compose configuration ship with placeholder/trivially-guessable NEXTAUTH_SECRET values:

```
# .env
NEXTAUTH_SECRET="your-secret-here"

# docker-compose.yml
NEXTAUTH_SECRET=placeholder-secret
```

NextAuth uses this secret to sign JWT session tokens. An attacker who knows the secret can forge arbitrary session tokens, impersonating any user including OWNER accounts.

**Recommendation:**

1. Generate a strong secret: `openssl rand -hex 32`
2. Never commit real secrets to source control. The `.env` file is currently gitignored; ensure it stays that way.
3. Remove the placeholder from `docker-compose.yml` and require operators to set it via a `.env` file or Docker secret.
4. Add a startup check that fails loudly if `NEXTAUTH_SECRET` matches any known placeholder.

---

### HIGH-01 — JWT Role Is Embedded at Login Time and Never Re-validated

**Severity:** High  **Status:** ✅ Fixed (role re-fetched from DB on every JWT callback; banned/deleted users get invalid token)  
**Files:** `src/shell/auth.ts:52-57`

```typescript
async jwt({ token, user }) {
  if (user) {
    token.role = (user as any).role;
  }
  return token;
},
```

The role is written into the JWT only at initial sign-in (when `user` is defined). On subsequent requests the token is accepted as-is without re-fetching the user from the database. This means:

1. If an admin is demoted, their token remains valid with the `ADMIN` role until it expires.
2. If a user is banned (`adminBanUserAction` hard-deletes the record), their existing JWT continues to authenticate them until expiry. There is no session invalidation or token revocation mechanism.

**Recommendation:**

- Either shorten JWT expiry significantly (e.g., 15 minutes) with a refresh-token strategy, or
- On every request, look up the current role from the database (expensive but authoritative), or
- Maintain a server-side blocklist of revoked `jti` (JWT ID) values, or
- Switch to database sessions (`strategy: "database"`) for high-privilege operations.

At minimum, add a `jti` claim, log bans in a `banned_tokens` table, and check it in the `jwt` callback.

---

### HIGH-02 — Middleware Auth Only Applies in PRIVATE_INSTANCE Mode

**Severity:** High  **Status:** ✅ Fixed (PRIVATE_INSTANCE bypass removed; middleware always enforces auth)  
**File:** `src/middleware.ts:12-13`

```typescript
const privateInstance = process.env.PRIVATE_INSTANCE === 'true';
if (!privateInstance) return NextResponse.next();
```

In the default (public) configuration, the middleware performs **no authentication whatsoever** — it simply passes every request through. All auth protection in the default mode relies on individual page/action checks. While those checks exist for most routes, this means a middleware misconfiguration or missed check in a future route leaves pages open. The layered defense model only works for non-default deployments.

Additionally, even in PRIVATE_INSTANCE mode, the middleware cannot protect server actions themselves from direct invocation — those require their own session checks, which they do have.

**Recommendation:** The middleware should at minimum set an authenticated context for downstream use. Consider applying auth middleware regardless of PRIVATE_INSTANCE, and using the PRIVATE_INSTANCE flag only to control registration access.

---

### MED-01 — No Cookie Security Configuration in NextAuth

**Severity:** Medium  **Status:** ✅ Fixed (explicit httpOnly, sameSite: lax, secure in production)  
**File:** `src/shell/auth.ts`

NextAuth's default cookie flags depend on whether `NEXTAUTH_URL` uses HTTPS. In local dev with `http://localhost`, cookies are set without the `Secure` flag. There is no explicit configuration of `sameSite`, `secure`, or `httpOnly` flags:

```typescript
// No cookies: {} block present in authOptions
```

**Recommendation:** Add explicit cookie configuration to `authOptions`:

```typescript
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true,
    },
  },
},
```

---

## 2. Authorization / RBAC

### HIGH-03 — `searchUsersAction` and `getProfileAction` Have No Authentication Check

**Severity:** High  **Status:** ✅ Fixed  
**File:** `src/shell/actions/user.ts:11-16`

```typescript
export async function searchUsersAction(query: string): Promise<UserProfile[]> {
  return dbSearchUsers(query);
}

export async function getProfileAction(username: string): Promise<UserProfile | null> {
  return getUserProfile(username);
}
```

Both of these server actions are callable without any session. Any unauthenticated client can invoke them directly (server actions are POST endpoints at the app URL) to enumerate all usernames. The search action is particularly sensitive because it performs a database query for any string input with no auth gate.

Note: Even in non-PRIVATE_INSTANCE mode, this leaks the full user list to unauthenticated callers. In PRIVATE_INSTANCE mode, the middleware bypasses noted in CRIT-01 make this worse.

**Recommendation:** Add session checks to both functions:

```typescript
export async function searchUsersAction(query: string): Promise<UserProfile[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];
  return dbSearchUsers(query);
}
```

---

### HIGH-04 — Profile Page Fetches All Posts Without Pagination (DoS via Database)

**Severity:** High  **Status:** ✅ Fixed (`take: 20` added; full cursor pagination deferred)  
**File:** `src/app/profile/[username]/page.tsx:42-47`

```typescript
const posts = await prisma.post.findMany({
  where: { authorId: user.id },
  include: { author: true, media: { orderBy: { order: 'asc' } } },
  orderBy: { createdAt: 'desc' },
});
```

There is no `take` or pagination on the profile page post query. A user who creates thousands of posts (or a load-test seeding script is run) will cause the profile page to attempt to load all of them into memory in a single query, with full author and media joins. This is a denial-of-service vector against the database and application server.

**Recommendation:** Add a `take` limit (e.g., 20) and implement cursor-based pagination on the profile page, identical to the timeline approach.

---

### MED-02 — Admin Can Promote Any Regular User Without Rate Limiting

**Severity:** Medium  
**File:** `src/shell/actions/admin.ts:56-77`

The `adminPromoteUserAction` requires the calling admin's password for confirmation, which is good. However, there is no rate limiting or lockout on failed password attempts in this action. An attacker who gains ADMIN access through another vector (e.g., compromised account) could brute-force the OWNER's password confirmation to promote themselves or an accomplice.

**Recommendation:** Track failed promotion attempts, apply exponential backoff, and alert on repeated failures.

---

### MED-03 — Friendship Status Is Trusted from Client-Side State

**Severity:** Medium  
**File:** `src/components/FriendButton.tsx:19`, `src/app/friends/page.tsx:38-41`

The `FriendButton` component in the friends page passes `isReceiver={true}` as a hardcoded prop, and the `requestId` is passed from server-rendered data. However, in `ProfileClient.tsx`, the `isReceiver` prop is derived server-side and passed down, so the authorization ultimately happens in `handleRequestAction`. The server-side check is correct (line 67-75 of `friendship.ts`), but the reliance on client-passed `requestId` means the client could theoretically call `handleRequestAction` with any `requestId` — the authorization check in the action correctly validates receiver/requester identity, so this is mitigated, but the pattern warrants documentation.

**Recommendation:** No code change needed, but add a comment in `handleRequestAction` noting that the `requestId` is validated server-side against the session user.

---

### LOW-01 — Admin Demotion Does Not Prevent Re-promotion Race

**Severity:** Low  
**File:** `src/shell/actions/admin.ts:80-101`

The demote and promote actions are not atomic. A concurrent promote call and demote call for the same user could result in unexpected final state depending on DB transaction ordering. This is a low-probability edge case for a self-hosted platform but worth noting.

**Recommendation:** Wrap promote/demote in a Prisma transaction.

---

## 3. Input Validation

### MED-04 — Search Query Has No Length or Character Validation

**Severity:** Medium  **Status:** ✅ Fixed  
**File:** `src/shell/actions/user.ts:11`, `src/shell/db/user.ts:40-48`

```typescript
export async function searchUsersAction(query: string): Promise<UserProfile[]> {
  return dbSearchUsers(query);
}

// ...
where: {
  username: { contains: query, mode: 'insensitive' },
},
```

The search query is passed directly to Prisma's `contains` filter with no length limit or sanitization. While Prisma parameterizes the query (preventing SQL injection), a caller can send an arbitrarily long query string, causing unnecessary database load. Combined with the missing auth check (HIGH-03), this allows unauthenticated database queries with unbounded input.

**Recommendation:**

- Add a max length check (e.g., 50 characters)
- Add the authentication check from HIGH-03
- Consider a minimum length of 2 characters (the UI already enforces this, but server-side is what matters)

---

### MED-05 — `adminSetGlobalSettingAction` Accepts Arbitrary Key Names

**Severity:** Medium  **Status:** ✅ Fixed  
**File:** `src/shell/actions/admin.ts:104-122`

```typescript
export async function adminSetGlobalSettingAction(
  key: string,
  value: string
): Promise<ActionResult<void>> {
  // ...
  await prisma.globalSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
```

The `key` parameter is not validated against an allowlist. While only admins can call this, an admin could call the action directly (bypassing the UI which only sends `'registrations_open'`) with arbitrary keys. If any part of the application reads `globalSetting` values and interprets them, this could be abused.

Currently only `registrations_open` is read, but the open-ended nature is a future risk if new settings are added.

**Recommendation:** Validate `key` against an explicit allowlist:

```typescript
const ALLOWED_KEYS = ['registrations_open'] as const;
if (!ALLOWED_KEYS.includes(key as any)) {
  return { success: false, error: 'Invalid setting key' };
}
```

---

### LOW-02 — Username Validation Is Inconsistent Between Registration and Profile Update

**Severity:** Low  **Status:** ✅ Fixed  
**File:** `src/shell/actions/auth.ts:9` vs `src/core/validation.ts:10`

Registration allows usernames up to 20 characters (`z.string().min(3).max(20)`), but `UpdateProfileSchema` allows up to 30 characters (`z.string().min(3).max(30)`). A user could register with a 20-character limit and then update to a 30-character username. This is a minor inconsistency but could cause confusion in UI components that assume the same limits.

**Recommendation:** Standardize on a single constant for username max length, shared by both schemas.

---

## 4. SQL Injection

### INFO-01 — Prisma ORM Parameterizes All Queries

**Severity:** Info  
**File:** All `src/shell/db/*.ts` files

No raw SQL queries (`$queryRaw`, `$executeRaw`) are used anywhere in the codebase. All database interactions use Prisma's typed query builder, which parameterizes inputs automatically. There is no SQL injection risk from the application code itself.

---

## 5. File Upload Security

### CRIT-03 — No Server-Side File Type or Size Validation on Uploads

**Severity:** Critical  **Status:** ✅ Fixed (magic-byte detection, 10MB limit, max 10 files; `sharp` re-encoding deferred to Stage 4)  
**Files:** `src/shell/actions/post.ts:39-44`, `src/shell/actions/user.ts:42-45`, `src/shell/media/s3.ts`

```typescript
// post.ts
const buffer = Buffer.from(await file.arrayBuffer());
const fileName = `${userId}-${Date.now()}-${file.name}`;
const url = await uploadToS3(buffer, fileName, file.type);  // file.type is caller-supplied!
```

```typescript
// s3.ts — accepts whatever contentType is passed in
await s3Client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: file,
    ContentType: contentType,  // no validation
  })
);
```

Multiple critical issues:

1. **No file size limit.** A user can upload arbitrarily large files, exhausting storage and memory. The SECURITY.md spec says "max 10MB per image" but this is not implemented.

2. **No MIME type validation on the server.** `file.type` comes from the multipart form data submitted by the client. Any client can send `Content-Type: image/jpeg` for an executable file, a PHP script, or an SVG with embedded JavaScript. The actual file bytes are never inspected.

3. **No magic byte / file signature check.** Bypassing the client-side `accept="image/*"` filter is trivial.

4. **Uploaded files go into a public S3 bucket.** An SVG file with embedded JavaScript will execute in users' browsers when opened directly from the MinIO URL (MinIO serves SVG without sandboxing).

5. **No upper limit on number of files per post.** The schema validation allows up to 10, but only the UI enforces this for the form; a direct server action call can bypass this.

**Recommendation:**

```typescript
// In createPostAction and updateProfileAction:
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Check magic bytes using a library like `file-type`:
import { fileTypeFromBuffer } from 'file-type';
const detected = await fileTypeFromBuffer(buffer);
if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
  return { success: false, error: 'Invalid file type' };
}
if (buffer.length > MAX_FILE_SIZE) {
  return { success: false, error: 'File too large' };
}
```

Block SVG uploads entirely due to XSS risk, or serve them with `Content-Disposition: attachment`.

---

### HIGH-05 — File Name From Client Used Directly in S3 Key (Path Traversal / Key Injection)

**Severity:** High  **Status:** ✅ Fixed  
**Files:** `src/shell/actions/post.ts:42`, `src/shell/actions/user.ts:44`

```typescript
const fileName = `${userId}-${Date.now()}-${file.name}`;       // post.ts
const fileName = `avatars/${userId}-${Date.now()}-${avatarFile.name}`;  // user.ts
```

`file.name` is client-supplied and is never sanitized. An attacker can upload a file named:

- `../../etc/passwd` — path traversal in the S3 key (unlikely to cause OS traversal in MinIO but can overwrite arbitrary S3 objects in other implementations)
- `../admin/config` — could overwrite other objects in the bucket
- A very long name (thousands of characters) causing S3 API errors or unexpected behavior
- A name containing Unicode or special characters that break URL construction

**Recommendation:**

```typescript
import path from 'path';
const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
const fileName = `${userId}-${Date.now()}-${safeName}`;
```

Or better: ignore the original filename entirely and generate a UUID-based key.

---

## 6. XSS

### INFO-02 — No `dangerouslySetInnerHTML` Usage Found

**Severity:** Info  
**Scope:** All `src/**/*.tsx` files

No use of `dangerouslySetInnerHTML` was found. React's JSX escaping handles user-generated content (post content, bios, usernames) correctly in text nodes.

---

### MED-06 — Stored SVG XSS via File Upload (if SVG is Permitted)

**Severity:** Medium  
**Files:** `src/shell/actions/post.ts`, `src/shell/media/s3.ts`, `src/components/MediaGrid.tsx`

Directly related to CRIT-03. If a user uploads an SVG file, MinIO will serve it with `Content-Type: image/svg+xml`. When displayed via `<img src="...">` in React, modern browsers do NOT execute SVG scripts in `<img>` tags — this is safe for direct image display. However, if a user clicks through to the lightbox and the browser opens the raw URL, or if the `src` attribute is used in a context that triggers direct navigation, script execution becomes possible.

Additionally, avatar and post media URLs are stored in the database and rendered without CSP protection. The MinIO bucket is public, so any user who obtains a media URL can share it directly.

**Recommendation:** Block SVG uploads (enforce at server side, see CRIT-03). Add a `Content-Security-Policy` header to the Next.js config restricting `img-src` to trusted domains only.

---

### LOW-03 — Avatar URL Stored From S3 Is Rendered Without Validation

**Severity:** Low  
**Files:** `src/components/Avatar.tsx:16-17`, `src/shell/db/user.ts:31`

```typescript
const src = avatarUrl ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
return <img src={src} ... />
```

The `avatarUrl` comes from the database and is rendered directly as an `img src`. While the upload path stores S3 URLs, if the `avatarUrl` column were somehow written with a `javascript:` URI (via a SQL injection that doesn't currently exist, or direct DB manipulation), it would not execute (browsers block `javascript:` in `img src`). However, the value is completely unvalidated in the render layer.

More practically: if the S3 bucket is changed or media is deleted, broken images will load. The `next/image` component provides better control including domain whitelisting.

**Recommendation:** Use `next/image` instead of raw `<img>` tags, and configure `images.remotePatterns` in `next.config.mjs` to restrict image sources.

---

## 7. CSRF

### INFO-03 — Server Actions Have Built-in CSRF Protection in Next.js 14

**Severity:** Info

Next.js 14 Server Actions include built-in CSRF protection via origin checking. Server Actions are only invoked via POST requests with a specific `Next-Action` header, which browsers do not send in cross-site requests. This provides reasonable CSRF protection without additional configuration.

However, **this relies on the Next.js version being unpatched**. Given CRIT-01 (multiple Next.js CVEs including request smuggling), the theoretical CSRF protection may be undermined. Upgrading Next.js remains essential.

---

## 8. API Routes

### INFO-04 — Only NextAuth API Route Exists

**Severity:** Info  
**File:** `src/app/api/auth/[...nextauth]/route.ts`

The only API route is the standard NextAuth catch-all handler. It correctly exports both GET and POST handlers. No custom API routes exist; all mutations go through server actions.

---

## 9. Environment / Secrets

### CRIT-04 — Default Credentials Shipped in docker-compose.yml and .env

**Severity:** Critical  **Status:** ✅ Fixed  
**Files:** `docker-compose.yml:8-14`, `.env:1-7`

The following credentials are hardcoded in committed files:

| Secret | Value | File |
|--------|-------|------|
| `NEXTAUTH_SECRET` | `placeholder-secret` | `docker-compose.yml:8` |
| `DATABASE_URL` | `user:password@...` | `docker-compose.yml:7`, `.env:1` |
| `S3_ACCESS_KEY` | `minioadmin` | `docker-compose.yml:12`, `.env:5` |
| `S3_SECRET_KEY` | `minioadmin` | `docker-compose.yml:13`, `.env:6` |
| `POSTGRES_PASSWORD` | `password` | `docker-compose.yml:22` |

The `.env` file is gitignored, but the `docker-compose.yml` is committed to version control. Any operator who deploys from the repository without reading the docs and changing these values will have a publicly-known NEXTAUTH_SECRET, database password, and MinIO credentials.

**Recommendation:**

1. Remove all secret values from `docker-compose.yml`. Use `${VARIABLE}` substitution from `.env`:

   ```yaml
   environment:
     - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
     - DATABASE_URL=${DATABASE_URL}
   ```

2. Provide a `.env.example` with placeholder comments, not working values.
3. Add a startup script that validates secrets are not using known defaults.

---

### MED-07 — MinIO Admin Console Exposed on Port 9001 with Default Credentials

**Severity:** Medium  
**File:** `docker-compose.yml:31-32`

```yaml
minio:
  command: server /data --console-address ":9001"
  ports:
    - "9000:9000"
    - "9001:9001"
```

The MinIO web console (admin UI) is exposed on port 9001 and the entire data port on 9000, both bound to `0.0.0.0` (all interfaces). Combined with the default `minioadmin`/`minioadmin` credentials, any host that can reach port 9001 gets full admin access to the object store.

Additionally, port 9000 being public means the MinIO API is directly reachable, which combined with default credentials allows anyone to list buckets, read all media, and write arbitrary files.

**Recommendation:**

1. Change MinIO credentials from defaults.
2. Bind MinIO ports to `127.0.0.1` instead of all interfaces, and access it only through the reverse proxy or Docker internal network.
3. If the MinIO console is not needed in production, remove port 9001 from the port mapping.

```yaml
minio:
  ports:
    - "127.0.0.1:9000:9000"
    # Do not expose 9001 in production
```

---

### MED-08 — PostgreSQL Port Not Exposed but Credentials Are Weak

**Severity:** Medium  
**File:** `docker-compose.yml:19-23`

PostgreSQL does not have ports exposed in the Compose file (correct), but the credentials (`user`/`password`) are extremely weak. On any network where the `postgres` container is reachable (e.g., a misconfigured Docker network, or if a port is added later), these credentials provide trivial access to the full database including password hashes.

**Recommendation:** Use strong generated credentials for the database in all environments. Document this in the operations guide.

---

## 10. Dependency Vulnerabilities

### Summary from `npm audit`

**Total:** 12 vulnerabilities (1 critical, 6 high, 5 moderate) — the critical/high count refers to `npm audit` scoring, distinct from the Next.js CVEs listed above.

| Package | Severity | Issue |
|---------|----------|-------|
| `next` (14.1.4) | Critical | 18 advisories including auth bypass, cache poisoning, DoS, SSRF — see CRIT-01 |
| `glob` (10.x) | High | GHSA-5j98-mcp5-4vw2: Command injection via `--cmd` flag |
| `minimatch` (9.x) | High | Multiple ReDoS vulnerabilities (GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74) |
| `@typescript-eslint/*` | High | ReDoS via minimatch transitive dep |
| `eslint-config-next` | High | Transitive through `@next/eslint-plugin-next` / `glob` |
| `esbuild` | Moderate | GHSA-67mh-4wv8-2f99: dev server request origin bypass |
| `vitest` | Moderate | Transitive through esbuild |

The `glob` command injection and `minimatch` ReDoS are in devDependencies and unlikely to be reachable at runtime in production. The `esbuild` issue is dev-only. The Next.js vulnerabilities are the actionable production risk.

**Recommendation:** Run `npm audit fix` after upgrading Next.js. Pin dev dependency upgrades separately to avoid breaking changes.

---

## 11. Docker / Infrastructure

### HIGH-06 — `prisma db push --accept-data-loss` in Production Entrypoint

**Severity:** High  
**File:** `entrypoint.sh:11`

```sh
./node_modules/.bin/prisma db push --accept-data-loss
```

`prisma db push --accept-data-loss` is a destructive operation that will silently drop columns or tables that are no longer in the schema. Running this automatically on every container start in production risks unrecoverable data loss during schema changes.

**Recommendation:**

- Use `prisma migrate deploy` for production environments, which applies migrations safely and tracks state.
- If `db push` must be used, remove `--accept-data-loss` and let it fail loudly if there are breaking changes.
- Take a database backup before every deployment.

---

### MED-09 — Node.js Base Image Is Not Pinned to a Specific Digest

**Severity:** Medium  
**File:** `Dockerfile:1`

```dockerfile
FROM node:20 AS base
```

The `node:20` tag is a mutable floating tag. It will resolve to different images over time. A supply chain attack that compromises the `node:20` image on Docker Hub would affect all builds.

**Recommendation:** Pin to a specific image digest:

```dockerfile
FROM node:20-alpine@sha256:<digest> AS base
```

And use `node:20-alpine` to reduce attack surface and image size.

---

### LOW-04 — Smoke Test Runs as Root Inside Container

**Severity:** Low  
**File:** `scripts/smoke-test.sh:27,30`

```bash
docker-compose exec -T -u root app ./node_modules/.bin/prisma db push --accept-data-loss
docker-compose exec -T -u root app npx prisma@5.22.0 db seed
```

The smoke test overrides the container user to `root` to run commands. The Dockerfile creates a `nextjs` user for security reasons, but the test script bypasses this. While this is a test/CI script, it sets a bad precedent and could mask privilege issues.

**Recommendation:** Run the smoke test commands as the `nextjs` user, or add appropriate permissions to the non-root user.

---

## 12. Information Disclosure

### MED-10 — Detailed Error Logged to Console in Production

**Severity:** Medium  
**Files:** `src/shell/actions/post.ts:68`, `src/shell/actions/user.ts:56`

```typescript
// post.ts
} catch (e) {
  console.error(e);  // Full error object, including stack trace, logged
  return { success: false, error: "Failed to create post" };
}

// user.ts
console.error("Failed to update profile:", error);  // Includes error details
```

While the error message returned to the client is generic (good), the full error including stack traces and potentially DB error messages is logged via `console.error`. In containerized production environments, these logs may be collected and forwarded to log aggregation systems accessible to more people than intended.

**Recommendation:** Use a structured logger with log-level control. In production, log errors with a correlation ID but suppress raw stack traces from being logged to stdout by default.

---

### LOW-05 — Registration Reveals Username/Email Enumeration

**Severity:** Low  
**File:** `src/shell/actions/auth.ts:36-38`

```typescript
if (existing) {
  return { success: false, error: "User already exists" };
}
```

A single generic message "User already exists" is returned whether the email or username conflicts. This prevents distinguishing which field collides, which is good. However, the registration flow still allows enumeration: an attacker can try registering with target emails and observe whether they get "User already exists" vs. a successful registration. On a self-hosted instance this is lower-risk, but worth noting.

**Recommendation:** Consider a rate limit on registration attempts (see next section).

---

## 13. Rate Limiting

### HIGH-07 — No Rate Limiting Anywhere in the Application

**Severity:** High  
**Scope:** All server actions and API routes

The SECURITY.md spec states: "Basic rate-limiting for the `createPost` and `login` actions to prevent brute-force and spam attacks." This is not implemented anywhere in the codebase.

Affected endpoints:

- **Login** (`/api/auth/[...nextauth]`): Unlimited password attempts enable brute-force attacks against any account.
- **Registration** (`registerAction`): Unlimited account creation enables spam and registration flooding.
- **Post creation** (`createPostAction`): No spam prevention; a user can create posts in a loop.
- **Friend requests** (`sendRequestAction`): Unlimited spam requests to any user.
- **Admin promote** (`adminPromoteUserAction`): Password confirmation can be brute-forced.
- **Search** (`searchUsersAction`): Unlimited unauthenticated database queries (see HIGH-03).

**Recommendation:**

1. Add rate limiting middleware using a package such as `@upstash/ratelimit` (Redis-backed) or `express-rate-limit` (if adding an Express adapter).
2. For login specifically, implement account lockout after N failed attempts (e.g., 5), with exponential backoff.
3. NextAuth does not provide built-in rate limiting — it must be added at the middleware or action level.

```typescript
// Example in middleware.ts using a simple in-memory approach for small instances:
import { Ratelimit } from "@upstash/ratelimit";
```

For a self-hosted instance without Redis, a simple token bucket in memory (with appropriate clustering caveats) or a Prisma-backed rate limit table works.

---

## 14. Open Redirect

### INFO — No Open Redirect Vulnerability Found

**Severity:** Info

All redirect targets in the application are hardcoded internal paths (`/login`, `/`, `/admin`, `/profile/${username}`). The `signOut({ callbackUrl: '/login' })` uses a relative URL. NextAuth's `pages.signIn = "/login"` is a static path. No user-controlled input is used to construct redirect URLs.

The `router.push(`/profile/${newUsername}`)` in `EditProfileForm.tsx` uses the username from the form response (validated by `UpdateProfileSchema`), not a user-supplied redirect parameter.

No open redirect vulnerability exists in the current codebase.

---

## 15. Photo / Media Content Validation

### HIGH — No Server-Side Image Content Validation Beyond MIME Type

**Severity:** High (covered in CRIT-03)

As detailed in CRIT-03, there is zero server-side validation of image content. Beyond the security issues already listed:

- **Malicious image files**: Files like "ImageTragick" exploits (ImageMagick RCE via crafted images) could be relevant if image processing is added in the future.
- **Polyglot files**: A file can be simultaneously valid JPEG and valid JavaScript (JPEG/JS polyglot). If the application ever processes image content server-side, these could cause unexpected behavior.
- **EXIF metadata**: The SECURITY.md spec mentions stripping EXIF data (GPS coordinates) as a future enhancement. This is not implemented. Every uploaded photo that was taken with GPS-enabled will expose the photographer's precise location.

**Recommendation:**

1. Use a server-side library (e.g., `sharp`) to decode and re-encode images before storage. This strips metadata, validates that the file is actually an image, and neutralizes most polyglot attacks.
2. At minimum, validate magic bytes using the `file-type` npm package.
3. Strip EXIF data before storing to protect user privacy.

---

## Summary Table

| ID | Severity | Category | File | Issue | Status |
|----|----------|----------|------|-------|--------|
| CRIT-01 | Critical | Dependencies | `package.json:22` | Next.js 14.1.4 with 18 critical CVEs including auth bypass | ✅ Fixed |
| CRIT-02 | Critical | Auth / Secrets | `.env:2`, `docker-compose.yml:8` | Weak placeholder NEXTAUTH_SECRET in committed files | ✅ Fixed |
| CRIT-03 | Critical | File Upload | `src/shell/actions/post.ts:39-44`, `src/shell/media/s3.ts` | No file size limit, no server-side MIME validation, no magic byte check | ✅ Fixed |
| CRIT-04 | Critical | Secrets / Infra | `docker-compose.yml:7-14`, `.env` | Default credentials for all services committed to repo | ✅ Fixed |
| HIGH-01 | High | Auth | `src/shell/auth.ts:52-57` | JWT role not re-validated; banned users retain valid sessions | ✅ Fixed |
| HIGH-02 | High | Auth | `src/middleware.ts:12-13` | Middleware only applies auth in PRIVATE_INSTANCE mode | ✅ Fixed |
| HIGH-03 | High | Authorization | `src/shell/actions/user.ts:11-16` | `searchUsersAction` and `getProfileAction` lack auth checks | ✅ Fixed |
| HIGH-04 | High | DoS | `src/app/profile/[username]/page.tsx:42-47` | Unbounded profile post query — no pagination | ✅ Fixed |
| HIGH-05 | High | File Upload | `src/shell/actions/post.ts:42`, `src/shell/actions/user.ts:44` | Client-supplied filename used in S3 key without sanitization | ✅ Fixed |
| HIGH-06 | High | Infra | `entrypoint.sh:11` | `prisma db push --accept-data-loss` runs on every container start | Stage 3 |
| HIGH-07 | High | Rate Limiting | All server actions | No rate limiting on login, registration, posting, or search | Stage 4 |
| MED-01 | Medium | Auth | `src/shell/auth.ts` | No explicit cookie security flags configured | ✅ Fixed |
| MED-02 | Medium | Authorization | `src/shell/actions/admin.ts:56-77` | No brute-force protection on admin promote password | Stage 4 |
| MED-03 | Medium | Authorization | `src/components/FriendButton.tsx` | Client-side friendship state (server-side check is correct; pattern note) | Stage 4 |
| MED-04 | Medium | Validation | `src/shell/actions/user.ts:11`, `src/shell/db/user.ts:46` | Search query unbounded length, no auth gate | ✅ Fixed |
| MED-05 | Medium | Validation | `src/shell/actions/admin.ts:104-122` | `adminSetGlobalSettingAction` accepts arbitrary key names | ✅ Fixed |
| MED-06 | Medium | XSS | `src/shell/actions/post.ts`, `src/shell/media/s3.ts` | SVG uploads would be served from public CDN without sandboxing | Stage 3 |
| MED-07 | Medium | Infra | `docker-compose.yml:31-32` | MinIO admin console (9001) exposed with default credentials | Stage 3 |
| MED-08 | Medium | Infra | `docker-compose.yml:19-23` | Weak database credentials | Stage 3 |
| MED-09 | Medium | Infra | `Dockerfile:1` | Non-pinned `node:20` base image | Stage 3 |
| MED-10 | Medium | Info Disclosure | `src/shell/actions/post.ts:68`, `src/shell/actions/user.ts:56` | Full exception objects logged in production | Stage 4 |
| LOW-01 | Low | Authorization | `src/shell/actions/admin.ts` | Promote/demote not in a database transaction | Stage 4 |
| LOW-02 | Low | Validation | `src/shell/actions/auth.ts:9` vs `src/core/validation.ts:10` | Inconsistent username max length | ✅ Fixed |
| LOW-03 | Low | XSS | `src/components/Avatar.tsx:16-17` | Avatar URL rendered without validation or domain restriction | Stage 4 |
| LOW-04 | Low | Infra | `scripts/smoke-test.sh:27,30` | Smoke test runs container commands as root | Stage 3 |
| LOW-05 | Low | Info Disclosure | `src/shell/actions/auth.ts:36-38` | Registration enables email/username enumeration | Stage 4 |
| INFO-01 | Info | SQL Injection | All `src/shell/db/*.ts` | No raw queries; Prisma parameterizes everything — no finding | N/A |
| INFO-02 | Info | XSS | All `src/**/*.tsx` | No `dangerouslySetInnerHTML` usage — no finding | N/A |
| INFO-03 | Info | CSRF | Next.js Server Actions | Built-in origin checking provides CSRF protection | N/A |
| INFO-04 | Info | API Routes | `src/app/api/` | Only NextAuth route; no custom API routes | N/A |

---

## Prioritized Remediation Plan

### Immediate (Before Next Deployment)

1. **Upgrade Next.js** to 15.x — resolves CRIT-01 and its 18 CVEs
2. **Generate a real NEXTAUTH_SECRET** and remove all placeholder/default secrets from committed files — CRIT-02, CRIT-04
3. **Add server-side file validation** (magic bytes + size limit) — CRIT-03
4. **Change MinIO and PostgreSQL credentials** from defaults — CRIT-04, MED-07, MED-08

### Short Term (Within 1 Sprint)

1. **Implement rate limiting** on login, registration, and post creation — HIGH-07
2. **Add auth checks** to `searchUsersAction` and `getProfileAction` — HIGH-03
3. **Sanitize filenames** before using in S3 keys — HIGH-05
4. **Add JWT re-validation** or session invalidation on ban/demotion — HIGH-01
5. **Paginate profile page** post query — HIGH-04
6. **Replace `prisma db push --accept-data-loss`** with `prisma migrate deploy` in entrypoint — HIGH-06

### Medium Term (Within 1 Month)

1. **Process images through `sharp`** to validate, re-encode, and strip EXIF — CRIT-03 follow-up
2. **Add Content-Security-Policy headers** via `next.config.mjs` — MED-06
3. **Bind MinIO ports to localhost** and remove console port in production — MED-07
4. **Pin Docker base image** to a digest — MED-09
5. **Validate global setting keys** against an allowlist — MED-05
6. **Configure explicit cookie flags** in NextAuth — MED-01
