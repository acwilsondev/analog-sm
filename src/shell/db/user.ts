import prisma from './client';
import { UserProfile } from '@/core/types';

export const getUserProfile = async (
  username: string,
  viewerId?: string
): Promise<UserProfile | null> => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      receivedRequests: viewerId ? { where: { requesterId: viewerId } } : false,
      sentRequests: viewerId ? { where: { receiverId: viewerId } } : false,
    },
  });

  if (!user) return null;

  let friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED' = 'NONE';

  if (viewerId) {
    const inbound = (user as any).sentRequests?.[0];
    const outbound = (user as any).receivedRequests?.[0];
    const friendship = inbound || outbound;
    if (friendship) {
      friendshipStatus = friendship.status as any;
    }
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || undefined,
    bio: user.bio || undefined,
    avatarUrl: user.avatarUrl || undefined,
    isFriend: friendshipStatus === 'ACCEPTED',
    friendshipStatus,
  };
};

export const searchUsers = async (
  query: string,
  viewerId?: string
): Promise<UserProfile[]> => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
  });

  return Promise.all(users.map(u => getUserProfile(u.username, viewerId))) as any;
};

export const updateUserProfile = async (
  userId: string,
  data: { username?: string; displayName?: string | null; bio?: string; avatarUrl?: string }
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
};
