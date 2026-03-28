import { Link, useLocation } from "react-router-dom";
import { Home, Store, ShoppingBag, PlusCircle, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Início", icon: Home },
  { path: "/marketplace", label: "Mercado", icon: Store },
  { path: "/insumos", label: "Insumos", icon: ShoppingBag },
  { path: "/vender", label: "Anunciar", icon: PlusCircle },
  { path: "/profile", label: "Conta", icon: UserCircle },
];

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border select-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[72px] select-none",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "transition-all duration-200",
                  active ? "h-6 w-6" : "h-5 w-5"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[11px] transition-all duration-200",
                  active ? "font-bold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}