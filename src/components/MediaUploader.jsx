/**
 * MediaUploader — multi-image + video upload component for listing creation.
 * First item = cover image.
 */
import { useRef } from "react";
import { Camera, Video, X, Play, MoveLeft, MoveRight } from "lucide-react";

function isVideo(file) {
  return file.type?.startsWith("video/") || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name || "");
}

export default function MediaUploader({ items, onChange }) {
  // items: Array<{ file?: File, url?: string, previewUrl: string, type: "image"|"video" }>
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const addFiles = (files) => {
    const newItems = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: isVideo(file) ? "video" : "image",
    }));
    onChange([...items, ...newItems]);
  };

  const remove = (i) => {
    const next = items.filter((_, idx) => idx !== i);
    onChange(next);
  };

  const moveLeft = (i) => {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  const moveRight = (i) => {
    if (i === items.length - 1) return;
    const next = [...items];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <div key={i} className={`relative rounded-xl overflow-hidden border-2 ${i === 0 ? "border-primary" : "border-border"} aspect-square bg-muted`}>
              {item.type === "video" ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <video src={item.previewUrl} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white fill-white drop-shadow" />
                  </div>
                </div>
              ) : (
                <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
              )}

              {/* Cover badge */}
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  Capa
                </span>
              )}

              {/* Controls */}
              <div className="absolute bottom-1 left-1 right-1 flex gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveLeft(i)}
                    className="h-6 w-6 rounded-md bg-black/60 flex items-center justify-center"
                  >
                    <MoveLeft className="h-3 w-3 text-white" />
                  </button>
                )}
                {i < items.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveRight(i)}
                    className="h-6 w-6 rounded-md bg-black/60 flex items-center justify-center"
                  >
                    <MoveRight className="h-3 w-3 text-white" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted transition-colors"
        >
          <Camera className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            {items.length === 0 ? "Adicionar fotos" : `+ Fotos (${items.filter(i=>i.type==="image").length})`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="flex-1 flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted transition-colors"
        >
          <Video className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">
            {items.filter(i=>i.type==="video").length === 0 ? "Adicionar vídeo" : `Vídeo adicionado ✓`}
          </span>
        </button>
      </div>

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {items.length} mídia{items.length !== 1 ? "s" : ""} · A primeira foto será a capa do anúncio
        </p>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}