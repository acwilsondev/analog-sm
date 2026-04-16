'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Post } from '@/core/types';
import { loadMorePostsAction } from '@/shell/actions/timeline';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';
import { MediaGrid } from '@/components/MediaGrid';

interface LoadMoreProps {
  initialCursor: string | null;
}

function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar seed={post.authorId} username={post.authorName} avatarUrl={post.authorAvatar} />
        <div className="flex flex-col">
          <span className="font-semibold">{post.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt))} ago
          </span>
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
      </div>
      {post.type === 'PHOTO_SET' && <MediaGrid urls={post.mediaUrls} />}
    </article>
  );
}

export function LoadMore({ initialCursor }: LoadMoreProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isPending) {
          startTransition(async () => {
            const page = await loadMorePostsAction(cursor);
            setPosts(prev => [...prev, ...page.posts]);
            setCursor(page.nextCursor);
          });
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [cursor, isPending]);

  return (
    <>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      {cursor && (
        <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
          {isPending ? 'Loading…' : ''}
        </div>
      )}
    </>
  );
}
