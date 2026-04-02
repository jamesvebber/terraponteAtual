import { useState, useRef, useEffect } from "react";
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
  const [status, setStatus] = useState(!src ? "error" : "loading");

  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    // Check if already cached
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setStatus("loaded");
    }
  }, [src]);

  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className={`relative overflow-hidden bg-muted ${containerClassName}`} onClick={onClick}>
      {status === "loading" && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {src && status !== "error" && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full ${fitClass} ${className}`}
          style={{ opacity: status === "loaded" ? 1 : 0, transition: "opacity 0.3s" }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-muted">
          {fallbackEmoji ? (
            <>
              <span className="text-4xl">{fallbackEmoji}</span>
              {fallbackLabel && (
                <span className="text-[10px] text-muted-foreground font-medium">{fallbackLabel}</span>
              )}
            </>
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          )}
        </div>
      )}
    </div>
  );
}