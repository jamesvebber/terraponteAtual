import { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";

export default function AppImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  fallbackEmoji = null,
  fallbackLabel = null,
  objectFit = "cover",
  onClick,
}) {
  const imgRef = useRef(null);
  const [status, setStatus] = useState(() => (!src ? "error" : "loading"));

  // Reset when src changes
  useEffect(() => {
    if (!src) { setStatus("error"); return; }
    setStatus("loading");
  }, [src]);

  // After render, check if the img is already complete (cached)
  useEffect(() => {
    if (!src) return;
    const el = imgRef.current;
    if (el && el.complete) {
      if (el.naturalWidth > 0) setStatus("loaded");
      else setStatus("error");
    }
  });

  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className={`relative overflow-hidden bg-muted ${containerClassName}`} onClick={onClick}>
      {/* Skeleton */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Image */}
      {src && status !== "error" && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full ${fitClass} transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          } ${className}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}

      {/* Fallback */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted">
          {fallbackEmoji ? (
            <>
              <span className="text-4xl">{fallbackEmoji}</span>
              {fallbackLabel && <span className="text-[10px] text-muted-foreground font-medium">{fallbackLabel}</span>}
            </>
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>
      )}
    </div>
  );
}