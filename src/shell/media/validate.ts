export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_POST = 10;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function detectMimeType(buffer: Buffer): string | null {
  const hex = buffer.subarray(0, 12).toString('hex');
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export function validateImageBuffer(buffer: Buffer): { ok: true; mime: string } | { ok: false; error: string } {
  if (buffer.length > MAX_FILE_SIZE) {
    return { ok: false, error: 'File too large (max 10MB)' };
  }
  const mime = detectMimeType(buffer);
  if (!mime) {
    return { ok: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP.' };
  }
  return { ok: true, mime };
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'upload';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

export function validateFileCount(files: File[]): string | null {
  const nonEmpty = files.filter(f => f.size > 0);
  if (nonEmpty.length > MAX_FILES_PER_POST) {
    return `Too many files (max ${MAX_FILES_PER_POST})`;
  }
  return null;
}
