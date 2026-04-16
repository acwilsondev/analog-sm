'use client';

import { useState, useRef } from 'react';
import { createPostAction } from '@/shell/actions/post';

export default function PostForm() {
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !fileInputRef.current?.files?.length) return;

    setIsPending(true);
    const formData = new FormData();
    formData.append('content', content);
    
    const files = fileInputRef.current?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
      }
    }

    const result = await createPostAction(formData);
    if (result.success) {
      setContent('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      alert(result.error);
    }
    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 shadow-sm">
      <textarea 
        placeholder="What's on your mind?" 
        className="w-full resize-none bg-transparent outline-none min-h-[100px]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      
      <div className="mt-4 flex flex-col gap-4 border-t pt-4">
        <input 
          type="file" 
          multiple 
          accept="image/*"
          ref={fileInputRef}
          className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
        />
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
