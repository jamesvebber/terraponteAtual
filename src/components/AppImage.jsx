/**
 * AppImage — reliable image component that handles:
 * - Cached images (onLoad won't fire, checked via img.complete)
 * - Loading skeleton
 * - Error fallback with custom placeholder
 * - Lazy loading + async decoding
 */
import { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";

export default function AppImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  fallbackEmoji = null,
  fallbackLabel = null,
  objectFit = "cover",   // "cover" | "contain"
  onClick,
}) {
  const imgRef = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "loaded" | "error"

  useEffect(() => {
    if (!src) { setStatus("error"); return; }
    setStatus("loading");

    const img = new Image();
    img.src = src;

    const handleLoad = () => setStatus("loaded");
    const handleError = () => setStatus("error");

    if (img.complete && img.naturalWidth > 0) {
      // Already cached — no event fires
      setStatus("loaded");
      return;
    }

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [src]);

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