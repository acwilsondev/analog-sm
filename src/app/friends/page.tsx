import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import { redirect } from "next/navigation";
import { getFriends, getPendingRequests } from "@/shell/db/friendship";
import Link from "next/link";
import FriendButton from "@/components/FriendButton";
import Avatar from "@/components/Avatar";

export const dynamic = 'force-dynamic';

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = (session.user as any).id;
  const friends = await getFriends(currentUserId);
  const pendingRequests = await getPendingRequests(currentUserId);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Friends</h1>

      {pendingRequests.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Pending Requests</h2>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar seed={req.requester.id} username={req.requester.username} avatarUrl={req.requester.avatarUrl} />
                  <span className="font-medium">{req.requester.username}</span>
                </div>
                <FriendButton 
                  currentUserId={currentUserId}
                  targetUserId={req.requesterId}
                  initialStatus="PENDING"
                  isReceiver={true}
                  requestId={req.id}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-muted-foreground">Your Friends</h2>
        <div className="grid grid-cols-1 gap-4">
          {friends.map((friend) => (
            <Link 
              key={friend.id} 
              href={`/profile/${friend.username}`}
              className="flex items-center gap-3 p-4 border rounded-xl bg-card hover:bg-accent transition-colors"
            >
              <Avatar seed={friend.id} username={friend.username} avatarUrl={friend.avatarUrl} size="lg" />
              <div className="flex flex-col">
                <span className="font-semibold">{friend.username}</span>
                <span className="text-xs text-muted-foreground">{friend.bio || 'No bio'}</span>
              </div>
            </Link>
          ))}
          {friends.length === 0 && (
            <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              You haven't added any friends yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
