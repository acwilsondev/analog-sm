'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/shell/db/client';
import { transitionFriendship, canSendFriendRequest } from '@/core/friendship';
import { ActionResult } from '@/core/types';
import { rateLimit } from '@/shell/ratelimit';

import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";

export async function sendRequestAction(
  targetUserId: string
): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const senderId = (session.user as any).id;

  // 20 friend requests per hour per user
  if (!rateLimit(`friendRequest:${senderId}`, 20, 60 * 60 * 1000)) {
    return { success: false, error: 'Too many friend requests. Please slow down.' };
  }

  const receiverId = targetUserId;

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: senderId, receiverId },
        { requesterId: receiverId, receiverId: senderId },
      ],
    },
  });

  const currentStatus = (existing?.status as any) || 'NONE';

  if (!canSendFriendRequest(senderId, receiverId, currentStatus)) {
    return { success: false, error: "Cannot send friend request" };
  }

  await prisma.friendship.upsert({
    where: { requesterId_receiverId: { requesterId: senderId, receiverId } },
    update: { status: 'PENDING' },
    create: { requesterId: senderId, receiverId, status: 'PENDING' },
  });

  revalidatePath(`/profile/${receiverId}`);
  return { success: true, data: undefined };
}

export async function handleRequestAction(
  requestId: string,
  action: 'ACCEPT' | 'REJECT' | 'CANCEL'
): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  const request = await prisma.friendship.findUnique({
    where: { id: requestId },
  });

  if (!request) return { success: false, error: "Request not found" };

  // The requestId is client-supplied but validated here against the session user —
  // only the receiver can ACCEPT/REJECT, only the requester can CANCEL (MED-03).
  if (action === 'ACCEPT' || action === 'REJECT') {
    if (request.receiverId !== userId) {
      return { success: false, error: "Unauthorized" };
    }
  } else if (action === 'CANCEL') {
    if (request.requesterId !== userId) {
      return { success: false, error: "Unauthorized" };
    }
  }

  const currentStatus = request.status as any;
  const newStatus = transitionFriendship(currentStatus, action);

  if (newStatus === 'NONE') {
    await prisma.friendship.delete({ where: { id: requestId } });
  } else {
    await prisma.friendship.update({
      where: { id: requestId },
      data: { status: newStatus },
    });
  }

  revalidatePath('/');
  return { success: true, data: undefined };
}
