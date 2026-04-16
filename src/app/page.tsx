import { getFriendTimeline } from "@/shell/db/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import PostForm from "@/components/PostForm";
import Avatar from "@/components/Avatar";

export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = (session.user as any).id;
  const posts = await getFriendTimeline(currentUserId);

  return (
    <div className="flex flex-col gap-6">
      <PostForm />

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
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

            {post.type === 'PHOTO_SET' && (
              <div className="grid grid-cols-2 gap-px border-t bg-muted">
                {post.mediaUrls.map((url, i) => (
                  <div key={i} className="aspect-square bg-white">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}

        {posts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No posts to show. Add some friends to see their updates!
          </div>
        )}
      </div>
    </div>
  );
}
