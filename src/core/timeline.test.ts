import { describe, it, expect } from 'vitest';
import { sortPostsTemporally, filterPostsByFriends } from './timeline';
import { Post } from './types';

describe('Timeline Logic', () => {
  const mockPosts: Post[] = [
    {
      id: '1',
      authorId: 'alice',
      authorName: 'Alice',
      content: 'Hello from Alice',
      type: 'TEXT',
      createdAt: new Date('2024-04-12T10:00:00Z'),
    },
    {
      id: '2',
      authorId: 'bob',
      authorName: 'Bob',
      content: 'Hello from Bob',
      type: 'TEXT',
      createdAt: new Date('2024-04-12T11:00:00Z'),
    },
  ];

  it('should sort posts in reverse-chronological order', () => {
    const sorted = sortPostsTemporally(mockPosts);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
  });

  it('should filter posts by a set of friend IDs', () => {
    const filtered = filterPostsByFriends(mockPosts, ['alice']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].authorId).toBe('alice');
  });
});
