import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, TrendingUp, TrendingDown, ShoppingCart, PlusCircle, ShoppingBag, Store, RefreshCw, Loader2, ChevronRight, Clock, Edit2 } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";

// ---------- helpers ----------
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

const DEMO_PRICES = [
  { product_name: "Boi Gordo", icon: "🐂", price: 285.0, unit: "@", trend: "up" },
  { product_name: "Leite", icon: "🥛", price: 1.72, unit: "L", trend: "down" },
  { product_name: "Milho", icon: "🌽", price: 72.0, unit: "sc", trend: "up" },
  { product_name: "Soja", icon: "🌱", price: 138.5, unit: "sc", trend: "down" },
  { product_name: "Sal Mineral", icon: "🧂", price: 89.0, unit: "sc 25kg", trend: "up" },
  { product_name: "Ração Bovina", icon: "🌾", price: 115.0, unit: "sc 50kg", trend: "up" },
];

const REGION_KEY = "tp_user_region";
const GO_CITIES = [
  "Goiânia","Aparecida de Goiânia","Anápolis","Rio Verde","Luziânia","Jataí",
  "Catalão","Itumbiara","Caldas Novas","Formosa","São Luís de Montes Belos",
  "Córrego do Ouro","Ceres","Itaberaí","Mineiros","Quirinópolis","Inhumas","Trindade","Senador Canedo",
];

// ---------- sub-components ----------
function StatCard({ value, label, emoji, loading }) {
  return (
    <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 flex flex-col items-center">
      {loading ? (
        <div className="h-7 w-16 bg-muted rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
      )}
      <p className="text-[11px] text-muted-foreground font-medium text-center leading-tight">{emoji} {label}</p>
    </div>
  );
}

function PriceChip({ item }) {
  const isUp = item.trend === "up";
  return (
    <div className="flex-shrink-0 bg-card border border-border rounded-2xl px-3 py-2.5 flex flex-col gap-1 min-w-[110px]">
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
    </div>
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

// ---------- main ----------
export default function Home() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [listingCount, setListingCount] = useState(null);
  const [storeCount, setStoreCount] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newToday, setNewToday] = useState(null);

  const [region, setRegion] = useState(() => localStorage.getItem(REGION_KEY) || "Goiás (estado)");
  const [showRegionSelector, setShowRegionSelector] = useState(false);

  const load = useCallback(async () => {
    const [priceData, listings, stores] = await Promise.all([
      base44.entities.MarketPrice.list(),
      base44.entities.Listing.filter({ status: "active" }, "-created_date", 50),
      base44.entities.SupplierProfile.list("-created_date", 100),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = listings.filter(l => new Date(l.created_date) >= today).length;

    setPrices(priceData.length > 0 ? priceData : DEMO_PRICES);
    setListingCount(listings.length);
    setStoreCount(stores.length);
    setNewToday(todayCount);
    setRecentListings(listings.slice(0, 6));
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

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center shadow shrink-0">
            <span className="text-xl">🌾</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground leading-tight">TerraPonte</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Mercado rural em tempo real</p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* ── Region pill ── */}
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

      {/* ── Stats row ── */}
      <div className="flex gap-3 mb-5">
        <StatCard value={listingCount ?? "–"} label="anúncios ativos" emoji="📢" loading={loading} />
        <StatCard value={storeCount ?? "–"} label="lojas parceiras" emoji="🏩" loading={loading} />
        <StatCard value={newToday ?? "–"} label="novos hoje" emoji="✨" loading={loading} />
      </div>

      {/* ── Action tiles ── */}
      <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3">O que você precisa?</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <ActionTile emoji="🛒" label="Comprar" sublabel="Anúncios de produtores locais" onClick={() => navigate("/marketplace")} primary />
        <ActionTile emoji="📢" label="Vender" sublabel="Publique e venda pelo WhatsApp" onClick={() => navigate("/vender")} />
        <ActionTile emoji="🌿" label="Insumos" sublabel="Compare preços de lojas" onClick={() => navigate("/insumos")} />
        <ActionTile emoji="🏪" label="Lojas" sublabel="Fornecedores da sua região" onClick={() => navigate("/minha-loja")} />
      </div>

      {/* ── Market prices ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-foreground">Cotações</h2>
        <span className="text-[11px] text-muted-foreground font-medium">Preços de referência</span>
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="flex-shrink-0 w-28 h-24 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 mb-6 scrollbar-hide">
          {prices.map((p, i) => <PriceChip key={p.id || i} item={p} />)}
        </div>
      )}

      {/* ── Recent listings ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-foreground">Anúncios recentes</h2>
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-1 text-xs font-bold text-primary select-none">
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-56 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : recentListings.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-2xl">
          <p className="text-4xl mb-2">🌾</p>
          <p className="text-sm font-bold text-foreground mb-1">Nenhum anúncio ainda</p>
          <p className="text-xs text-muted-foreground">Seja o primeiro a anunciar na sua região.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
            : recentListings.map(l => <ListingCard key={l.id} listing={l} />)
          }
        </div>
      )}

      {showRegionSelector && (
        <RegionSelector
          onSelect={handleSelectRegion}
          onCancel={() => setShowRegionSelector(false)}
        />
      )}
    </div>
  );
}