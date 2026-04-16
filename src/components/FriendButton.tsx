'use client';

import { useState } from 'react';
import { sendRequestAction, handleRequestAction } from '@/shell/actions/friendship';

interface FriendButtonProps {
  currentUserId: string;
  targetUserId: string;
  initialStatus: 'PENDING' | 'ACCEPTED' | 'NONE';
  isReceiver?: boolean; // If true, the current user is the receiver of a pending request
  requestId?: string;
}

export default function FriendButton({ 
  currentUserId, 
  targetUserId, 
  initialStatus,
  isReceiver,
  requestId
}: FriendButtonProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    setLoading(true);
    const res = await sendRequestAction(currentUserId, targetUserId);
    if (res.success) setStatus('PENDING');
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!requestId) return;
    setLoading(true);
    const res = await handleRequestAction(currentUserId, requestId, 'ACCEPT');
    if (res.success) setStatus('ACCEPTED');
    setLoading(false);
  };

  if (status === 'ACCEPTED') {
    return (
      <button disabled className="px-6 py-2 rounded-full bg-secondary text-secondary-foreground font-medium shadow">
        Friends
      </button>
    );
  }

  if (status === 'PENDING') {
    if (isReceiver) {
      return (
        <button 
          onClick={handleAccept} 
          disabled={loading}
          className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow hover:scale-105 transition-transform"
        >
          {loading ? '...' : 'Accept Request'}
        </button>
      );
    }
    return (
      <button disabled className="px-6 py-2 rounded-full bg-muted text-muted-foreground font-medium shadow">
        Request Sent
      </button>
    );
  }

  return (
    <button 
      onClick={handleSendRequest} 
      disabled={loading}
      className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow hover:scale-105 transition-transform"
    >
      {loading ? '...' : 'Add Friend'}
    </button>
  );
}
