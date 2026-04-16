import { getFriendTimeline } from "@/shell/db/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import PostForm from "@/components/PostForm";
import Avatar from "@/components/Avatar";
import { LoadMore } from "@/components/LoadMore";
import { MediaGrid } from "@/components/MediaGrid";
import { Post } from "@/core/types";

export const dynamic = 'force-dynamic';

function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar seed={post.authorId} username={post.authorName} avatarUrl={post.authorAvatar} />
        <div className="flex flex-col">
          <span className="font-semibold">{post.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(post.createdAt)} ago
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </p>
      </div>

      {post.type === 'PHOTO_SET' && <MediaGrid urls={post.mediaUrls} />}
    </article>
  );
}

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = (session.user as any).id;
  const { posts, nextCursor } = await getFriendTimeline(currentUserId);

  return (
    <div className="flex flex-col gap-6">
      <PostForm />

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        <LoadMore initialCursor={nextCursor} />

        {posts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No posts to show. Add some friends to see their updates!
          </div>
        )}
      </div>
    </div>
  );
}
