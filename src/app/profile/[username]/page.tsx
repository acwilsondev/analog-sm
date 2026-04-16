import { getUserProfile } from "@/shell/db/user";
import prisma from "@/shell/db/client";
import Avatar from "@/components/Avatar";
import { formatDistanceToNow } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import ProfileClient from "./ProfileClient";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = (session.user as any).id;
  const user = await getUserProfile(params.username);
  
  if (!user) {
    return notFound();
  }

  const isOwnProfile = currentUserId === user.id;

  // Get friendship status
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, receiverId: user.id },
        { requesterId: user.id, receiverId: currentUserId },
      ],
    },
  });

  const initialStatus = (friendship?.status as any) || 'NONE';
  const isReceiver = friendship?.receiverId === currentUserId;

  // Get user's posts
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    include: { author: true, media: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8">
      <ProfileClient 
        user={user}
        isOwnProfile={isOwnProfile}
        initialStatus={initialStatus}
        isReceiver={isReceiver}
        requestId={friendship?.id}
      />

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold px-1">Posts</h2>
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <Avatar seed={post.author.id} username={post.author.username} avatarUrl={post.author.avatarUrl} />
              <div className="flex flex-col">
                <span className="font-semibold">{post.author.username}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(post.createdAt)} ago
                </span>
              </div>
            </div>
            <div className="px-4 pb-4 text-sm leading-relaxed">
              {post.content}
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            {user.username} hasn't posted anything yet.
          </div>
        )}
      </div>
    </div>
  );
}
