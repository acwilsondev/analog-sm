'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerAction } from '@/shell/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await registerAction(formData);
    if (result.success) {
      router.push('/login');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 border rounded-xl bg-card shadow-sm">
      <h1 className="text-2xl font-bold">Create an account</h1>
      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Username</label>
          <input name="username" type="text" required className="p-2 border rounded-md bg-transparent" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="p-2 border rounded-md bg-transparent" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Password</label>
          <input name="password" type="password" required className="p-2 border rounded-md bg-transparent" />
        </div>
        <button type="submit" className="mt-2 bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-colors">
          Register
        </button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Already have an account? <a href="/login" className="underline">Sign in</a>
      </div>
    </div>
  );
}
