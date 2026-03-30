/**
 * MediaGallery — swipe-enabled, tap-to-zoom gallery for listings.
 * Supports images and videos. Works on mobile (Safari + Android).
 */
import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Play, Expand, ZoomIn } from "lucide-react";

function VideoThumb({ url, onClick }) {
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer" onClick={onClick}>
      <video
        src={url}
        className="w-full h-full object-contain"
        preload="metadata"
        muted
        playsInline
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center">
          <Play className="h-7 w-7 text-white fill-white ml-1" />
        </div>
      </div>
    </div>
  );
}

function FullscreenModal({ media, index: initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(null);

  const prev = () => setIndex(i => (i - 1 + media.length) % media.length);
  const next = () => setIndex(i => (i + 1) % media.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const item = media[index];

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/70 text-sm font-medium">{index + 1} / {media.length}</span>
        <button onClick={onClose} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <img
            key={item.url}
            src={item.url}
            alt=""
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Nav arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 h-10 w-10 rounded-full bg-black/40 flex items-center justify-center"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 h-10 w-10 rounded-full bg-black/40 flex items-center justify-center"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {media.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4 shrink-0">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${i === index ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MediaGallery({ media }) {
  // media: Array<{ url: string, type: "image" | "video" }>
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const prev = useCallback(() => setIndex(i => (i - 1 + media.length) % media.length), [media.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % media.length), [media.length]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      dx > 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  if (!media || media.length === 0) return null;

  const item = media[index];

  return (
    <>
      <div
        className="relative w-full select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Main media area */}
        <div
          className="w-full h-64 sm:h-80 bg-black flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => setFullscreen(true)}
        >
          {item.type === "video" ? (
            <VideoThumb url={item.url} onClick={() => setFullscreen(true)} />
          ) : (
            <img
              src={item.url}
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          )}

          {/* Tap to expand hint */}
          <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center">
            <ZoomIn className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Nav arrows (desktop / accessibility) */}
        {media.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 flex items-center justify-center z-10"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 flex items-center justify-center z-10"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIndex(i); }}
                className={`rounded-full transition-all ${i === index ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="flex gap-2 px-4 pt-2 pb-1 overflow-x-auto scrollbar-hide">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`shrink-0 h-14 w-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === index ? "border-primary" : "border-transparent opacity-60"
              }`}
            >
              {m.type === "video" ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      )}

      {fullscreen && (
        <FullscreenModal media={media} index={index} onClose={() => setFullscreen(false)} />
      )}
    </>
  );
}