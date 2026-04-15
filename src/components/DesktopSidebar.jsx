import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, Store, ShoppingBag, UserCircle, PlusCircle, 
  Building2, ChevronRight, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import AnunciarModal from "./AnunciarModal";

const SIDEBAR_WIDTH = "280px";

const MAIN_MENU = [
  { root: "/", label: "Início", icon: Home },
  { root: "/marketplace", label: "Mercado", icon: Store },
  { root: "/insumos", label: "Insumos", icon: ShoppingBag },
  { root: "/lojas", label: "Lojas", icon: Building2 },
];

const ACCOUNT_MENU = [
  { root: "/vender", label: "Anunciar", icon: PlusCircle, action: true },
  { root: "/minha-loja", label: "Minha Loja", icon: Store },
  { root: "/profile", label: "Perfil", icon: UserCircle },
];

const ADMIN_MENU = [
  { root: "/admin", label: "Painel Admin", icon: BarChart3, adminOnly: true },
];

export default function DesktopSidebar({ isAdmin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anunciarOpen, setAnunciarOpen] = useState(false);

  const menuItems = [...MAIN_MENU, ...ACCOUNT_MENU, ...(isAdmin ? ADMIN_MENU : [])];

  const isActive = (root) => {
    if (root === "/vender") return location.pathname === "/vender";
    if (root === "/") return location.pathname === "/";
    return location.pathname.startsWith(root);
  };

  const handleClick = (item) => {
    if (item.action) {
      setAnunciarOpen(true);
      return;
    }
    navigate(item.root);
  };

  return (
    <>
      <AnunciarModal open={anunciarOpen} onClose={() => setAnunciarOpen(false)} />
      <aside 
        className="fixed left-0 top-0 bottom-0 bg-card border-r border-border flex flex-col z-40"
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden shadow shrink-0">
              <img
                src="https://media.base44.com/images/public/69c716a35da7111840683290/feff66e14_IMG_3129.png"
                alt="TerraPonte"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-primary">Terra</span>
                <span className="text-lg font-extrabold text-foreground">Ponte</span>
              </div>
              <p className="text-[11px] text-muted-foreground">O mercado rural</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Navegação</p>
            {MAIN_MENU.map((item) => {
              const active = isActive(item.root);
              const Icon = item.icon;
              return (
                <button
                  key={item.root}
                  onClick={() => handleClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>

          <div className="px-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Minha Conta</p>
            {ACCOUNT_MENU.map((item) => {
              const active = isActive(item.root);
              const Icon = item.icon;
              return (
                <button
                  key={item.root}
                  onClick={() => handleClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <div className="px-3 mt-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin</p>
              {ADMIN_MENU.map((item) => {
                const active = isActive(item.root);
                const Icon = item.icon;
                return (
                  <button
                    key={item.root}
                    onClick={() => handleClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {active && <ChevronRight className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-xs font-bold text-foreground mb-1">Negocie direto no WhatsApp</p>
            <p className="text-[11px] text-muted-foreground">Conecte com produtores e vendedores da sua região.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export { SIDEBAR_WIDTH };
