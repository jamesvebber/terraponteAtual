import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

// Track scroll positions per route path
const scrollPositions = {};

export default function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);

  // Save scroll position before navigating away
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const path = location.pathname;

    // Restore scroll for this path
    const saved = scrollPositions[path] ?? 0;
    el.scrollTop = saved;

    const handleScroll = () => {
      scrollPositions[path] = el.scrollTop;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto max-w-lg mx-auto w-full"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}