'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/shell/db/client';
import { CreatePostSchema } from '@/core/validation';
import { ActionResult, Post } from '@/core/types';
import { getPostById } from '@/shell/db/post';
import { uploadToS3 } from '@/shell/media/s3';

import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";

export async function createPostAction(
  formData: FormData
): Promise<ActionResult<Post>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  const content = formData.get('content') as string;
  const files = formData.getAll('media') as File[];

  // 1. Validation (Schema only for content for now)
  const validation = CreatePostSchema.safeParse({ content });
  if (!validation.success) {
    return { success: false, error: "Validation failed", fieldErrors: validation.error.flatten().fieldErrors };
  }

  try {
    const mediaUrls: string[] = [];

    // 2. Upload Files to S3 (Shell Side Effect)
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${userId}-${Date.now()}-${file.name}`;
        const url = await uploadToS3(buffer, fileName, file.type);
        mediaUrls.push(url);
      }
    }

    // 3. Create Post in DB
    const post = await prisma.post.create({
      data: {
        authorId: userId,
        content: validation.data.content,
        type: mediaUrls.length > 0 ? 'PHOTO_SET' : 'TEXT',
        media: {
          create: mediaUrls.map((url, index) => ({
            url,
            order: index,
          })),
        },
      },
    });

    const result = await getPostById(post.id);
    revalidatePath('/');
    
    return { success: true, data: result! };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create post" };
  }
}

export async function deletePostAction(
  postId: string
): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post || post.authorId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.post.delete({ where: { id: postId } });
    revalidatePath('/');
    
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: "Failed to delete post" };
  }
}
