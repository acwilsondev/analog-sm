import { describe, it, expect } from 'vitest';
import { canSendFriendRequest, transitionFriendship } from './friendship';

describe('Friendship Logic', () => {
  it('should allow sending friend request when status is NONE', () => {
    expect(canSendFriendRequest('alice', 'bob', 'NONE')).toBe(true);
  });

  it('should not allow sending friend request to self', () => {
    expect(canSendFriendRequest('alice', 'alice', 'NONE')).toBe(false);
  });

  it('should not allow sending friend request when already PENDING', () => {
    expect(canSendFriendRequest('alice', 'bob', 'PENDING')).toBe(false);
  });

  it('should transition from PENDING to ACCEPTED on ACCEPT action', () => {
    expect(transitionFriendship('PENDING', 'ACCEPT')).toBe('ACCEPTED');
  });

  it('should transition from PENDING to NONE on REJECT action', () => {
    expect(transitionFriendship('PENDING', 'REJECT')).toBe('NONE');
  });

  it('should transition from ACCEPTED to NONE on CANCEL action', () => {
    expect(transitionFriendship('ACCEPTED', 'CANCEL')).toBe('NONE');
  });
});
