import { useEffect } from "react";

/**
 * Attaches a focusin listener to a container ref.
 * On iOS Safari, when the keyboard opens, the focused input
 * may be hidden behind it. This hook smoothly scrolls the
 * active element into the center of the visible area.
 */
export function useScrollOnFocus(containerRef) {
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    const handleFocus = (e) => {
      const target = e.target;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      // Small delay so the keyboard has time to appear before we scroll
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    };

    el.addEventListener("focusin", handleFocus);
    return () => el.removeEventListener("focusin", handleFocus);
  }, [containerRef]);
}