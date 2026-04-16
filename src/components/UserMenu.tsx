'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

interface UserMenuProps {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export function UserMenu({ userId, username, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
        <Avatar seed={userId} username={username} avatarUrl={avatarUrl} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-popover shadow-md z-50 overflow-hidden">
          <div className="px-3 py-2 border-b">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold truncate">{username}</p>
          </div>
          <Link
            href={`/profile/${username}`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
