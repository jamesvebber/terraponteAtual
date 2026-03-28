import { useNavigate, useLocation } from "react-router-dom";
import { Home, Store, ShoppingBag, UserCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_ROOTS = [
  { root: "/", label: "Início", icon: Home },
  { root: "/marketplace", label: "Mercado", icon: Store },
  { root: "/vender", label: "Anunciar", icon: PlusCircle, action: true },
  { root: "/insumos", label: "Insumos", icon: ShoppingBag },
  { root: "/profile", label: "Conta", icon: UserCircle },
];

const tabLastPath = {
  "/": "/",
  "/marketplace": "/marketplace",
  "/insumos": "/insumos",
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

  const isActive = (root) => {
    if (root === "/vender") return currentPath === "/vender";
    if (root === "/") return currentPath === "/";
    return currentPath.startsWith(root);
  };

  const handleTabPress = (root, isAction) => {
    if (isAction) { navigate(root); return; }
    const dest = tabLastPath[root] ?? root;
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
          if (tab.action) {
            return (
              <button
                key={tab.root}
                onClick={() => handleTabPress(tab.root, true)}
                className="flex flex-col items-center justify-center gap-0.5 select-none"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md -mt-3">
                  <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-primary mt-0.5">{tab.label}</span>
              </button>
            );
          }
          return (
            <button
              key={tab.root}
              onClick={() => handleTabPress(tab.root, false)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] select-none",
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