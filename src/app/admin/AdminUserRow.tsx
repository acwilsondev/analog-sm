'use client';

import { useTransition, useState, useRef } from 'react';
import { adminBanUserAction, adminPromoteUserAction, adminDemoteUserAction } from '@/shell/actions/admin';

interface AdminUserRowProps {
  user: { id: string; username: string; email: string; role: string };
  currentUserId: string;
  viewerRole: string;
}

function PromoteModal({ username, onConfirm, onCancel }: {
  username: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) { setError('Password is required'); return; }
    onConfirm(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="bg-card border rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="font-semibold text-base">Promote to Admin</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Confirm your password to promote <span className="font-medium text-foreground">{username}</span>.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            autoFocus
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUserRow({ user, currentUserId, viewerRole }: AdminUserRowProps) {
  const [isPending, startTransition] = useTransition();
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteError, setPromoteError] = useState('');

  const isSelf = user.id === currentUserId;
  const isOwner = viewerRole === 'OWNER';
  const targetIsElevated = user.role === 'ADMIN' || user.role === 'OWNER';
  const targetIsOwner = user.role === 'OWNER';

  function handleBan() {
    if (!confirm(`Ban and delete user "${user.username}"? This is irreversible.`)) return;
    startTransition(async () => { await adminBanUserAction(user.id); });
  }

  function handlePromoteConfirm(password: string) {
    setShowPromoteModal(false);
    startTransition(async () => {
      const result = await adminPromoteUserAction(user.id, password);
      if (!result.success) setPromoteError(result.error);
    });
  }

  function handleDemote() {
    if (!confirm(`Demote "${user.username}" from admin to user?`)) return;
    startTransition(async () => { await adminDemoteUserAction(user.id); });
  }

  const roleBadge = {
    OWNER: 'bg-amber-500 text-white',
    ADMIN: 'bg-primary text-primary-foreground',
    USER:  'bg-secondary text-secondary-foreground',
  }[user.role] ?? 'bg-secondary text-secondary-foreground';

  return (
    <>
      <tr className="border-t">
        <td className="px-4 py-2 font-medium">{user.username}</td>
        <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
        <td className="px-4 py-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadge}`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-2 text-right">
          {isSelf ? (
            <span className="text-xs text-muted-foreground">You</span>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <div className="flex justify-end gap-2">
                {!targetIsElevated && (
                  <button onClick={() => { setPromoteError(''); setShowPromoteModal(true); }} disabled={isPending}
                    className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors disabled:opacity-50">
                    Promote
                  </button>
                )}
                {isOwner && user.role === 'ADMIN' && (
                  <button onClick={handleDemote} disabled={isPending}
                    className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors disabled:opacity-50">
                    Demote
                  </button>
                )}
                {!targetIsElevated && (
                  <button onClick={handleBan} disabled={isPending}
                    className="text-xs px-2 py-1 rounded border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50">
                    Ban
                  </button>
                )}
                {targetIsElevated && !targetIsOwner && !isOwner && (
                  <span className="text-xs text-muted-foreground">Protected</span>
                )}
              </div>
              {promoteError && <p className="text-xs text-destructive">{promoteError}</p>}
            </div>
          )}
        </td>
      </tr>

      {showPromoteModal && (
        <PromoteModal
          username={user.username}
          onConfirm={handlePromoteConfirm}
          onCancel={() => setShowPromoteModal(false)}
        />
      )}
    </>
  );
}
