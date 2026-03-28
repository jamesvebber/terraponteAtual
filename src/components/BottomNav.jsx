import { useNavigate, useLocation } from "react-router-dom";
import { Home, Store, ShoppingBag, UserCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_ROOTS = [
  { root: "/", label: "Início", icon: Home },
  { root: "/marketplace", label: "Mercado", icon: Store },
  { root: "/insumos", label: "Insumos", icon: ShoppingBag },
  { root: "/minha-loja", label: "Minha Loja", icon: Package },
  { root: "/profile", label: "Conta", icon: UserCircle },
];

// Remember last visited path per tab root (module-level = survives re-renders)
const tabLastPath = {
  "/": "/",
  "/marketplace": "/marketplace",
  "/insumos": "/insumos",
  "/minha-loja": "/minha-loja",
  "/profile": "/profile",
};

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Track current path into the correct tab bucket
  const currentPath = location.pathname;
  for (const tab of TAB_ROOTS) {
    if (tab.root === "/" ? currentPath === "/" : currentPath.startsWith(tab.root)) {
      tabLastPath[tab.root] = currentPath;
      break;
    }
  }

  const isActive = (root) => root === "/" ? currentPath === "/" : currentPath.startsWith(root);

  const handleTabPress = (root) => {
    const dest = tabLastPath[root] ?? root;
    // If already on this tab's root, do nothing (no flicker)
    if (currentPath === dest) return;
    navigate(dest);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {TAB_ROOTS.map((tab) => {
          const active = isActive(tab.root);
          const Icon = tab.icon;
          return (
            <button
              key={tab.root}
              onClick={() => handleTabPress(tab.root)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[72px] select-none",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("transition-all duration-200", active ? "h-6 w-6" : "h-5 w-5")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn("text-[11px] transition-all duration-200", active ? "font-bold" : "font-medium")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}