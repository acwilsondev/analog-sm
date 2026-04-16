'use client';

import { useTransition } from 'react';
import { adminBanUserAction, adminPromoteUserAction } from '@/shell/actions/admin';

interface AdminUserRowProps {
  user: { id: string; username: string; email: string; role: string };
  currentUserId: string;
}

export default function AdminUserRow({ user, currentUserId }: AdminUserRowProps) {
  const [isPending, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;

  function handleBan() {
    if (!confirm(`Ban and delete user "${user.username}"? This is irreversible.`)) return;
    startTransition(async () => { await adminBanUserAction(user.id); });
  }

  function handlePromote() {
    startTransition(async () => { await adminPromoteUserAction(user.id); });
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{user.username}</td>
      <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          {user.role}
        </span>
      </td>
      <td className="px-4 py-2 text-right flex justify-end gap-2">
        {!isSelf && user.role !== 'ADMIN' && (
          <button
            onClick={handlePromote}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors disabled:opacity-50"
          >
            Promote
          </button>
        )}
        {!isSelf && (
          <button
            onClick={handleBan}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
          >
            Ban
          </button>
        )}
        {isSelf && <span className="text-xs text-muted-foreground">You</span>}
      </td>
    </tr>
  );
}
