import { Post } from './types';

/**
 * Pure function to sort posts by creation date in strictly temporal (reverse-chronological) order.
 * This is a core requirement of Analog SM.
 */
export const sortPostsTemporally = (posts: Post[]): Post[] => {
  return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

/**
 * Pure function to filter posts to only include those from a list of friend IDs.
 */
export const filterPostsByFriends = (posts: Post[], friendIds: string[]): Post[] => {
  const friendSet = new Set(friendIds);
  return posts.filter(post => friendSet.has(post.authorId));
};
