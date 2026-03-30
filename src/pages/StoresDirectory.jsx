import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Search, Store, MapPin, BadgeCheck, ShieldCheck, Loader2, PlusCircle } from "lucide-react";
import { slugify } from "../utils/slugify";
import { useAuth } from "@/lib/AuthContext";

const VERIFY_CONFIG = {
  verificada: { label: "Verificada", color: "bg-green-100 text-green-700", icon: BadgeCheck },
  representante_oficial: { label: "Rep. Oficial", color: "bg-amber-100 text-amber-700", icon: ShieldCheck },
};

const TYPES = ["Todos", "Agropecuária", "Cooperativa", "Fornecedor de insumos", "Loja", "Revendedor"];

export default function StoresDirectory() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");

  useEffect(() => {
    base44.entities.SupplierProfile.filter({ is_suspended: false }, "-created_date", 200)
      .then(data => { setStores(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => stores.filter(s => {
    if (selectedType !== "Todos" && s.supplier_type !== selectedType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.store_name?.toLowerCase().includes(q) && !s.city?.toLowerCase().includes(q) && !s.supplier_type?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [stores, search, selectedType]);

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
            <Store className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Lojas</h1>
            <p className="text-xs text-muted-foreground font-medium">Fornecedores da sua região</p>
          </div>
        </div>
        {isAuthenticated && (
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-xs font-bold" onClick={() => navigate("/minha-loja")}>
            <PlusCircle className="h-3.5 w-3.5" /> Minha loja
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Buscar loja, cooperativa, cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-4 scrollbar-hide">
        {TYPES.map(type => (
          <button key={type} onClick={() => setSelectedType(type)}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold border transition-colors select-none ${
              selectedType === type ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
            }`}>
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-3 block">🏪</span>
          <p className="font-bold text-foreground mb-1">Nenhuma loja encontrada</p>
          <p className="text-sm text-muted-foreground">Tente outro termo ou seja o primeiro a cadastrar.</p>
          {isAuthenticated && (
            <Button className="mt-4 rounded-xl gap-2" onClick={() => navigate("/minha-loja")}>
              <PlusCircle className="h-4 w-4" /> Cadastrar minha loja
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground font-medium mb-3">{filtered.length} loja{filtered.length !== 1 ? "s" : ""}</p>
          <div className="space-y-3">
            {filtered.map(store => {
              const verif = VERIFY_CONFIG[store.verification_status];
              const VerifIcon = verif?.icon;
              return (
                <button
                  key={store.id}
                  onClick={() => navigate(`/loja/${slugify(store.store_name)}`)}
                  className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.99] transition-transform select-none"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {store.logo_url
                      ? <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                      : <Store className="h-7 w-7 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-foreground text-sm">{store.store_name}</p>
                      {verif && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${verif.color}`}>
                          <VerifIcon className="h-3 w-3" />{verif.label}
                        </span>
                      )}
                    </div>
                    {store.supplier_type && (
                      <p className="text-xs text-muted-foreground font-medium">{store.supplier_type}</p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{[store.city, store.region].filter(Boolean).join(", ")}</p>
                    </div>
                    {store.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{store.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}