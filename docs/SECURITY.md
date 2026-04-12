# Security & Privacy Policy: Analog SM (MVP)

## 1. Authentication & Session Management
- **Auth.js (NextAuth):** All authentication will be handled using standard, industry-vetted providers.
- **Password Hashing:** Passwords MUST be hashed using `bcrypt` or `argon2` before storage. No plain-text passwords.
- **Session Expiry:** Sessions should expire after 30 days of inactivity.
- **CSRF Protection:** NextAuth.js automatically provides CSRF protection for all authentication-related requests.

## 2. Authorization (RBAC)
- **Ownership Check:** Any mutation (Update/Delete) MUST verify that the `userId` in the session matches the `authorId` of the resource.
- **Friendship Gates:** The Timeline MUST only show posts from confirmed friends (`FRIENDSHIP_STATUS == 'ACCEPTED'`).
- **Private Instance:** If the `PRIVATE_INSTANCE` environment variable is set to `true`, open registration will be disabled.

## 3. Data Privacy
- **Minimal Data Collection:** Analog SM only collects what is necessary for the app to function (Username, Email, Bio, Avatar).
- **No Analytics:** No third-party tracking or analytics (e.g., Google Analytics, Meta Pixel).
- **Local Storage:** All media and database records remain on the self-hosted instance.

## 4. Input Sanitization & Safety
- **XSS Prevention:** Next.js and React automatically escape content to prevent XSS. Any use of `dangerouslySetInnerHTML` is strictly prohibited.
- **SQL Injection:** Prisma uses prepared statements, which protects against SQL injection.
- **Rate Limiting:** Basic rate-limiting for the `createPost` and `login` actions to prevent brute-force and spam attacks.

## 5. Security Headers (Next.js Config)
- **CSP (Content Security Policy):** A strict CSP will be implemented to prevent unauthorized script execution.
- **HSTS:** Strict-Transport-Security will be enabled for all production instances.

## 6. Secure Media Handling
- **File Validation:** All uploaded files MUST be validated for type and size (max 10MB per image).
- **Metadata Stripping:** (Future enhancement) Strip EXIF data (GPS coordinates) from uploaded images to protect user privacy.

## 7. Data Portability
- **The "Export Everything" Button:** Users will have the ability to download a JSON file of all their posts and media (Analog is about data ownership).
- **The "Delete My Account" Button:** Users can request a full wipe of their data from the instance.
