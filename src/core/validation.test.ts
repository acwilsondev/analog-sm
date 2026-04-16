import { describe, it, expect } from 'vitest';
import { CreatePostSchema, UpdateProfileSchema } from './validation';

describe('Validation Schemas', () => {
  describe('CreatePostSchema', () => {
    it('should validate a correct post', () => {
      const input = { content: 'Hello world' };
      expect(CreatePostSchema.safeParse(input).success).toBe(true);
    });

    it('should validate a post with media', () => {
      const input = { content: 'Photo set', mediaUrls: ['http://example.com/1.jpg'] };
      expect(CreatePostSchema.safeParse(input).success).toBe(true);
    });

    it('should fail if content is empty', () => {
      const input = { content: '' };
      expect(CreatePostSchema.safeParse(input).success).toBe(false);
    });

    it('should fail if too many media URLs', () => {
      const input = { 
        content: 'Too many', 
        mediaUrls: Array(11).fill('http://example.com/pic.jpg') 
      };
      expect(CreatePostSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('UpdateProfileSchema', () => {
    it('should validate a correct profile', () => {
      const input = { username: 'alice_123', bio: 'Living my best life' };
      expect(UpdateProfileSchema.safeParse(input).success).toBe(true);
    });

    it('should fail for invalid characters in username', () => {
      const input = { username: 'alice!123' };
      expect(UpdateProfileSchema.safeParse(input).success).toBe(false);
    });

    it('should fail for short username', () => {
      const input = { username: 'al' };
      expect(UpdateProfileSchema.safeParse(input).success).toBe(false);
    });
  });
});
