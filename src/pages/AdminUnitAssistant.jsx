/**
 * AdminUnitAssistant — ferramenta interna de correção em massa de unidades
 * usando IA para inferir a unidade correta por produto.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Sparkles, CheckSquare, Square,
  RotateCcw, CheckCircle2, AlertTriangle, HelpCircle, Filter,
} from "lucide-react";

// ─── Regras de inferência locais (rápidas, sem IA) ────────────────
const CATEGORY_UNITS = {
  "Medicamentos veterinários": { units: ["frasco", "mL", "ampola", "bisnaga", "dose", "comprimido", "cartela", "caixa", "unidade"], never: ["saco", "kg", "tonelada"] },
  "Ração": { units: ["saco", "kg", "pacote", "tonelada", "g"], never: [] },
  "Sal mineral": { units: ["saco", "kg", "pacote", "tonelada"], never: [] },
  "Adubo": { units: ["saco", "kg", "litro", "galão", "balde", "tonelada"], never: [] },
  "Sementes": { units: ["saco", "kg", "pacote", "g"], never: [] },
  "Suplementos": { units: ["saco", "kg", "litro", "frasco", "pacote"], never: [] },
  "Herbicidas": { units: ["litro", "mL", "galão", "frasco", "kg"], never: ["saco"] },
  "Inseticidas": { units: ["litro", "mL", "frasco", "galão", "kg"], never: ["saco"] },
  "Ferramentas": { units: ["unidade", "kit", "peça", "par"], never: ["saco", "kg", "litro"] },
  "Selaria": { units: ["unidade", "par", "kit", "peça"], never: ["saco", "kg"] },
  "Pet shop": { units: ["unidade", "pacote", "frasco", "caixa", "kg"], never: ["saco"] },
  "Equipamentos": { units: ["unidade", "kit", "peça"], never: ["saco", "kg", "litro"] },
  "Peças": { units: ["unidade", "peça", "kit", "par"], never: ["saco"] },
  "Vestuário rural": { units: ["unidade", "par", "kit"], never: ["saco", "kg"] },
  "Calçados": { units: ["par", "unidade"], never: ["saco", "kg"] },
};

function inferLocalUnit(product) {
  const cat = CATEGORY_UNITS[product.category];
  if (!cat) return null;

  const current = (product.pkg_type || "").toLowerCase().trim();
  const neverList = cat.never || [];

  // Current is valid
  if (current && !neverList.includes(current)) return null;

  const suggested = cat.units[0];
  const isSuspicious = neverList.includes(current) || current === "saco" && cat.never.includes("saco");
  const isEmpty = !current || current === "";

  if (isSuspicious || isEmpty) {
    return {
      suggested,
      confidence: isSuspicious ? "alto" : "médio",
      reason: isSuspicious
        ? `"${current || "sem unidade"}" é incompatível com ${product.category}. Unidade mais comum: "${suggested}".`
        : `Produto sem unidade definida. Sugestão baseada na categoria "${product.category}".`,
    };
  }
  return null;
}

const CONFIDENCE_CONFIG = {
  alto: { label: "Alta", cls: "bg-green-100 text-green-700", icon: CheckCircle2 },
  médio: { label: "Média", cls: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  baixo: { label: "Baixa", cls: "bg-muted text-muted-foreground", icon: HelpCircle },
};

const UNIT_OPTIONS = [
  "unidade", "par", "kit", "peça",
  "saco", "pacote", "caixa", "balde",
  "kg", "g", "tonelada",
  "litro", "mL", "galão",
  "frasco", "ampola", "bisnaga", "dose",
  "comprimido", "cartela",
];

export default function AdminUnitAssistant() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // { productId, suggested, confidence, reason, status: 'pending'|'applied'|'ignored' }
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [applying, setApplying] = useState(false);
  const [undoStack, setUndoStack] = useState([]); // [{id, oldUnit}]
  const [overrides, setOverrides] = useState({}); // productId -> manual unit edit
  const [filterStore, setFilterStore] = useState("Todas");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterConfidence, setFilterConfidence] = useState("Todas");
  const [aiMode, setAiMode] = useState(false); // local rules vs AI

  useEffect(() => {
    if (!isLoadingAuth && user?.role !== "admin") navigate("/");
  }, [isLoadingAuth, user]);

  useEffect(() => {
    base44.entities.InsumoProduct.list("-created_date", 500).then(ps => {
      setProducts(ps);
      setLoading(false);
    });
  }, []);

  const stores = useMemo(() => ["Todas", ...new Set(products.map(p => p.supplier_name).filter(Boolean))], [products]);
  const categories = useMemo(() => ["Todas", ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  // ─── Run local inference ────────────────────────────────────────
  const runLocalAnalysis = () => {
    const results = [];
    for (const p of products) {
      const inferred = inferLocalUnit(p);
      if (inferred) {
        results.push({ productId: p.id, ...inferred, status: "pending" });
      }
    }
    setSuggestions(results);
    setSelected(new Set());
    toast.success(`${results.length} problema${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}.`);
  };

  // ─── Run AI inference ───────────────────────────────────────────
  const runAIAnalysis = async () => {
    setAnalyzing(true);
    // Analyze in chunks of 20
    const problematic = products.filter(p => {
      const cat = CATEGORY_UNITS[p.category];
      const cur = (p.pkg_type || "").toLowerCase().trim();
      return !cur || (cat && cat.never.includes(cur));
    });

    if (problematic.length === 0) {
      toast.success("Nenhum produto problemático encontrado!");
      setAnalyzing(false);
      return;
    }

    const chunkSize = 20;
    const allResults = [];

    for (let i = 0; i < problematic.length; i += chunkSize) {
      const chunk = problematic.slice(i, i + chunkSize);
      const productList = chunk.map(p =>
        `ID: ${p.id} | Nome: ${p.product_name} | Categoria: ${p.category} | Unidade atual: "${p.pkg_type || "vazia"}" | Descrição: ${p.description || ""} | Marca: ${p.brand || ""}`
      ).join("\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente especialista em agropecuária brasileira. Analise os produtos abaixo e sugira a unidade de venda mais adequada para cada um.

Unidades permitidas: unidade, par, kit, peça, saco, pacote, caixa, balde, kg, g, tonelada, litro, mL, galão, frasco, ampola, bisnaga, dose, comprimido, cartela

Regras:
- Medicamentos veterinários: frasco, mL, ampola, bisnaga, dose, comprimido, cartela, caixa, unidade — NUNCA saco
- Rações, sal mineral, sementes, adubo, suplementos: saco, kg, pacote, tonelada
- Ferramentas, selaria, equipamentos, peças: unidade, kit, peça, par
- Herbicidas, inseticidas: litro, mL, galão, frasco
- Pet shop: unidade, pacote, frasco, caixa, kg

Para cada produto retorne:
- productId: o ID exato
- suggested: a unidade sugerida
- confidence: "alto", "médio" ou "baixo"
- reason: motivo em português, 1 frase curta

Produtos:
${productList}`,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  suggested: { type: "string" },
                  confidence: { type: "string" },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
      });

      if (res?.results) {
        allResults.push(...res.results.map(r => ({ ...r, status: "pending" })));
      }
    }

    setSuggestions(allResults);
    setSelected(new Set());
    setAnalyzing(false);
    toast.success(`IA analisou ${allResults.length} produto${allResults.length !== 1 ? "s" : ""}.`);
  };

  // ─── Filter suggestions ─────────────────────────────────────────
  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);

  const visibleSuggestions = useMemo(() => suggestions.filter(s => {
    if (s.status !== "pending") return false;
    const p = productMap[s.productId];
    if (!p) return false;
    if (filterStore !== "Todas" && p.supplier_name !== filterStore) return false;
    if (filterCategory !== "Todas" && p.category !== filterCategory) return false;
    if (filterConfidence !== "Todas" && s.confidence !== filterConfidence) return false;
    return true;
  }), [suggestions, filterStore, filterCategory, filterConfidence, productMap]);

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const toggleAll = () => {
    if (selected.size === visibleSuggestions.length) setSelected(new Set());
    else setSelected(new Set(visibleSuggestions.map(s => s.productId)));
  };

  // ─── Apply selected suggestions ─────────────────────────────────
  const applySelected = async () => {
    if (selected.size === 0) { toast.error("Selecione ao menos um produto."); return; }
    setApplying(true);
    const undoEntries = [];
    for (const productId of selected) {
      const p = productMap[productId];
      const s = suggestions.find(x => x.productId === productId);
      const finalUnit = overrides[productId] || s?.suggested;
      if (!finalUnit || !p) continue;
      undoEntries.push({ id: productId, oldUnit: p.pkg_type || "" });
      await base44.entities.InsumoProduct.update(productId, { pkg_type: finalUnit, unit: finalUnit });
    }
    // Update local state
    setProducts(ps => ps.map(p => {
      if (!selected.has(p.id)) return p;
      const s = suggestions.find(x => x.productId === p.id);
      const finalUnit = overrides[p.id] || s?.suggested;
      return finalUnit ? { ...p, pkg_type: finalUnit, unit: finalUnit } : p;
    }));
    setSuggestions(prev => prev.map(s =>
      selected.has(s.productId) ? { ...s, status: "applied" } : s
    ));
    setUndoStack(prev => [...prev, ...undoEntries]);
    setSelected(new Set());
    setApplying(false);
    toast.success(`${undoEntries.length} produto${undoEntries.length !== 1 ? "s" : ""} atualizado${undoEntries.length !== 1 ? "s" : ""}!`);
  };

  const ignoreSelected = () => {
    setSuggestions(prev => prev.map(s =>
      selected.has(s.productId) ? { ...s, status: "ignored" } : s
    ));
    setSelected(new Set());
    toast.success("Sugestões ignoradas.");
  };

  // ─── Undo last batch ─────────────────────────────────────────────
  const undoLast = async () => {
    if (undoStack.length === 0) return;
    const toUndo = undoStack.slice(-20); // undo up to last 20
    for (const entry of toUndo) {
      await base44.entities.InsumoProduct.update(entry.id, { pkg_type: entry.oldUnit, unit: entry.oldUnit });
    }
    setProducts(ps => ps.map(p => {
      const entry = toUndo.find(u => u.id === p.id);
      return entry ? { ...p, pkg_type: entry.oldUnit, unit: entry.oldUnit } : p;
    }));
    setSuggestions(prev => prev.map(s => {
      const entry = toUndo.find(u => u.id === s.productId);
      return entry ? { ...s, status: "pending" } : s;
    }));
    setUndoStack(prev => prev.slice(0, -20));
    toast.success(`${toUndo.length} alteração${toUndo.length !== 1 ? "ões" : ""} desfeita${toUndo.length !== 1 ? "s" : ""}!`);
  };

  const appliedCount = suggestions.filter(s => s.status === "applied").length;
  const ignoredCount = suggestions.filter(s => s.status === "ignored").length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="px-4 pt-5 pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/admin")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-foreground">Assistente de unidades</h1>
          <p className="text-xs text-muted-foreground">{products.length} produtos · {visibleSuggestions.length} sugestões pendentes</p>
        </div>
        {undoStack.length > 0 && (
          <button onClick={undoLast} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-muted text-muted-foreground text-xs font-bold select-none">
            <RotateCcw className="h-3.5 w-3.5" /> Desfazer ({undoStack.length})
          </button>
        )}
      </div>

      {/* Analysis mode */}
      {suggestions.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Analisar produtos</p>
              <p className="text-xs text-muted-foreground">Detecta unidades incorretas e sugere correções</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAiMode(false)}
              className={`p-3 rounded-xl border-2 text-left transition-all select-none ${!aiMode ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <p className="font-bold text-sm text-foreground">⚡ Regras locais</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rápido, sem custo. Detecta inconsistências por categoria.</p>
            </button>
            <button
              type="button"
              onClick={() => setAiMode(true)}
              className={`p-3 rounded-xl border-2 text-left transition-all select-none ${aiMode ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <p className="font-bold text-sm text-foreground">✨ Análise com IA</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mais preciso. Lê nome, descrição e marca para inferir unidade.</p>
            </button>
          </div>

          <Button
            className="w-full h-12 rounded-xl font-bold gap-2"
            onClick={aiMode ? runAIAnalysis : runLocalAnalysis}
            disabled={analyzing}
          >
            {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {analyzing ? "Analisando..." : aiMode ? "Analisar com IA" : "Analisar agora"}
          </Button>
        </div>
      )}

      {/* Stats bar */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Pendentes", value: visibleSuggestions.length, color: "text-amber-600" },
            { label: "Aplicados", value: appliedCount, color: "text-green-600" },
            { label: "Ignorados", value: ignoredCount, color: "text-muted-foreground" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {suggestions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filtros</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="h-9 rounded-xl border border-border bg-card text-xs px-2 focus:outline-none" value={filterStore} onChange={e => setFilterStore(e.target.value)}>
              {stores.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="h-9 rounded-xl border border-border bg-card text-xs px-2 focus:outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="h-9 rounded-xl border border-border bg-card text-xs px-2 focus:outline-none" value={filterConfidence} onChange={e => setFilterConfidence(e.target.value)}>
              {["Todas", "alto", "médio", "baixo"].map(c => <option key={c} value={c}>{c === "Todas" ? "Confiança" : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {visibleSuggestions.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
              {selected.size === visibleSuggestions.length
                ? <CheckSquare className="h-4 w-4 text-primary" />
                : <Square className="h-4 w-4 text-muted-foreground" />}
              {selected.size === visibleSuggestions.length ? "Desmarcar todos" : `Selecionar todos (${visibleSuggestions.length})`}
            </button>
            {selected.size > 0 && (
              <span className="text-xs font-bold text-primary">{selected.size} selecionado{selected.size !== 1 ? "s" : ""}</span>
            )}
          </div>

          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-xl gap-1.5 font-bold" onClick={applySelected} disabled={applying}>
                {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Aplicar sugestões
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl px-3 text-muted-foreground" onClick={ignoreSelected}>
                Ignorar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Suggestion list */}
      {visibleSuggestions.length === 0 && suggestions.length > 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-sm font-bold text-foreground">Tudo certo com os filtros atuais</p>
          <button
            className="text-xs text-primary font-bold mt-3 underline"
            onClick={() => { setSuggestions([]); setUndoStack([]); setSelected(new Set()); }}
          >
            Nova análise
          </button>
        </div>
      )}

      <div className="space-y-2">
        {visibleSuggestions.map(s => {
          const p = productMap[s.productId];
          if (!p) return null;
          const conf = CONFIDENCE_CONFIG[s.confidence] || CONFIDENCE_CONFIG.baixo;
          const ConfIcon = conf.icon;
          const manualUnit = overrides[s.productId];
          const finalUnit = manualUnit || s.suggested;
          return (
            <div
              key={s.productId}
              className={`bg-card border rounded-xl p-3 transition-colors cursor-pointer ${
                selected.has(s.productId) ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => toggleSelect(s.productId)}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {selected.has(s.productId)
                    ? <CheckSquare className="h-5 w-5 text-primary" />
                    : <Square className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-foreground text-sm leading-tight truncate">{p.product_name}</p>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${conf.cls}`}>
                      <ConfIcon className="h-3 w-3" /> {conf.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{p.category} · {p.supplier_name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-red-600 font-semibold line-through">{p.pkg_type || "sem unidade"}</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-xs text-green-700 font-bold">{finalUnit}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{s.reason}</p>
                </div>
                {/* Manual override (stop propagation) */}
                <div className="shrink-0" onClick={e => e.stopPropagation()}>
                  <select
                    className="h-7 w-24 rounded-lg border border-border bg-card text-xs px-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    value={finalUnit}
                    onChange={e => setOverrides(prev => ({ ...prev, [s.productId]: e.target.value }))}
                  >
                    {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restart */}
      {suggestions.length > 0 && visibleSuggestions.length > 0 && (
        <div className="pt-6 text-center">
          <button
            className="text-xs text-muted-foreground underline"
            onClick={() => { setSuggestions([]); setUndoStack([]); setSelected(new Set()); }}
          >
            Reiniciar análise
          </button>
        </div>
      )}
    </div>
  );
}