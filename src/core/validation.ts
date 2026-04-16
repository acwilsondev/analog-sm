import { z } from 'zod';

export const CreatePostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(5000, "Post is too long"),
  mediaUrls: z.array(z.string().url()).max(10, "Maximum 10 photos per set").optional(),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  bio: z.string().max(160).optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
