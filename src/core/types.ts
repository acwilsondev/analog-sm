export type PostType = 'TEXT' | 'PHOTO_SET';

export interface BasePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  type: PostType;
}

export interface TextPost extends BasePost {
  type: 'TEXT';
}

export interface PhotoSetPost extends BasePost {
  type: 'PHOTO_SET';
  mediaUrls: string[];
}

export type Post = TextPost | PhotoSetPost;

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isFriend: boolean;
  friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED';
}

export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
