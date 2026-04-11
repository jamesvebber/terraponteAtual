import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export default function GlobalSearchBar({
  value,
  onChange,
  onSearch,
  suggestions = [],
  placeholder = "Buscar produto, categoria ou loja...",
  autoFocus = false,
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = value.trim().length >= 2
    ? [...new Set(suggestions.filter(s =>
        s?.toLowerCase().includes(value.toLowerCase())
      ))].slice(0, 7)
    : [];

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (s) => {
    onChange(s);
    setOpen(false);
    onSearch?.(s);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setOpen(false);
      onSearch?.(value);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setOpen(false);
      onChange("");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="w-full h-12 pl-10 pr-9 rounded-2xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center select-none"
            onClick={() => { onChange(""); setOpen(false); inputRef.current?.focus(); }}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
          {filtered.map((s, i) => (
            <button
              key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted flex items-center gap-2.5 border-b border-border last:border-0 select-none"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}