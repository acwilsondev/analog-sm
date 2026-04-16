import prisma from './client';
import { Post, PostType } from '@/core/types';

export const getPostById = async (id: string): Promise<Post | null> => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      media: { orderBy: { order: 'asc' } },
    },
  });

  if (!post) return null;

  return mapPrismaPostToCore(post);
};

export const getFriendTimeline = async (userId: string): Promise<Post[]> => {
  // 1. Get friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' },
      ],
    },
  });

  const friendIds = friendships.map(f => f.requesterId === userId ? f.receiverId : f.requesterId);
  // Include self posts too
  friendIds.push(userId);

  // 2. Fetch posts from those friends
  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: friendIds },
    },
    include: {
      author: true,
      media: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return posts.map(mapPrismaPostToCore);
};

// Internal mapper
function mapPrismaPostToCore(post: any): Post {
  const base = {
    id: post.id,
    authorId: post.authorId,
    authorName: post.author.username,
    authorAvatar: post.author.avatarUrl || undefined,
    content: post.content,
    createdAt: post.createdAt,
    type: post.type as PostType,
  };

  if (post.type === 'PHOTO_SET') {
    return {
      ...base,
      type: 'PHOTO_SET',
      mediaUrls: post.media.map((m: any) => m.url),
    };
  }

  return {
    ...base,
    type: 'TEXT',
  };
}
