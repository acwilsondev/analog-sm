'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/shell/db/client';
import { ActionResult } from '@/core/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shell/auth';
import { verifyPassword } from '@/core/auth';

async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as any).role as string;
  if (role !== 'ADMIN' && role !== 'OWNER') return null;
  return session;
}

function isElevated(role: string) {
  return role === 'ADMIN' || role === 'OWNER';
}

export async function adminDeletePostAction(postId: string): Promise<ActionResult<void>> {
  const session = await getAdminSession();
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
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const currentUserId = (session.user as any).id;
  if (userId === currentUserId) return { success: false, error: 'Cannot ban yourself' };

  // Admins and owners are immune to banning
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { success: false, error: 'User not found' };
  if (isElevated(target.role)) return { success: false, error: 'Admins cannot be banned' };

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to ban user' };
  }
}

export async function adminPromoteUserAction(userId: string, password: string): Promise<ActionResult<void>> {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const currentUserId = (session.user as any).id;
  const caller = await prisma.user.findUnique({ where: { id: currentUserId }, select: { passwordHash: true } });
  if (!caller) return { success: false, error: 'Unauthorized' };

  const passwordValid = await verifyPassword(password, caller.passwordHash);
  if (!passwordValid) return { success: false, error: 'Incorrect password' };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { success: false, error: 'User not found' };
  if (isElevated(target.role)) return { success: false, error: 'User is already an admin' };

  try {
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to promote user' };
  }
}

export async function adminDemoteUserAction(userId: string): Promise<ActionResult<void>> {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  // Only OWNER can demote admins
  const viewerRole = (session.user as any).role as string;
  if (viewerRole !== 'OWNER') return { success: false, error: 'Only the owner can demote admins' };

  const currentUserId = (session.user as any).id;
  if (userId === currentUserId) return { success: false, error: 'Cannot demote yourself' };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { success: false, error: 'User not found' };
  if (target.role === 'OWNER') return { success: false, error: 'Cannot demote the owner' };

  try {
    await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } });
    revalidatePath('/admin');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to demote user' };
  }
}

const ALLOWED_SETTING_KEYS = ['registrations_open'] as const;

export async function adminSetGlobalSettingAction(
  key: string,
  value: string
): Promise<ActionResult<void>> {
  const session = await getAdminSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  if (!ALLOWED_SETTING_KEYS.includes(key as (typeof ALLOWED_SETTING_KEYS)[number])) {
    return { success: false, error: 'Invalid setting key' };
  }

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
