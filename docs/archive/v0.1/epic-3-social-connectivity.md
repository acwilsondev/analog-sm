# Epic 3: Social Connectivity

This epic focuses on allowing users to discover and connect with others on the instance.

## User Stories

### Discover & Connect

- **As a user (US6),** I want to search for other users on the instance by username.
- **As a user (US7),** I want to send and accept "Friend Requests" to establish a mutual connection.
- **As a user (US8),** I want to see a list of my friends.

## Technical Tasks

- Implement a search bar and results page for discovery.
- Create a `Friendship` database table and status transition logic (Pending -> Accepted).
- (FR10) Ensure profile search links have basic SEO meta tags.
- Implement a friends list view with avatars and bios.
- Add notification logic for friend requests.
- Implement security checks for private instance search restrictions.
