import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, TrendingUp, TrendingDown, RefreshCw, ChevronRight, Store, PlusCircle, ShoppingBag, Loader2, Edit2 } from "lucide-react";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

// --- Static reference prices (fallback/demo) ---
const DEMO_PRICES = [
  { id: "p1", product_name: "Boi Gordo", icon: "🐂", price: 285.0, unit: "@", trend: "up", ref_city: "São Luís de Montes Belos", ref_state: "GO", updated: "27/03" },
  { id: "p2", product_name: "Leite", icon: "🥛", price: 1.72, unit: "litro", trend: "down", ref_city: "Rio Verde", ref_state: "GO", updated: "06/03" },
  { id: "p3", product_name: "Milho", icon: "🌽", price: 72.0, unit: "saca 60kg", trend: "up", ref_city: "Goiânia", ref_state: "GO", updated: "26/03" },
  { id: "p4", product_name: "Soja", icon: "🌱", price: 138.5, unit: "saca 60kg", trend: "down", ref_city: "Jataí", ref_state: "GO", updated: "25/03" },
  { id: "p5", product_name: "Sal Mineral", icon: "🧂", price: 89.0, unit: "saco 25kg", trend: "up", ref_city: "Anápolis", ref_state: "GO", updated: "20/03" },
  { id: "p6", product_name: "Ração Bovina", icon: "🌾", price: 115.0, unit: "saco 50kg", trend: "up", ref_city: "Goiânia", ref_state: "GO", updated: "22/03" },
];

const REGION_KEY = "tp_user_region";

const GO_CITIES = [
  "Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia",
  "Jataí", "Catalão", "Itumbiara", "Caldas Novas", "Formosa",
  "São Luís de Montes Belos", "Córrego do Ouro", "Ceres", "Itaberaí",
  "Mineiros", "Quirinópolis", "Inhumas", "Trindade", "Senador Canedo",
];

// --- Sub-components ---

function PriceCard({ item }) {
  const isUp = item.trend === "up";
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{item.icon}</span>
        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "Alta" : "Baixa"}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{item.product_name}</p>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">
          R$ {item.price.toFixed(2).replace(".", ",")}
          <span className="text-sm font-semibold text-muted-foreground ml-1">/{item.unit}</span>
        </p>
      </div>
      <div className="border-t border-border pt-2 space-y-0.5">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          Próximo de {item.ref_city} – {item.ref_state}
        </p>
        <p className="text-[11px] text-muted-foreground font-medium">
          Preço mais recente · Atualizado em {item.updated}
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 bg-muted rounded-lg" />
        <div className="h-5 w-12 bg-muted rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-7 w-32 bg-muted rounded" />
      </div>
      <div className="border-t border-border pt-2 space-y-1">
        <div className="h-3 w-36 bg-muted rounded" />
        <div className="h-3 w-28 bg-muted rounded" />
      </div>
    </div>
  );
}

function LocationPermissionBanner({ onAllow, onDismiss }) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground mb-0.5">Mostrar preços da sua região</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permitir localização para ver preços, anúncios e insumos mais próximos de você.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAllow}
              className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold select-none"
            >
              Permitir localização
            </button>
            <button
              onClick={onDismiss}
              className="px-4 h-9 rounded-xl bg-muted text-muted-foreground text-xs font-semibold select-none"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegionBlock({ region, onChangeRegion }) {
  return (
    <button
      onClick={onChangeRegion}
      className="w-full bg-primary/10 border-2 border-primary/30 rounded-2xl px-4 py-3.5 flex items-center justify-between mb-4 select-none active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wide">Sua região</p>
          <p className="text-base font-extrabold text-foreground">{region}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm font-bold text-primary">
        <Edit2 className="h-4 w-4" /> Alterar
      </div>
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
          className="w-full h-11 px-4 rounded-xl border border-border bg-muted text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
          placeholder="Buscar cidade em Goiás..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="overflow-y-auto flex-1 space-y-1">
          <button
            onClick={() => onSelect("Goiás (estado)")}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted select-none"
          >
            🗺️ Goiás — estado inteiro
          </button>
          {filtered.map(city => (
            <button
              key={city}
              onClick={() => onSelect(`${city} – GO`)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted select-none"
            >
              📍 {city} – GO
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main Home Component ---
export default function Home() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(() => localStorage.getItem(REGION_KEY) || null);
  const [locationAsked, setLocationAsked] = useState(() => !!localStorage.getItem(REGION_KEY) || localStorage.getItem("tp_loc_asked") === "1");
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const loadPrices = useCallback(async () => {
    const data = await base44.entities.MarketPrice.list();
    if (data.length > 0) {
      setPrices(data.map(p => ({
        ...p,
        ref_city: p.ref_city || "Goiânia",
        ref_state: p.ref_state || "GO",
        updated: p.updated || new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      })));
    } else {
      setPrices(DEMO_PRICES);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  const { isPulling, pullActive, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(loadPrices);

  const handleAllowLocation = () => {
    setDetectingLocation(true);
    localStorage.setItem("tp_loc_asked", "1");
    setLocationAsked(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Reverse geocode using a free API
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`;
        const res = await fetch(url).then(r => r.json()).catch(() => null);
        const city = res?.address?.city || res?.address?.town || res?.address?.village || res?.address?.municipality;
        const state = res?.address?.state_code || "GO";
        const label = city ? `${city} – ${state}` : "Goiás (estado)";
        setRegion(label);
        localStorage.setItem(REGION_KEY, label);
        setDetectingLocation(false);
      },
      () => {
        // Denied or failed — show manual selector
        setDetectingLocation(false);
        setShowRegionSelector(true);
      },
      { timeout: 8000 }
    );
  };

  const handleDismissLocation = () => {
    localStorage.setItem("tp_loc_asked", "1");
    setLocationAsked(true);
    if (!region) setRegion("Goiás (estado)");
  };

  const handleSelectRegion = (r) => {
    setRegion(r);
    localStorage.setItem(REGION_KEY, r);
    localStorage.setItem("tp_loc_asked", "1");
    setLocationAsked(true);
    setShowRegionSelector(false);
  };

  const regionLabel = region || "Goiás (estado)";

  return (
    <div
      className="px-4 pt-5 pb-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullActive && (
        <div className="flex justify-center pb-2">
          <Loader2 className={`h-5 w-5 text-primary ${isPulling ? "animate-spin" : "opacity-40"}`} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md shrink-0">
          <span className="text-2xl">🌾</span>
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground tracking-tight leading-tight">Mercado da sua região</h1>
          <p className="text-xs text-muted-foreground font-medium">Preços mais recentes do agro perto de você</p>
        </div>
      </div>

      {/* Location permission banner */}
      {!locationAsked && (
        <LocationPermissionBanner onAllow={handleAllowLocation} onDismiss={handleDismissLocation} />
      )}

      {/* Detecting location */}
      {detectingLocation && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-2xl px-4 py-3 mb-4">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <p className="text-sm font-semibold text-primary">Detectando sua localização...</p>
        </div>
      )}

      {/* Region block */}
      {locationAsked && !detectingLocation && (
        <RegionBlock region={regionLabel} onChangeRegion={() => setShowRegionSelector(true)} />
      )}

      {/* Regional context label */}
      {locationAsked && (
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold text-primary">Mostrando resultados para sua região</p>
        </div>
      )}

      {/* Price cards */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-foreground">Cotações</h2>
        <p className="text-[11px] text-muted-foreground font-medium">Preço mais recente</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {prices.map((item, idx) => (
            <PriceCard key={item.id || idx} item={item} />
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-base font-extrabold text-foreground mb-3">Acesso rápido</h2>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <QuickAction
          emoji="🛒"
          label="Ver anúncios"
          sublabel="Produtos de produtores locais"
          onClick={() => navigate("/marketplace")}
          primary
        />
        <QuickAction
          emoji="🌿"
          label="Ver insumos"
          sublabel="Compare preços de lojas"
          onClick={() => navigate("/insumos")}
        />
        <QuickAction
          emoji="🏪"
          label="Minha loja"
          sublabel="Cadastrar ou gerenciar"
          onClick={() => navigate("/minha-loja")}
        />
        <QuickAction
          emoji="📢"
          label="Anunciar produto"
          sublabel="Venda direto pelo WhatsApp"
          onClick={() => navigate("/vender")}
        />
      </div>

      {/* Region selector modal */}
      {showRegionSelector && (
        <RegionSelector
          onSelect={handleSelectRegion}
          onCancel={() => {
            setShowRegionSelector(false);
            if (!region) {
              setRegion("Goiás (estado)");
              localStorage.setItem(REGION_KEY, "Goiás (estado)");
            }
            localStorage.setItem("tp_loc_asked", "1");
            setLocationAsked(true);
          }}
        />
      )}
    </div>
  );
}

function QuickAction({ emoji, label, sublabel, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border text-left transition-colors select-none active:scale-95 ${
        primary
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:bg-muted"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className={`text-sm font-extrabold leading-tight ${primary ? "text-primary-foreground" : "text-foreground"}`}>{label}</p>
        <p className={`text-[11px] font-medium mt-0.5 leading-tight ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{sublabel}</p>
      </div>
    </button>
  );
}