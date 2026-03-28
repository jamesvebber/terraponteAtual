import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import InputCard from "../components/InputCard";
import InsumosFilters from "../components/InsumosFilters";
import { Loader2, ShoppingBag } from "lucide-react";

export default function Insumos() {
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "Todos",
    city: "Todas",
    maxDistance: 9999,
    maxTotal: 9999,
  });

  useEffect(() => {
    async function loadInputs() {
      const data = await base44.entities.AgriculturalInput.list();
      setInputs(data);
      const maxDist = Math.max(...data.map((i) => i.distance_km || 0), 500);
      const maxTotal = Math.max(...data.map((i) => (i.price || 0) + (i.freight_cost || 0)), 1000);
      setFilters({ category: "Todos", city: "Todas", maxDistance: maxDist, maxTotal });
      setLoading(false);
    }
    loadInputs();
  }, []);

  const withCusto = inputs.map((item) => ({
    ...item,
    custo_final: (item.price || 0) + (item.freight_cost || 0),
  }));

  const filtered = withCusto.filter((item) => {
    if (filters.category !== "Todos" && item.category !== filters.category) return false;
    if (filters.city !== "Todas" && item.city !== filters.city) return false;
    if (item.distance_km != null && item.distance_km > filters.maxDistance) return false;
    if (item.custo_final > filters.maxTotal) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => a.custo_final - b.custo_final);

  const bestId = sorted[0]?.id;
  const nearestId = [...filtered].sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999))[0]?.id;
  const maxCusto = sorted.length > 0 ? sorted[sorted.length - 1].custo_final : 0;

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Insumos</h1>
          <p className="text-xs text-muted-foreground font-medium">Compare preços e encontre o melhor custo</p>
        </div>
      </div>

      {!loading && (
        <div className="mb-4">
          <InsumosFilters inputs={inputs} filters={filters} setFilters={setFilters} />
        </div>
      )}

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
        <>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            {sorted.length} resultado{sorted.length !== 1 ? "s" : ""} · ordenado por menor custo total
          </p>
          <div className="space-y-3">
            {sorted.map((item) => (
              <InputCard
                key={item.id}
                input={item}
                isBest={item.id === bestId}
                isNearest={item.id === nearestId}
                economia={maxCusto - item.custo_final}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}