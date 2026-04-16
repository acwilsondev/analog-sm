'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaGridProps {
  urls: string[];
}

function Img({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      className={`h-full w-full object-cover ${className ?? ''}`}
    />
  );
}

function Lightbox({ urls, startIndex, onClose }: { urls: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);

  function prev() { setIndex(i => (i - 1 + urls.length) % urls.length); }
  function next() { setIndex(i => (i + 1) % urls.length); }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Main image */}
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <img
          src={urls[index]}
          alt=""
          className="max-h-[85vh] max-w-[85vw] object-contain rounded"
        />

        {urls.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 hover:bg-black/80 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 hover:bg-black/80 transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {index + 1} / {urls.length}
            </div>
          </>
        )}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/60 p-1.5 hover:bg-black/80 transition-colors"
      >
        <X size={20} className="text-white" />
      </button>
    </div>
  );
}

export function MediaGrid({ urls }: MediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const count = urls.length;

  function open(i: number) { setLightboxIndex(i); }
  function close() { setLightboxIndex(null); }

  const cell = (url: string, i: number, className?: string) => (
    <button
      key={i}
      onClick={() => open(i)}
      className={`overflow-hidden focus:outline-none ${className ?? ''}`}
    >
      <Img src={url} />
    </button>
  );

  let grid: React.ReactNode;

  if (count === 1) {
    // Full-width, natural 4:3 aspect, show full image (object-contain)
    grid = (
      <button onClick={() => open(0)} className="w-full overflow-hidden focus:outline-none">
        <div className="aspect-[4/3] w-full bg-muted">
          <img src={urls[0]} alt="" className="h-full w-full object-contain" />
        </div>
      </button>
    );
  } else if (count === 2) {
    // Side by side
    grid = (
      <div className="grid grid-cols-2 gap-px">
        {urls.map((url, i) => (
          <div key={i} className="aspect-square">{cell(url, i, 'block h-full w-full')}</div>
        ))}
      </div>
    );
  } else if (count === 3) {
    // Top row: 2 side-by-side; bottom row: 1 spanning full width
    grid = (
      <div className="grid grid-cols-2 gap-px">
        <div className="aspect-square">{cell(urls[0], 0, 'block h-full w-full')}</div>
        <div className="aspect-square">{cell(urls[1], 1, 'block h-full w-full')}</div>
        <div className="col-span-2 aspect-video">{cell(urls[2], 2, 'block h-full w-full')}</div>
      </div>
    );
  } else {
    // 4+ photos: 2×2 grid, 4th cell shows "+N more" if there are extras
    const visible = urls.slice(0, 4);
    const overflow = count - 4;

    grid = (
      <div className="grid grid-cols-2 gap-px">
        {visible.map((url, i) => {
          const isLast = i === 3 && overflow > 0;
          return (
            <div key={i} className="aspect-square relative overflow-hidden">
              <button onClick={() => open(i)} className="block h-full w-full focus:outline-none">
                <Img src={url} className={isLast ? 'brightness-50' : ''} />
              </button>
              {isLast && (
                <button
                  onClick={() => open(3)}
                  className="absolute inset-0 flex items-center justify-center focus:outline-none"
                >
                  <span className="text-white text-2xl font-bold drop-shadow">+{overflow}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="border-t overflow-hidden">{grid}</div>
      {lightboxIndex !== null && (
        <Lightbox urls={urls} startIndex={lightboxIndex} onClose={close} />
      )}
    </>
  );
}
