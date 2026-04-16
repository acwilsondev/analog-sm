import { getUserProfile } from "@/shell/db/user";
import prisma from "@/shell/db/client";
import { formatDistanceToNow } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import FriendButton from "@/components/FriendButton";

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
      <div className="flex flex-col items-center gap-4 text-center p-8 border rounded-xl bg-card shadow-sm">
        <div className="h-24 w-24 rounded-full bg-muted shadow-inner" />
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">{user.bio || 'No bio provided'}</p>
        </div>
        
        {!isOwnProfile && (
          <div className="flex gap-4 mt-2">
             <FriendButton 
               currentUserId={currentUserId}
               targetUserId={user.id}
               initialStatus={initialStatus}
               isReceiver={isReceiver}
               requestId={friendship?.id}
             />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-bold px-1">Posts</h2>
        {posts.map((post) => (
          <article key={post.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
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
