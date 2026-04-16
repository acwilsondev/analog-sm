import { UserProfile } from './types';

export type FriendshipStatus = 'NONE' | 'PENDING' | 'ACCEPTED';

/**
 * Pure function to determine if a friend request can be sent.
 * Rules: Cannot friend self, cannot friend if already pending or accepted.
 */
export const canSendFriendRequest = (
  senderId: string,
  receiverId: string,
  currentStatus: FriendshipStatus
): boolean => {
  if (senderId === receiverId) return false;
  return currentStatus === 'NONE';
};

/**
 * Pure function to transition friendship status.
 */
export const transitionFriendship = (
  currentStatus: FriendshipStatus,
  action: 'ACCEPT' | 'REJECT' | 'CANCEL'
): FriendshipStatus => {
  if (currentStatus === 'PENDING') {
    if (action === 'ACCEPT') return 'ACCEPTED';
    if (action === 'REJECT' || action === 'CANCEL') return 'NONE';
  }
  if (currentStatus === 'ACCEPTED' && action === 'CANCEL') {
    return 'NONE';
  }
  return currentStatus;
};
