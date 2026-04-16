# Epic 4: The Timeline

This epic focuses on presenting content in a simple, honest, and anti-algorithmic feed.

## User Stories

### Feed Experience

- **As a user (US9),** I want to see a feed of posts from my friends in **strictly reverse-chronological order**.
- **As a user (US10),** I want the timeline to be simple, with no "Recommended" or "Sponsored" content.

## Technical Tasks

- Implement a main timeline query that sorts posts from friends by `createdAt` in descending order.
- (FR7) Implement graceful error handling for the feed display.
- Ensure the UI remains clean and "low-noise" (no algorithm-driven sidebars).
- Optimize initial page load for the timeline (< 1.5s).
- Ensure the feed is fully responsive for mobile devices.
