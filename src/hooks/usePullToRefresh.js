import { useState, useRef, useCallback } from "react";

const THRESHOLD = 64;

export function usePullToRefresh(onRefresh) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current == null) return;
    const dist = Math.max(0, e.touches[0].clientY - startY.current);
    setPullY(Math.min(dist, THRESHOLD * 1.5));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startY.current == null) return;
    const dist = pullY;
    startY.current = null;
    setPullY(0);
    if (dist >= THRESHOLD) {
      setIsPulling(true);
      await onRefresh();
      setIsPulling(false);
    }
  }, [pullY, onRefresh]);

  // true when the indicator should be visible
  const pullActive = isPulling || pullY > 8;

  return { isPulling, pullActive, onTouchStart, onTouchMove, onTouchEnd };
}