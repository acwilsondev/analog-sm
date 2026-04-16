'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/shell/db/client';
import { ActionResult } from '@/core/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shell/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as any).role;
  if (role !== 'ADMIN') return null;
  return session;
}

export async function adminDeletePostAction(postId: string): Promise<ActionResult<void>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.post.delete({ where: { id: postId } });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to delete post' };
  }
}

export async function adminBanUserAction(userId: string): Promise<ActionResult<void>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: 'Unauthorized' };

  const currentUserId = (session.user as any).id;
  if (userId === currentUserId) return { success: false, error: 'Cannot ban yourself' };

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to ban user' };
  }
}

export async function adminPromoteUserAction(userId: string): Promise<ActionResult<void>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to promote user' };
  }
}

export async function adminSetGlobalSettingAction(
  key: string,
  value: string
): Promise<ActionResult<void>> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.globalSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to update setting' };
  }
}
