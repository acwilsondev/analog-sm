'use server';

import { getFriendTimeline, TimelinePage } from '@/shell/db/post';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shell/auth';

export async function loadMorePostsAction(cursor: string): Promise<TimelinePage> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { posts: [], nextCursor: null };

  const userId = (session.user as any).id;
  return getFriendTimeline(userId, cursor);
}
