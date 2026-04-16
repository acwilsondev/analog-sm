'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 border rounded-xl bg-card shadow-sm">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="p-2 border rounded-md bg-transparent" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Password</label>
          <input name="password" type="password" required className="p-2 border rounded-md bg-transparent" />
        </div>
        <button type="submit" className="mt-2 bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-colors">
          Login
        </button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Don't have an account? <a href="/register" className="underline">Register</a>
      </div>
    </div>
  );
}
