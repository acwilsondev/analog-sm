# Minimalist UI/UX Guidelines: Analog SM (MVP)

## 1. Aesthetic North Star

The "Analog" look is defined by **clean, high-contrast layouts**, **ample whitespace**, and a focus on **content over chrome**. It should feel like a modern digital living room: functional, calm, and uncluttered.

- **Primary Colors:** Neutral Grays, Blacks, and Whites.
- **Accent Colors:** A single brand color (e.g., Indigo or Slate) used sparingly for primary actions.
- **Typography:** Sans-serif (Geist or Inter) for maximum legibility.

## 2. Component Mapping (Shadcn/UI)

### The Timeline (Feed)

- **Container:** `Card` component for each post.
- **Header:** `Avatar` + `Username` + `Relative Timestamp` (`formatDistanceToNow`).
- **Body:** `Typography` for text. `AspectRatio` for single photos. `Carousel` for photo sets.
- **Actions:** Minimal icons for `Delete` (only for owner). No "Like" or "Share" buttons for MVP (focus on reading).

### Post Creation

- **Trigger:** A fixed `Button` or `Dialog` at the top of the feed.
- **Form:** `Textarea` for content + `Input (file)` for photo uploads.
- **Validation:** Visual feedback using `Form` and `Alert` components for validation errors.

### Social Connectivity

- **User Search:** `Input` with real-time filtering using `Command` or `Combobox`.
- **Friend Requests:** A dedicated "Notifications" `Popover` or `Sheet` for pending requests.

### Navigation

- **Top Nav:** Minimalist sticky header with `Logo`, `Search`, `User Profile Dropdown`.
- **Mobile:** Bottom navigation bar for `Home`, `Search`, `Create`, `Notifications`.

## 3. Interactive Feedback (The "Shell" Experience)

- **Skeletons:** Every async component (Timeline, Profile) MUST show a `Skeleton` state during initial fetch.
- **Toasts:** Use `Sonner` or Shadcn `Toast` for success/error feedback on actions (e.g., "Post deleted").
- **Optimistic UI:** When a user deletes a post, it should immediately disappear from the local state while the server request completes.

## 4. Accessibility (a11y) Standards

- **Contrast:** AA compliance for all text.
- **Keyboard:** All actions (Post, Search, Friend) must be reachable via keyboard.
- **Aria Labels:** Proper labeling for all icon-only buttons.

## 5. Mobile-First Design

- **Touch Targets:** All buttons must be at least 44x44px.
- **Layout:** Single column layout on mobile, transitioning to a centered maximum width (640px - 768px) on desktop.
