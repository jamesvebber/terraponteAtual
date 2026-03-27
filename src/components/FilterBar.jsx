import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = [
  "Todos",
  "Ração Animal",
  "Milho em Grão",
  "Sal Mineral",
  "Medicamentos Veterinários",
  "Fertilizantes",
];

const sortOptions = [
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "distance_asc", label: "Mais perto" },
  { value: "distance_desc", label: "Mais longe" },
];

export default function FilterBar({ category, setCategory, sortBy, setSortBy }) {
  return (
    <div className="flex gap-2">
      <Select value={category} onValueChange={setCategory}>
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

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="flex-1 h-11 rounded-xl bg-card border-border text-sm font-medium">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}