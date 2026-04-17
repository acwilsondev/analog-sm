import { z } from 'zod';

export const USERNAME_MAX_LENGTH = 20;

export const CreatePostSchema = z.object({
  // min(1) is enforced in the action when there are no media files
  content: z.string().max(5000, "Post is too long"),
  mediaUrls: z.array(z.string().url()).max(10, "Maximum 10 photos per set").optional(),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(USERNAME_MAX_LENGTH)
    .refine(v => !/\s/.test(v), "Username cannot contain spaces")
    .refine(v => !/[/\\?#%]/.test(v), "Username cannot contain / \\ ? # or %"),
  bio: z.string().max(160).optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
