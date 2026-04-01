import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import OnboardingModal from "./OnboardingModal";
import Footer from "./Footer";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./BottomNav";

// Persist scroll positions across route changes
const scrollPositions = {};

const ROOT_PATHS = ["/", "/marketplace", "/insumos", "/minha-loja", "/profile"];

const pageVariants = {
  initial: (isRoot) => ({ opacity: 0, x: isRoot ? 0 : 16 }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: (isRoot) => ({ opacity: 0, x: isRoot ? 0 : -16, transition: { duration: 0.15, ease: "easeIn" } }),
};

export default function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const isRoot = ROOT_PATHS.includes(location.pathname);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const path = location.pathname;
    // Restore scroll for this path
    const saved = scrollPositions[path] ?? 0;
    el.scrollTop = saved;

    const handleScroll = () => { scrollPositions[path] = el.scrollTop; };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-xs font-bold text-center py-2 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
          📶 Sem conexão — alguns conteúdos podem estar desatualizados
        </div>
      )}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto max-w-lg mx-auto w-full"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}
      >
        <AnimatePresence mode="wait" initial={false} custom={isRoot}>
          <motion.div
            key={location.pathname}
            custom={isRoot}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-full"
          >
            <Outlet />
            <Footer />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <OnboardingModal />
    </div>
  );
}