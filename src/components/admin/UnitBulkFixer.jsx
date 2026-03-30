/**
 * UnitBulkFixer — ferramenta admin para corrigir unidades de produtos em lote.
 * Permite filtrar por loja/categoria, selecionar vários produtos e aplicar
 * uma unidade correta a todos de uma vez.
 */
import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const UNIT_OPTIONS = [
  "unidade", "par", "kit", "peça",
  "saco", "pacote", "caixa", "balde",
  "kg", "g", "tonelada",
  "litro", "mL", "galão",
  "frasco", "ampola", "bisnaga", "dose",
  "comprimido", "cartela",
];

// Unidades suspeitas por categoria — usadas para destacar prováveis erros
const SUSPICIOUS = {
  "Medicamentos veterinários": ["saco", "tonelada", "galão"],
  "Ferramentas": ["saco", "kg", "litro", "mL"],
  "Selaria": ["saco", "kg", "litro"],
  "Pet shop": ["saco", "tonelada"],
  "Equipamentos": ["saco", "kg", "litro"],
  "Peças": ["saco", "litro"],
  "Vestuário rural": ["saco", "litro", "kg"],
  "Calçados": ["saco", "litro", "kg"],
};

function isSuspicious(product) {
  const suspicious = SUSPICIOUS[product.category] || [];
  return suspicious.includes(product.pkg_type);
}

export default function UnitBulkFixer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkUnit, setBulkUnit] = useState("");
  const [filterStore, setFilterStore] = useState("Todas");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(true);
  const [search, setSearch] = useState("");
  const [unitEdits, setUnitEdits] = useState({});

  useEffect(() => {
    base44.entities.InsumoProduct.list("-created_date", 500).then(ps => {
      setProducts(ps);
      setLoading(false);
    });
  }, []);

  const stores = useMemo(() => ["Todas", ...new Set(products.map(p => p.supplier_name).filter(Boolean))], [products]);
  const categories = useMemo(() => ["Todas", ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  const filtered = useMemo(() => products.filter(p => {
    if (filterStore !== "Todas" && p.supplier_name !== filterStore) return false;
    if (filterCategory !== "Todas" && p.category !== filterCategory) return false;
    if (showOnlySuspicious && !isSuspicious(p)) return false;
    if (search && !p.product_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, filterStore, filterCategory, showOnlySuspicious, search]);

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  };

  const applyBulkUnit = async () => {
    if (!bulkUnit || selected.size === 0) {
      toast.error("Selecione produtos e escolha a unidade.");
      return;
    }
    setSaving(true);
    let count = 0;
    for (const id of selected) {
      await base44.entities.InsumoProduct.update(id, { pkg_type: bulkUnit, unit: bulkUnit });
      count++;
    }
    setProducts(ps => ps.map(p => selected.has(p.id) ? { ...p, pkg_type: bulkUnit, unit: bulkUnit } : p));
    setSelected(new Set());
    setSaving(false);
    toast.success(`${count} produto${count !== 1 ? "s" : ""} atualizados com unidade "${bulkUnit}".`);
  };

  const saveSingleUnit = async (prod) => {
    const newUnit = unitEdits[prod.id];
    if (!newUnit) return;
    await base44.entities.InsumoProduct.update(prod.id, { pkg_type: newUnit, unit: newUnit });
    setProducts(ps => ps.map(p => p.id === prod.id ? { ...p, pkg_type: newUnit, unit: newUnit } : p));
    setUnitEdits(prev => { const n = { ...prev }; delete n[prod.id]; return n; });
    toast.success("Unidade salva!");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  const suspiciousCount = products.filter(isSuspicious).length;

  return (
    <div className="space-y-4">
      {/* Alert */}
      {suspiciousCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">{suspiciousCount} produto{suspiciousCount !== 1 ? "s" : ""} com unidade provavelmente errada</p>
            <p className="text-xs text-amber-700 mt-0.5">Produtos com categoria incompatível com a unidade atual estão marcados em laranja. Selecione-os e aplique a correção em lote.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Filtros</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-bold text-foreground mb-1">Loja</p>
            <select
              className="w-full h-9 rounded-xl border border-border bg-card text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              value={filterStore}
              onChange={e => setFilterStore(e.target.value)}
            >
              {stores.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground mb-1">Categoria</p>
            <select
              className="w-full h-9 rounded-xl border border-border bg-card text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <input
          className="w-full h-9 px-3 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Buscar por nome de produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowOnlySuspicious(v => !v)}
          className={`flex items-center gap-2 text-sm font-semibold select-none px-3 py-2 rounded-xl border transition-colors ${showOnlySuspicious ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-card border-border text-foreground"}`}
        >
          {showOnlySuspicious ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          Mostrar apenas suspeitos ({suspiciousCount})
        </button>
      </div>

      {/* Bulk action bar */}
      {filtered.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-extrabold text-primary uppercase tracking-widest">Correção em lote</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
              {selected.size === filtered.length ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              {selected.size === filtered.length ? "Desmarcar todos" : `Selecionar todos (${filtered.length})`}
            </button>
            {selected.size > 0 && (
              <span className="ml-auto text-xs font-bold text-primary">{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 h-10 rounded-xl border border-border bg-card text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
              value={bulkUnit}
              onChange={e => setBulkUnit(e.target.value)}
            >
              <option value="">— escolha a unidade correta —</option>
              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <Button
              className="h-10 px-4 rounded-xl font-bold gap-1"
              disabled={!bulkUnit || selected.size === 0 || saving}
              onClick={applyBulkUnit}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </Button>
          </div>
        </div>
      )}

      {/* Product list */}
      <p className="text-xs text-muted-foreground font-medium">{filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-sm font-bold text-foreground">Nenhum produto suspeito encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Desmarque o filtro "suspeitos" para ver todos os produtos.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(prod => {
          const suspicious = isSuspicious(prod);
          const editVal = unitEdits[prod.id];
          const displayUnit = prod.pkg_type || "(sem unidade)";
          return (
            <div
              key={prod.id}
              className={`bg-card border rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                selected.has(prod.id) ? "border-primary bg-primary/5" : suspicious ? "border-amber-300 bg-amber-50/50" : "border-border"
              }`}
              onClick={() => toggleSelect(prod.id)}
            >
              <div className="shrink-0">
                {selected.has(prod.id)
                  ? <CheckSquare className="h-5 w-5 text-primary" />
                  : <Square className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-xs leading-tight truncate">{prod.product_name}</p>
                <p className="text-[10px] text-muted-foreground">{prod.category} · {prod.supplier_name}</p>
                <p className="text-[10px]">
                  Unidade: <span className={`font-bold ${suspicious ? "text-amber-700" : "text-foreground"}`}>
                    {displayUnit} {suspicious && "⚠️"}
                  </span>
                </p>
              </div>
              {/* Individual edit (stop propagation) */}
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <input
                  className="w-20 h-7 px-2 rounded-lg border border-border bg-card text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={prod.pkg_type || "unit"}
                  value={editVal !== undefined ? editVal : ""}
                  onChange={e => setUnitEdits(prev => ({ ...prev, [prod.id]: e.target.value }))}
                />
                {editVal !== undefined && editVal !== "" && (
                  <button
                    onClick={() => saveSingleUnit(prod)}
                    className="h-7 px-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold"
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}