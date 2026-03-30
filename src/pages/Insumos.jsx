import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import InsumoProductCard from "../components/InsumoProductCard";
import SkeletonCard from "../components/SkeletonCard";
import { Loader2, ShoppingBag, Store, Search, SlidersHorizontal, X, Settings, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

const CATEGORIES = [
  { label: "Todos", emoji: "🔍" },
  { label: "Ração", emoji: "🌾" },
  { label: "Sal mineral", emoji: "🧂" },
  { label: "Adubo", emoji: "🌱" },
  { label: "Sementes", emoji: "🌻" },
  { label: "Herbicidas", emoji: "🧪" },
  { label: "Inseticidas", emoji: "🐛" },
  { label: "Medicamentos veterinários", emoji: "💊" },
  { label: "Suplementos", emoji: "⚗️" },
  { label: "Ferramentas", emoji: "🔧" },
  { label: "Selaria", emoji: "🐴" },
  { label: "Pet shop", emoji: "🐾" },
  { label: "Equipamentos", emoji: "⚙️" },
  { label: "Peças", emoji: "🔩" },
  { label: "Outros", emoji: "📦" },
];
const CACHE_KEY = "insumos_products";
const PAGE_SIZE = 12;



export default function Insumos() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null") || []; } catch { return []; }
  });
  const [verifiedStoreIds, setVerifiedStoreIds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("insumos_verified") || "null") || []; } catch { return []; }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem(CACHE_KEY));
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [pickupOnly, setPickupOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    const [data, stores] = await Promise.all([
      base44.entities.InsumoProduct.filter({ status: "active" }, "-created_date"),
      base44.entities.SupplierProfile.filter({ verification_status: "verificada" }),
    ]);
    const ids = stores.map(s => s.id);
    setProducts(data);
    setVerifiedStoreIds(ids);
    setLoading(false);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem("insumos_verified", JSON.stringify(ids));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset visible count when filters/search change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, selectedCategory, selectedCity, deliveryOnly, pickupOnly]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(v => v + PAGE_SIZE); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef.current]);

  const { isPulling, pullActive, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(fetchProducts);

  const cities = useMemo(() => ["Todas", ...new Set(products.map(p => p.city).filter(Boolean))], [products]);
  const hasFilters = selectedCity !== "Todas" || deliveryOnly || pickupOnly;

  const filtered = useMemo(() => products.filter(p => {
    if (selectedCategory !== "Todos" && p.category !== selectedCategory) return false;
    if (selectedCity !== "Todas" && p.city !== selectedCity) return false;
    if (deliveryOnly && !p.delivery_available) return false;
    if (pickupOnly && p.pickup_available === false) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.product_name?.toLowerCase().includes(q) &&
        !p.supplier_name?.toLowerCase().includes(q) &&
        !p.category?.toLowerCase().includes(q) &&
        !p.city?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }), [products, selectedCategory, selectedCity, deliveryOnly, pickupOnly, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0)), [filtered]);
  const bestId = sorted[0]?.id;
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div
      className="px-4 pt-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullActive && (
        <div className="flex justify-center pb-2 transition-all">
          <Loader2 className={`h-5 w-5 text-primary ${isPulling ? "animate-spin" : "opacity-40"}`} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Insumos</h1>
            <p className="text-xs text-muted-foreground font-medium">Lojas e cooperativas da sua região</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-bold" onClick={() => navigate("/minha-loja")}>
          <Settings className="h-3.5 w-3.5" /> Minha loja
        </Button>
      </div>

      {/* Store CTA for non-store users */}
      {isAuthenticated && (
        <button
          onClick={() => navigate("/minha-loja")}
          className="w-full flex items-center gap-3 bg-accent/20 border border-accent/40 rounded-2xl px-4 py-3 mb-4 select-none"
        >
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">Venda insumos pelo TerraPonte</p>
            <p className="text-xs text-muted-foreground">Cadastre sua loja ou gerencie seus produtos</p>
          </div>
          <PlusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      )}

      {/* Search + Filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Buscar ração, adubo, sementes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className={`h-11 px-3 rounded-xl ${hasFilters ? "border-primary text-primary" : ""}`} onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          {hasFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat.label} onClick={() => setSelectedCategory(cat.label)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors select-none ${
              selectedCategory === cat.label ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
            }`}>
            <span>{cat.emoji}</span><span>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 px-4">
          <span className="text-6xl mb-4 block">🌿</span>
          <p className="text-foreground text-xl font-bold mb-2">Nenhum produto ainda nesta região</p>
          <p className="text-muted-foreground text-base leading-relaxed mb-5">Seja o primeiro a anunciar insumos e alcance produtores locais.</p>
          <Button variant="outline" className="rounded-xl gap-2 h-12 text-sm" onClick={() => navigate("/minha-loja")}>
            <Store className="h-4 w-4" /> Cadastrar minha loja
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            {sorted.length} produto{sorted.length !== 1 ? "s" : ""} · ordenado por menor preço
          </p>
          <div className="grid grid-cols-2 gap-3">
            {visible.map((item) => (
              <InsumoProductCard key={item.id} product={item} isBest={item.id === bestId} isVerified={verifiedStoreIds.includes(item.supplier_id)} />
            ))}
          </div>
          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary opacity-60" />
            </div>
          )}
          {!hasMore && sorted.length > PAGE_SIZE && (
            <p className="text-center text-xs text-muted-foreground py-4">Todos os {sorted.length} produtos carregados</p>
          )}
        </>
      )}

      {/* Filter Drawer */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Filtros</DrawerTitle></DrawerHeader>
          <div className="px-4 space-y-5 pb-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Cidade</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {cities.map(c => (
                  <button key={c} onClick={() => setSelectedCity(c)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors select-none ${
                      selectedCity === c ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Opções de entrega</label>
              <div className="flex gap-2">
                <button onClick={() => setDeliveryOnly(v => !v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                    deliveryOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                  }`}>
                  🚚 Com entrega
                </button>
                <button onClick={() => setPickupOnly(v => !v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                    pickupOnly ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                  }`}>
                  🏪 Com retirada
                </button>
              </div>
            </div>
          </div>
          <DrawerFooter>
            {hasFilters && (
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => { setSelectedCity("Todas"); setDeliveryOnly(false); setPickupOnly(false); }}>
                <X className="h-4 w-4" /> Limpar filtros
              </Button>
            )}
            <DrawerClose asChild>
              <Button className="w-full rounded-xl">Aplicar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}