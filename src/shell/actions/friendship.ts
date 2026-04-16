'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/shell/db/client';
import { transitionFriendship, canSendFriendRequest } from '@/core/friendship';
import { ActionResult } from '@/core/types';

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
  const receiverId = targetUserId;

  // 1. Fetch current status
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: senderId, receiverId },
        { requesterId: receiverId, receiverId: senderId },
      ],
    },
  });

  const currentStatus = (existing?.status as any) || 'NONE';

  // 2. Validate using Functional Core
  if (!canSendFriendRequest(senderId, receiverId, currentStatus)) {
    return { success: false, error: "Cannot send friend request" };
  }

  // 3. Side Effect
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

  // Authorization check: only receiver can ACCEPT/REJECT, only requester can CANCEL
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
