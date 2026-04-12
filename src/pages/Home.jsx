import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, TrendingUp, TrendingDown, Loader2, ChevronRight, Edit2 } from "lucide-react";
import GlobalSearchBar from "../components/GlobalSearchBar";
import FeaturedInsumos from "../components/FeaturedInsumos";
import AnunciarModal from "../components/AnunciarModal";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "ontem" : `há ${days} dias`;
}

const REGION_KEY = "tp_user_region";
const GO_CITIES = [
  "Goiânia","Aparecida de Goiânia","Anápolis","Rio Verde","Luziânia","Jataí",
  "Catalão","Itumbiara","Caldas Novas","Formosa","São Luís de Montes Belos",
  "Córrego do Ouro","Ceres","Itaberaí","Mineiros","Quirinópolis","Inhumas","Trindade","Senador Canedo",
];

function PriceRefCard({ item }) {
  const isUp = item.trend === "up";
  return (
    <div className="flex-shrink-0 bg-card border border-border rounded-2xl px-3 py-3 flex flex-col gap-1.5 min-w-[130px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg">{item.icon}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {isUp ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground font-semibold">{item.product_name}</p>
      <p className="text-sm font-extrabold text-foreground">
        R$ {item.price.toFixed(2).replace(".", ",")}
        <span className="text-[10px] font-medium text-muted-foreground ml-1">/{item.unit}</span>
      </p>
      <p className="text-[9px] text-muted-foreground/70 font-medium">Preço de referência</p>
    </div>
  );
}

function OpportunityCard({ listing, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl overflow-hidden text-left select-none active:scale-95 transition-transform"
    >
      <div className="w-full h-24 bg-muted flex items-center justify-center overflow-hidden">
        {listing.image_url
          ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
          : <span className="text-3xl">📦</span>}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug mb-1">{listing.title}</p>
        <p className="text-sm font-extrabold text-green-600">R$ {listing.price?.toFixed(2).replace(".", ",")}</p>
        <p className="text-[10px] text-muted-foreground truncate">{listing.city}</p>
        {listing.availability_status && listing.availability_status !== "Disponível" && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 mt-1 inline-block">{listing.availability_status}</span>
        )}
      </div>
    </button>
  );
}

function ActionTile({ emoji, label, sublabel, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border text-left transition-all select-none active:scale-95 ${
        primary ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <p className={`text-sm font-extrabold leading-tight ${primary ? "text-primary-foreground" : "text-foreground"}`}>{label}</p>
      <p className={`text-[11px] font-medium leading-tight ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{sublabel}</p>
    </button>
  );
}

function RegionSelector({ onSelect, onCancel }) {
  const [query, setQuery] = useState("");
  const filtered = GO_CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
      <div className="w-full bg-background rounded-t-3xl p-5 max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-foreground">Selecionar região</h2>
          <button onClick={onCancel} className="text-sm text-muted-foreground font-semibold select-none">Cancelar</button>
        </div>
        <input
          className="w-full h-11 px-4 rounded-xl border border-border bg-muted text-sm placeholder:text-muted-foreground focus:outline-none mb-3"
          placeholder="Buscar cidade em Goiás..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="overflow-y-auto flex-1 space-y-1">
          <button onClick={() => onSelect("Goiás (estado)")} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted select-none">
            🗺️ Goiás — estado inteiro
          </button>
          {filtered.map(city => (
            <button key={city} onClick={() => onSelect(`${city} – GO`)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted select-none">
              📍 {city} – GO
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  const [region, setRegion] = useState(() => localStorage.getItem(REGION_KEY) || "Goiás (estado)");
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [showAnunciarModal, setShowAnunciarModal] = useState(false);
  const [featuredInsumos, setFeaturedInsumos] = useState([]);
  const [homeSearch, setHomeSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const load = useCallback(async () => {
    const [priceData, listings, stores, insumos] = await Promise.all([
      base44.entities.MarketPrice.list(),
      base44.entities.Listing.filter({ status: "active" }, "-created_date", 50),
      base44.entities.SupplierProfile.list("-created_date", 100),
      base44.entities.InsumoProduct.filter({ status: "active" }, "-created_date", 30),
    ]);

    const seen = new Set();
    const bestInsumos = insumos
      .sort((a, b) => {
        const scoreA = (a.image_url ? 2 : 0) + (a.price ? 1 : 0) + (a.featured ? 3 : 0);
        const scoreB = (b.image_url ? 2 : 0) + (b.price ? 1 : 0) + (b.featured ? 3 : 0);
        return scoreB - scoreA;
      })
      .filter(p => {
        const key = p.product_name?.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);

    setFeaturedInsumos(bestInsumos);
    setPrices(priceData);
    setRecentListings(listings.slice(0, 6));

    const s = new Set();
    listings.forEach(l => {
      if (l.title) s.add(l.title);
      if (l.category) s.add(l.category);
      if (l.seller_name) s.add(l.seller_name);
      if (l.city) s.add(l.city);
    });
    insumos.forEach(p => {
      if (p.product_name) s.add(p.product_name);
      if (p.category) s.add(p.category);
      if (p.supplier_name) s.add(p.supplier_name);
    });
    stores.forEach(st => {
      if (st.store_name) s.add(st.store_name);
    });
    setSuggestions([...s]);
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { isPulling, pullActive, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(load);

  const handleSelectRegion = (r) => {
    setRegion(r);
    localStorage.setItem(REGION_KEY, r);
    setShowRegionSelector(false);
  };

  const opps = recentListings.filter(l => l.image_url && l.availability_status !== "Indisponível").slice(0, 8);

  return (
    <div
      className="px-4 pt-5 pb-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {pullActive && (
        <div className="flex justify-center pb-2">
          <Loader2 className={`h-5 w-5 text-primary ${isPulling ? "animate-spin" : "opacity-40"}`} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center shadow shrink-0 overflow-hidden">
            <span className="text-2xl leading-none">🌾</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <h1 className="text-xl font-extrabold text-primary leading-tight tracking-tight">Terra</h1>
              <h1 className="text-xl font-extrabold text-foreground leading-tight tracking-tight">Ponte</h1>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">O mercado rural da sua região</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <GlobalSearchBar
          value={homeSearch}
          onChange={setHomeSearch}
          suggestions={suggestions}
          placeholder="Buscar produto, loja ou categoria..."
          onSearch={q => navigate(`/marketplace?q=${encodeURIComponent(q)}`)}
        />
      </div>

      {/* Value prop strip */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/15 rounded-2xl px-3 py-2.5 mb-4 gap-1">
        <div className="flex flex-col items-center flex-1 text-center">
          <span className="text-base">🟢</span>
          <p className="text-[10px] font-bold text-foreground leading-tight mt-0.5">Anuncie grátis</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex flex-col items-center flex-1 text-center">
          <span className="text-base">📍</span>
          <p className="text-[10px] font-bold text-foreground leading-tight mt-0.5">Negócios da região</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex flex-col items-center flex-1 text-center">
          <span className="text-base">💬</span>
          <p className="text-[10px] font-bold text-foreground leading-tight mt-0.5">Fale no WhatsApp</p>
        </div>
      </div>

      {/* Region pill */}
      <button
        onClick={() => setShowRegionSelector(true)}
        className="w-full flex items-center justify-between bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3 mb-4 select-none active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-bold text-foreground">{region}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-primary">
          <Edit2 className="h-3.5 w-3.5" /> Alterar
        </div>
      </button>

      {/* Action tiles */}
      <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3">O que você quer fazer?</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <ActionTile emoji="🛒" label="Quero comprar" sublabel="Produtos direto de produtores" onClick={() => navigate("/marketplace")} primary />
        <ActionTile emoji="📢" label="Quero vender" sublabel="Publique e receba no WhatsApp" onClick={() => setShowAnunciarModal(true)} />
        <ActionTile emoji="🌿" label="Ver insumos" sublabel="Ração, adubo e muito mais" onClick={() => navigate("/insumos")} />
        <ActionTile emoji="🏪" label="Ver lojas" sublabel="Lojas e cooperativas da região" onClick={() => navigate("/lojas")} />
      </div>

      {/* Radar do Dia */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📡</span>
          <h2 className="text-base font-extrabold text-foreground">Radar do Dia</h2>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground font-medium ml-auto">atualizado {timeAgo(lastUpdated)}</span>
          )}
        </div>

        {/* Oportunidades perto de você */}
        {!loading && opps.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">📍 Perto de você</p>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
              {opps.map(l => <OpportunityCard key={l.id} listing={l} onClick={() => navigate(`/marketplace/${l.id}`)} />)}
            </div>
          </div>
        )}

        {/* Preços de referência */}
        {!loading && prices.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">📊 Preços de referência</p>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
              {prices.map((p, i) => <PriceRefCard key={p.id || i} item={p} />)}
            </div>
          </div>
        )}
        {!loading && prices.length === 0 && (
          <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground font-medium">Cotação indisponível no momento</p>
          </div>
        )}
        {loading && (
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {[1,2,3].map(i => <div key={i} className="flex-shrink-0 w-32 h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        )}
      </div>

      {/* Featured Insumos */}
      <FeaturedInsumos products={featuredInsumos} loading={loading} />

      {/* Recent listings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-foreground">Anúncios recentes</h2>
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-1 text-xs font-bold text-primary select-none">
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : recentListings.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-2xl">
          <p className="text-4xl mb-2">🌾</p>
          <p className="text-sm font-bold text-foreground mb-1">Nenhum anúncio ainda</p>
          <p className="text-xs text-muted-foreground">Seja o primeiro a anunciar na sua região.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recentListings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}

      {showRegionSelector && (
        <RegionSelector
          onSelect={handleSelectRegion}
          onCancel={() => setShowRegionSelector(false)}
        />
      )}

      <AnunciarModal
        open={showAnunciarModal}
        onClose={() => setShowAnunciarModal(false)}
      />
    </div>
  );
}