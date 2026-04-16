'use client';

import { useState } from 'react';
import { UserProfile } from '@/core/types';
import { searchUsersAction } from '@/shell/actions/user';
import Link from 'next/link';

export default function SearchClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const users = await searchUsersAction(q);
    setResults(users);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Search Users</h1>
      <input
        type="text"
        placeholder="Search by username..."
        className="p-3 border rounded-xl bg-card shadow-sm outline-none w-full"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <div className="flex flex-col gap-2">
        {results.map((user) => (
          <Link 
            key={user.id} 
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 p-4 border rounded-xl bg-card hover:bg-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex flex-col">
              <span className="font-semibold">{user.username}</span>
              <span className="text-xs text-muted-foreground">{user.bio || 'No bio'}</span>
            </div>
          </Link>
        ))}
        {query.length >= 2 && results.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No users found.</div>
        )}
      </div>
    </div>
  );
}
