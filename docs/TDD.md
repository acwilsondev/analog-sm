# Technical Design Document (TDD): Analog SM (MVP)

## 1. System Overview
Analog SM is a Next.js (App Router) application built on the **Functional Core, Imperative Shell** architectural pattern. It uses Prisma for data persistence, Tailwind CSS for styling, and NextAuth.js for session management.

## 2. Architecture: Functional Core, Imperative Shell

### 2.1 The Functional Core (`src/core/`)
Pure logic that is 100% deterministic and free of I/O.
- **`src/core/timeline.ts`**: Functions for sorting posts, filtering based on friendship status, and formatting temporal metadata.
- **`src/core/friendship.ts`**: Pure state transitions for friend requests (e.g., `PENDING -> ACCEPTED`, `REJECTED`).
- **`src/core/validation.ts`**: Zod schemas and validation logic for incoming post data and profile updates.

### 2.2 The Imperative Shell (`src/shell/`)
Handles all side effects and I/O.
- **`src/shell/db/`**: Prisma client and database repository functions.
- **`src/shell/actions/`**: Next.js Server Actions that coordinate between the DB and the Core logic.
- **`src/shell/media/`**: Logic for reading/writing image files to the local file system (Docker volume).

## 3. Data Model (Prisma Schema Draft)

```prisma
model User {
  id            String    @id @default(cuid())
  username      String    @unique
  email         String    @unique
  passwordHash  String
  bio           String?
  avatarUrl     String?
  posts         Post[]
  friends       Friendship[] @relation("UserFriends")
  friendedBy    Friendship[] @relation("FriendedByUser")
}

model Post {
  id        String    @id @default(cuid())
  authorId  String
  author    User      @relation(fields: [authorId], references: [id])
  content   String
  type      PostType  @default(TEXT)
  media     Media[]
  createdAt DateTime  @default(now())
}

model Media {
  id      String @id @default(cuid())
  postId  String
  post    Post   @relation(fields: [postId], references: [id])
  url     String
  order   Int
}

model Friendship {
  id          String   @id @default(cuid())
  requesterId String
  receiverId  String
  status      String   // PENDING, ACCEPTED
  requester   User     @relation("UserFriends", fields: [requesterId], references: [id])
  receiver    User     @relation("FriendedByUser", fields: [receiverId], references: [id])
}

enum PostType {
  TEXT
  PHOTO
  PHOTO_SET
}
```

## 4. Technology Stack
- **Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS + Shadcn/UI (Radix primitives).
- **Authentication:** Auth.js (NextAuth) with Credentials provider (Email/Password).
- **Database:** PostgreSQL (Self-hosted or Managed).
- **Storage:** S3-compatible (Minio, AWS S3, Cloudflare R2).

## 5. Deployment strategy
- **Containerization:** `Dockerfile` (Multi-stage build) + `docker-compose.yml`.
- **Service Mesh:** Services (App, Postgres, Minio) communicate over a private Docker network.
- **Persistence:** Volumes used only for service data directories (Postgres `/var/lib/postgresql/data`, Minio `/data`).

## 6. Testing Strategy
- **Unit Tests (Vitest):** Mandatory for the **Functional Core** (`src/core/`). 100% coverage goal.
- **Integration Tests:** Server Actions using a containerized PostgreSQL instance (Testcontainers).
- **E2E (Playwright):** Critical flows: Sign-up, Post Creation, Friend Request.
t.
