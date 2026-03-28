import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  "Todos",
  "Ração Animal",
  "Milho em Grão",
  "Sal Mineral",
  "Medicamentos Veterinários",
  "Fertilizantes",
];

export default function InsumosFilters({ inputs, filters, setFilters }) {
  const [open, setOpen] = useState(false);

  // Derive unique cities from inputs
  const cities = ["Todas", ...new Set(inputs.map((i) => i.city).filter(Boolean))];

  const maxDistance = Math.max(...inputs.map((i) => i.distance_km || 0), 500);
  const maxPrice = Math.max(...inputs.map((i) => (i.price || 0) + (i.freight_cost || 0)), 1000);

  const hasActiveFilters =
    filters.category !== "Todos" ||
    filters.city !== "Todas" ||
    filters.maxDistance < maxDistance ||
    filters.maxTotal < maxPrice;

  const reset = () =>
    setFilters({
      category: "Todos",
      city: "Todas",
      maxDistance,
      maxTotal: maxPrice,
    });

  return (
    <div className="space-y-2">
      {/* Top row: category + filter toggle */}
      <div className="flex gap-2">
        <Select
          value={filters.category}
          onValueChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        >
          <SelectTrigger className="flex-1 h-11 rounded-xl bg-card border-border text-sm font-medium">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className={`h-11 rounded-xl px-4 gap-2 font-semibold ${
            hasActiveFilters ? "border-primary text-primary" : ""
          }`}
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* Expanded filters */}
      {open && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          {/* City */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
              Cidade
            </label>
            <Select
              value={filters.city}
              onValueChange={(v) => setFilters((f) => ({ ...f, city: v }))}
            >
              <SelectTrigger className="h-11 rounded-xl text-sm font-medium">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max distance */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
              Distância máxima: {filters.maxDistance} km
            </label>
            <Slider
              min={0}
              max={maxDistance}
              step={10}
              value={[filters.maxDistance]}
              onValueChange={([v]) => setFilters((f) => ({ ...f, maxDistance: v }))}
              className="mt-1"
            />
          </div>

          {/* Max total cost */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
              Custo total máximo: R$ {filters.maxTotal?.toFixed(2).replace(".", ",")}
            </label>
            <Slider
              min={0}
              max={maxPrice}
              step={5}
              value={[filters.maxTotal]}
              onValueChange={([v]) => setFilters((f) => ({ ...f, maxTotal: v }))}
              className="mt-1"
            />
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={reset}>
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}