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

export interface TimelinePage {
  posts: Post[];
  nextCursor: string | null;
}

export const getFriendTimeline = async (
  userId: string,
  cursor?: string,
  limit = 20
): Promise<TimelinePage> => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' },
      ],
    },
  });

  const friendIds = friendships.map(f =>
    f.requesterId === userId ? f.receiverId : f.requesterId
  );
  friendIds.push(userId);

  const posts = await prisma.post.findMany({
    where: { authorId: { in: friendIds } },
    include: {
      author: true,
      media: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;

  return {
    posts: page.map(mapPrismaPostToCore),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
};

// Internal mapper
function mapPrismaPostToCore(post: any): Post {
  const base = {
    id: post.id,
    authorId: post.authorId,
    authorName: post.author.displayName ?? post.author.username,
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
