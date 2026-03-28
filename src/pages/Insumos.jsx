import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import InsumoProductCard from "../components/InsumoProductCard";
import { Loader2, ShoppingBag, Store, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

const CATEGORIES = ["Todos", "Ração", "Sal mineral", "Adubo", "Sementes", "Defensivos", "Medicamentos veterinários", "Ferramentas", "Equipamentos", "Outros"];
const CACHE_KEY = "insumos_products";

export default function Insumos() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null") || []; } catch { return []; }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem(CACHE_KEY));
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [pickupOnly, setPickupOnly] = useState(false);

  const fetchProducts = useCallback(async () => {
    const data = await base44.entities.InsumoProduct.filter({ status: "active" }, "-created_date");
    setProducts(data);
    setLoading(false);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
      if (!p.product_name?.toLowerCase().includes(q) && !p.supplier_name?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [products, selectedCategory, selectedCity, deliveryOnly, pickupOnly, search]);

  const sorted = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
  const bestId = sorted[0]?.id;

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
            <p className="text-xs text-muted-foreground font-medium">Compare preços e encontre o melhor custo</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-bold" onClick={() => navigate("/minha-loja")}>
          <Store className="h-3.5 w-3.5" /> Minha loja
        </Button>
      </div>

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
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold border transition-colors select-none ${
              selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Nenhum produto encontrado</p>
          <p className="text-muted-foreground/70 text-xs mt-1">Tente outros termos ou cadastre sua loja</p>
          <Button variant="outline" className="rounded-xl mt-4 gap-2 text-sm" onClick={() => navigate("/minha-loja")}>
            <Store className="h-4 w-4" /> Cadastrar minha loja
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            {sorted.length} produto{sorted.length !== 1 ? "s" : ""} · ordenado por menor preço
          </p>
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((item) => (
              <InsumoProductCard key={item.id} product={item} isBest={item.id === bestId} />
            ))}
          </div>
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