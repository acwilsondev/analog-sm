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
    const inbound = (user as any).sentRequests?.[0]; // viewer is receiver
    const outbound = (user as any).receivedRequests?.[0]; // viewer is requester
    const friendship = inbound || outbound;
    
    if (friendship) {
      friendshipStatus = friendship.status as any;
    }
  }

  return {
    id: user.id,
    username: user.username,
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
      username: { contains: query, mode: 'insensitive' },
    },
    take: 20,
  });

  // Map each user (ideally in parallel or with a more efficient query)
  return Promise.all(users.map(u => getUserProfile(u.username, viewerId))) as any;
};

export const updateUserProfile = async (
  userId: string,
  data: { username?: string; bio?: string; avatarUrl?: string }
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
};
