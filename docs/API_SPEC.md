# API & Contract Specification: Analog SM (MVP)

## 1. Overview
This document defines the interface for Next.js **Server Actions** and the shared data structures used between the **Functional Core** and the **Imperative Shell**.

## 2. Shared Data Structures (Core Types)
Located in `src/core/types.ts`.

```typescript
export interface BasePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface TextPost extends BasePost {
  type: 'TEXT';
}

export interface PhotoSetPost extends BasePost {
  type: 'PHOTO_SET';
  mediaUrls: string[];
}

export type Post = TextPost | PhotoSetPost;

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  isFriend: boolean;
  friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED';
}
```

## 3. Server Actions (Shell API)
Located in `src/shell/actions/`.

### 3.1 Post Management
- **`createPost(data: CreatePostInput): Promise<ActionResult<Post>>`**
    - Input validation via Zod.
    - Side-effects: Writes to DB, saves media files.
- **`deletePost(postId: string): Promise<ActionResult<void>>`**
    - Authorization check: User must own the post.

### 3.2 Friendship Management
- **`sendFriendRequest(targetUserId: string): Promise<ActionResult<void>>`**
    - Functional Core rule: Cannot friend self.
- **`acceptFriendRequest(requestId: string): Promise<ActionResult<void>>`**
- **`rejectFriendRequest(requestId: string): Promise<ActionResult<void>>`**

### 3.3 Profile Management
- **`updateProfile(data: UpdateProfileInput): Promise<ActionResult<UserProfile>>`**
    - Side-effects: Avatar upload to S3-compatible storage.

## 4. Response Pattern
All actions MUST return a consistent `ActionResult<T>` type to the UI.

```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

## 5. Input Validation (Zod Schemas)
Located in `src/core/validation.ts`.

```typescript
const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  media: z.array(z.string().url()).max(10).optional(),
});

const UpdateProfileSchema = z.object({
  bio: z.string().max(160).optional(),
  avatar: z.any().optional(), // Handled via FormData for file upload
});
```

## 6. Real-time Expectations
- **Polling:** The MVP will use standard page refreshes or React Query refetches for "real-time" updates (no WebSockets for MVP).
- **Optimistic Updates:** React's `useOptimistic` hook will be used for post deletion and friend requests to improve perceived performance.
