import { useIsDesktop } from "./use-desktop";

export function useGridCols() {
  const isDesktop = useIsDesktop();
  
  return {
    cols: isDesktop ? "grid-cols-3 lg:grid-cols-4" : "grid-cols-2",
    colsCompact: isDesktop ? "grid-cols-4 lg:grid-cols-5" : "grid-cols-3",
    colsWide: isDesktop ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2",
    cardWidth: isDesktop ? "max-w-sm" : "w-full",
  };
}
