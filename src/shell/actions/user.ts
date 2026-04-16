'use server';

import { searchUsers as dbSearchUsers, getUserProfile, updateUserProfile } from "@/shell/db/user";
import { ActionResult, UserProfile } from "@/core/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shell/auth";
import { UpdateProfileSchema } from "@/core/validation";
import { uploadToS3 } from "@/shell/media/s3";
import { revalidatePath } from "next/cache";

export async function searchUsersAction(query: string): Promise<UserProfile[]> {
  return dbSearchUsers(query);
}

export async function getProfileAction(username: string): Promise<UserProfile | null> {
  return getUserProfile(username);
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult<void>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  const username = formData.get("username") as string;
  const bio = formData.get("bio") as string;
  const avatarFile = formData.get("avatar") as File | null;

  // Validate
  const result = UpdateProfileSchema.safeParse({ username, bio });
  if (!result.success) {
    return { 
      success: false, 
      error: "Validation failed", 
      fieldErrors: result.error.flatten().fieldErrors 
    };
  }

  try {
    let avatarUrl: string | undefined;
    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const fileName = `avatars/${userId}-${Date.now()}-${avatarFile.name}`;
      avatarUrl = await uploadToS3(buffer, fileName, avatarFile.type);
    }

    await updateUserProfile(userId, {
      username: result.data.username,
      bio: result.data.bio,
      ...(avatarUrl ? { avatarUrl } : {}),
    });

    revalidatePath(`/profile/${result.data.username}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { success: false, error: "Failed to update profile. Please try again." };
  }
}
