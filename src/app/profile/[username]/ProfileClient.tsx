'use client';

import { useState } from 'react';
import { UserProfile } from '@/core/types';
import Avatar from '@/components/Avatar';
import FriendButton from '@/components/FriendButton';
import EditProfileForm from '@/components/EditProfileForm';

interface ProfileClientProps {
  user: UserProfile;
  isOwnProfile: boolean;
  initialStatus: any;
  isReceiver: boolean;
  requestId?: string;
}

export default function ProfileClient({
  user,
  isOwnProfile,
  initialStatus,
  isReceiver,
  requestId
}: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4 text-center p-8 border rounded-xl bg-card shadow-sm">
      {!isEditing ? (
        <>
          <Avatar seed={user.id} username={user.username} avatarUrl={user.avatarUrl} size="xl" />
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">{user.bio || 'No bio provided'}</p>
          </div>
          
          {isOwnProfile ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-4 px-6 py-2 bg-secondary text-secondary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-4 mt-2">
               <FriendButton 
                 targetUserId={user.id}
                 initialStatus={initialStatus}
                 isReceiver={isReceiver}
                 requestId={requestId}
               />
            </div>
          )}
        </>
      ) : (
        <div className="w-full max-w-md text-left">
          <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
          <EditProfileForm user={user} onCancel={() => setIsEditing(false)} />
        </div>
      )}
    </div>
  );
}
