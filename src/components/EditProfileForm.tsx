'use client';

import { useState } from 'react';
import { UserProfile, ActionResult } from '@/core/types';
import { updateProfileAction } from '@/shell/actions/user';
import { useRouter } from 'next/navigation';

interface EditProfileFormProps {
  user: UserProfile;
  onCancel: () => void;
}

export default function EditProfileForm({ user, onCancel }: EditProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    setFieldErrors(undefined);

    const result = await updateProfileAction(formData);

    if (result.success) {
      const newUsername = formData.get('username') as string;
      router.push(`/profile/${newUsername}`);
      onCancel();
    } else {
      setError(result.error);
      setFieldErrors(result.fieldErrors);
    }
    setIsPending(false);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 p-6 border rounded-xl bg-muted/30">
      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm font-semibold">Display Name</label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          defaultValue={user.displayName ?? ''}
          placeholder={user.username}
          maxLength={50}
          className="p-2 border rounded-md bg-background"
        />
        <p className="text-xs text-muted-foreground">Shown in the UI. Can include spaces, emoji, etc. Falls back to username if left blank.</p>
        {fieldErrors?.displayName && (
          <p className="text-xs text-destructive">{fieldErrors.displayName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-semibold">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          defaultValue={user.username}
          className="p-2 border rounded-md bg-background"
          required
        />
        <p className="text-xs text-muted-foreground">Used in your profile URL. Letters, numbers, underscores, and hyphens only.</p>
        {fieldErrors?.username && (
          <p className="text-xs text-destructive">{fieldErrors.username[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="bio" className="text-sm font-semibold">Bio</label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={user.bio}
          className="p-2 border rounded-md bg-background min-h-[100px]"
        />
        {fieldErrors?.bio && (
          <p className="text-xs text-destructive">{fieldErrors.bio[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="avatar" className="text-sm font-semibold">Avatar</label>
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/*"
          className="text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

      <div className="flex gap-3 mt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary text-primary-foreground p-2 rounded-md font-semibold disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border p-2 rounded-md font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
