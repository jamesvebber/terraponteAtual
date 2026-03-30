import { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";
import { Search, Loader2, SlidersHorizontal, X } from "lucide-react"; // Loader2 used for pull-to-refresh
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { LISTING_CATEGORIES } from "../utils/listingCategories";

const categories = [
  { label: "Todos", emoji: "🔍" },
  ...LISTING_CATEGORIES.map(c => ({ label: c.value, emoji: c.emoji })),
];

const CACHE_KEY = "mkt_listings";



export default function Marketplace() {
  const [listings, setListings] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null") || []; } catch { return []; }
  });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem(CACHE_KEY));
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sellerType, setSellerType] = useState("Ambos");
  const [selectedCity, setSelectedCity] = useState("Todas");

  const fetchListings = useCallback(async () => {
    const data = await base44.entities.Listing.filter({ status: "active" }, "-created_date");
    setListings(data);
    setLoading(false);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const { isPulling, pullActive, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(fetchListings);

  const cities = useMemo(() => ["Todas", ...new Set(listings.map((l) => l.city).filter(Boolean))], [listings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (selectedCategory !== "Todos" && l.category !== selectedCategory) return false;
      if (sellerType !== "Ambos" && l.seller_type !== sellerType) return false;
      if (selectedCity !== "Todas" && l.city !== selectedCity) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.title?.toLowerCase().includes(q) &&
          !l.description?.toLowerCase().includes(q) &&
          !l.seller_name?.toLowerCase().includes(q) &&
          !l.city?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [listings, selectedCategory, sellerType, selectedCity, search]);

  const featured = filtered.filter((l) => l.featured);
  const hasFilters = sellerType !== "Ambos" || selectedCity !== "Todas";

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
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Mercado</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Compre direto de produtores da região</p>
      </div>

      {/* Trust note */}
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
        <span className="text-sm">🛡️</span>
        <p className="text-xs text-green-700 font-medium">Anúncios falsos ou enganosos podem ser removidos. <span className="font-bold">Use o botão "Reportar" em qualquer anúncio.</span></p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Buscar gado, queijo, roçadeira..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className={`h-11 px-3 rounded-xl gap-1.5 ${hasFilters ? "border-primary text-primary" : ""}`}
          onClick={() => setFilterDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {hasFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-5 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategory(cat.label)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-colors select-none ${
              selectedCategory === cat.label
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} category={selectedCategory} />
      ) : (
        <>
          {featured.length > 0 && selectedCategory === "Todos" && !search && (
            <div className="mb-5">
              <h2 className="text-base font-bold text-foreground mb-3">⭐ Destaques da região</h2>
              <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
                {featured.map((l) => (
                  <div key={l.id} className="flex-shrink-0 w-48">
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">
              {search ? `Resultados para “${search}”` : selectedCategory !== "Todos" ? selectedCategory : "Todos os anúncios"}
            </h2>
            <span className="text-xs text-muted-foreground">{filtered.length} anúncio{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-4">
            {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </>
      )}

      {/* Filter drawer */}
      <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Filtros</DrawerTitle></DrawerHeader>
          <div className="px-4 space-y-5 pb-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Tipo de vendedor</label>
              <div className="flex gap-2">
                {["Ambos", "Produtor", "Loja"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSellerType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                      sellerType === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Cidade</label>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCity(c)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors select-none ${
                      selectedCity === c ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DrawerFooter>
            {hasFilters && (
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => { setSellerType("Ambos"); setSelectedCity("Todas"); }}>
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

function EmptyState({ search, category }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <span className="text-6xl mb-4">🌾</span>
      <h3 className="font-bold text-foreground text-xl mb-2">
        {search ? "Nenhum resultado encontrado" : "Nenhum produto ainda nesta região"}
      </h3>
      <p className="text-base text-muted-foreground max-w-[260px] leading-relaxed">
        {search
          ? `Não encontramos nada para "${search}". Tente outro termo.`
          : "Seja o primeiro a anunciar e vender direto pelo WhatsApp."}
      </p>
    </div>
  );
}