import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import InputCard from "../components/InputCard";
import FilterBar from "../components/FilterBar";
import { Loader2, ShoppingBag } from "lucide-react";

export default function Insumos() {
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("price_asc");

  useEffect(() => {
    async function loadInputs() {
      const data = await base44.entities.AgriculturalInput.list();
      setInputs(data);
      setLoading(false);
    }
    loadInputs();
  }, []);

  const filtered = inputs.filter(
    (item) => category === "Todos" || item.category === category
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return (a.price || 0) - (b.price || 0);
      case "price_desc":
        return (b.price || 0) - (a.price || 0);
      case "distance_asc":
        return (a.distance_km || 9999) - (b.distance_km || 9999);
      case "distance_desc":
        return (b.distance_km || 0) - (a.distance_km || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Insumos</h1>
          <p className="text-xs text-muted-foreground font-medium">Compare preços e fornecedores</p>
        </div>
      </div>

      <div className="mb-4">
        <FilterBar
          category={category}
          setCategory={setCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">Nenhum insumo encontrado</p>
          <p className="text-muted-foreground/70 text-xs mt-1">Tente mudar os filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <InputCard key={item.id} input={item} />
          ))}
        </div>
      )}
    </div>
  );
}