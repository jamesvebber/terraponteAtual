import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

const categories = [
  "Todos",
  "Ração Animal",
  "Milho em Grão",
  "Sal Mineral",
  "Medicamentos Veterinários",
  "Fertilizantes",
];

export default function InsumosFilters({ inputs, filters, setFilters }) {
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const cities = ["Todas", ...new Set(inputs.map((i) => i.city).filter(Boolean))];
  const maxDistance = Math.max(...inputs.map((i) => i.distance_km || 0), 500);
  const maxPrice = Math.max(...inputs.map((i) => (i.price || 0) + (i.freight_cost || 0)), 1000);

  const hasActiveFilters =
    filters.category !== "Todos" ||
    filters.city !== "Todas" ||
    filters.maxDistance < maxDistance ||
    filters.maxTotal < maxPrice;

  const reset = () =>
    setFilters({ category: "Todos", city: "Todas", maxDistance, maxTotal: maxPrice });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Category Drawer Trigger */}
        <button
          onClick={() => setCategoryDrawerOpen(true)}
          className="flex-1 h-11 rounded-xl bg-card border border-border text-sm font-medium px-3 flex items-center justify-between select-none"
        >
          <span className={filters.category === "Todos" ? "text-muted-foreground" : "text-foreground"}>
            {filters.category}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Filters Drawer Trigger */}
        <Button
          variant="outline"
          className={`h-11 rounded-xl px-4 gap-2 font-semibold select-none ${hasActiveFilters ? "border-primary text-primary" : ""}`}
          onClick={() => setFiltersDrawerOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
        </Button>
      </div>

      {/* Category Drawer */}
      <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Categoria</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilters((f) => ({ ...f, category: cat }));
                  setCategoryDrawerOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors select-none ${
                  filters.category === cat
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full rounded-xl select-none">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Advanced Filters Drawer */}
      <Drawer open={filtersDrawerOpen} onOpenChange={setFiltersDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-6 pb-2">
            {/* City */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Cidade</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilters((f) => ({ ...f, city: c }))}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors select-none ${
                      filters.city === c ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Max distance */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 block">
                Distância máxima: {filters.maxDistance} km
              </label>
              <Slider
                min={0}
                max={maxDistance}
                step={10}
                value={[filters.maxDistance]}
                onValueChange={([v]) => setFilters((f) => ({ ...f, maxDistance: v }))}
              />
            </div>

            {/* Max total cost */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 block">
                Custo total máximo: R$ {filters.maxTotal?.toFixed(2).replace(".", ",")}
              </label>
              <Slider
                min={0}
                max={maxPrice}
                step={5}
                value={[filters.maxTotal]}
                onValueChange={([v]) => setFilters((f) => ({ ...f, maxTotal: v }))}
              />
            </div>
          </div>
          <DrawerFooter>
            {hasActiveFilters && (
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground select-none" onClick={reset}>
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
            <DrawerClose asChild>
              <Button className="w-full rounded-xl select-none">Aplicar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}