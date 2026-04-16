import prisma from './client';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'NONE';

export async function getFriendshipStatus(userA: string, userB: string): Promise<FriendshipStatus> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userA, receiverId: userB },
        { requesterId: userB, receiverId: userA },
      ],
    },
  });

  return (friendship?.status as FriendshipStatus) || 'NONE';
}

export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' },
      ],
    },
    include: {
      requester: true,
      receiver: true,
    },
  });

  return friendships.map(f => f.requesterId === userId ? f.receiver : f.requester);
}

export async function getPendingRequests(userId: string) {
  return prisma.friendship.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING',
    },
    include: {
      requester: true,
    },
  });
}
