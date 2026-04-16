'use client';

import { useState, useRef, useCallback } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { createPostAction } from '@/shell/actions/post';

export default function PostForm() {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function open() {
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function close() {
    setExpanded(false);
    setContent('');
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setPreviews(prev => [...prev, ...arr.map(f => ({ url: URL.createObjectURL(f), file: f }))]);
  }

  function removePreview(index: number) {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (!expanded) setExpanded(true);
  }, [expanded]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !previews.length) return;
    setIsPending(true);
    const formData = new FormData();
    formData.append('content', content);
    for (const { file } of previews) formData.append('media', file);
    const result = await createPostAction(formData);
    if (result.success) {
      close();
    } else {
      alert(result.error);
    }
    setIsPending(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-xl border bg-card shadow-sm transition-colors duration-150 ${isDragging ? 'border-primary bg-primary/5' : ''}`}
    >
      {/* Textarea — always rendered, animates height */}
      <div className="px-4 pt-3" onClick={!expanded ? open : undefined}>
        <textarea
          ref={textareaRef}
          placeholder="What's on your mind?"
          readOnly={!expanded}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ height: expanded ? '5rem' : '1.5rem' }}
          className={`w-full resize-none bg-transparent outline-none text-sm overflow-hidden transition-[height] duration-200 ease-in-out ${
            expanded ? 'text-foreground cursor-text' : 'text-muted-foreground cursor-pointer'
          }`}
        />
      </div>

      {/* Expandable section — grid-rows trick for smooth height animation */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {previews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {previews.map(({ url }, i) => (
                  <div key={url} className="relative group h-20 w-20 rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isDragging && !previews.length && (
              <div className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-primary h-14 text-sm text-primary">
                Drop photos here
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach photos"
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <ImageIcon size={18} />
                </button>
                {previews.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {previews.length} photo{previews.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files) addFiles(e.target.files); }}
      />
    </form>
  );
}
