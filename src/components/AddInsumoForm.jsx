import { useState, useEffect, useRef } from "react";
import { useScrollOnFocus } from "../hooks/useScrollOnFocus";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { Loader2, CheckCircle2 } from "lucide-react";
import MediaUploader from "./MediaUploader";
import { toast } from "sonner";
import {
  ALL_UNITS, UNIT_SUGGESTIONS, UNIT_CONTENT_MEASURES,
  buildUnitLabel, deriveSaleType, hasContentDetail, getUnitExample,
} from "../utils/insumoUnits";

const CATEGORIES = [
  { label: "Ração", emoji: "🌾" },
  { label: "Sal mineral", emoji: "🧂" },
  { label: "Adubo", emoji: "🌱" },
  { label: "Sementes", emoji: "🌻" },
  { label: "Herbicidas", emoji: "🧪" },
  { label: "Inseticidas", emoji: "🐛" },
  { label: "Medicamentos veterinários", emoji: "💊" },
  { label: "Suplementos", emoji: "⚗️" },
  { label: "Ferramentas", emoji: "🔧" },
  { label: "Selaria", emoji: "🐴" },
  { label: "Pet shop", emoji: "🐾" },
  { label: "Equipamentos", emoji: "⚙️" },
  { label: "Peças", emoji: "🔩" },
  { label: "Vestuário rural", emoji: "👕" },
  { label: "Calçados", emoji: "👢" },
  { label: "Outros", emoji: "📦" },
];

const STOCK = ["Disponível", "Sob encomenda", "Esgotado"];

function FieldBlock({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const EMPTY = {
  product_name: "", category: "", brand: "", description: "",
  price: "",
  pkg_type: "", pkg_qty: "", pkg_unit: "",
  stock_status: "Disponível",
  pickup_available: true, delivery_available: false, featured: false,
};

export default function AddInsumoForm({ open, onClose, onSaved, supplierProfile, editProduct }) {
  const [form, setForm] = useState(EMPTY);
  const [mediaItems, setMediaItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const scrollRef = useRef(null);
  useScrollOnFocus(scrollRef);

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      // Reconstruct pkg_type from legacy sale_type if needed
      let pkg_type = editProduct.pkg_type || "";
      if (!pkg_type && editProduct.sale_type) {
        if (editProduct.sale_type === "por kg") pkg_type = "kg";
        else if (editProduct.sale_type === "por litro") pkg_type = "litro";
        else if (editProduct.sale_type === "por unidade") pkg_type = "unidade";
        else if (editProduct.sale_type === "por caixa") pkg_type = "caixa";
      }
      setForm({
        product_name: editProduct.product_name || "",
        category: editProduct.category || "",
        brand: editProduct.brand || "",
        description: editProduct.description || "",
        price: editProduct.price?.toString() || "",
        pkg_type,
        pkg_qty: editProduct.pkg_qty?.toString() || "",
        pkg_unit: editProduct.pkg_unit || "",
        stock_status: editProduct.stock_status || "Disponível",
        pickup_available: editProduct.pickup_available !== false,
        delivery_available: !!editProduct.delivery_available,
        featured: !!editProduct.featured,
      });
      const existingMedia = [
        ...(editProduct.image_url ? [{ url: editProduct.image_url }] : []),
        ...((editProduct.photos || []).map(u => ({ url: u }))),
      ];
      setMediaItems(existingMedia);
    } else {
      setForm({
        ...EMPTY,
        pickup_available: supplierProfile?.pickup_available !== false,
        delivery_available: !!supplierProfile?.delivery_available,
      });
      setMediaItems([]);
    }
    setShowAllUnits(false);
  }, [open, editProduct]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  // When category changes, only clear unit if it's not compatible with new category
  // Never auto-select a unit — user must choose explicitly
  const handleCategoryChange = (cat) => {
    setForm(p => ({
      ...p,
      category: cat,
      // Keep existing unit if user already chose one; otherwise clear
      // This prevents overwriting a "frasco" with "saco" when re-editing
    }));
    setShowAllUnits(false);
  };

  const handleUnitChange = (unit) => {
    set("pkg_type", unit);
    set("pkg_qty", "");
    set("pkg_unit", "");
  };

  const handleSave = async () => {
    if (!form.product_name.trim() || !form.category || !form.price || !form.pkg_type) {
      toast.error("Preencha nome, categoria, preço e unidade de venda.");
      return;
    }
    setSaving(true);
    const uploadedUrls = [];
    for (const item of mediaItems) {
      if (item.file) {
        const res = await base44.integrations.Core.UploadFile({ file: item.file });
        uploadedUrls.push(res.file_url);
      } else if (item.url) {
        uploadedUrls.push(item.url);
      }
    }
    const image_url = uploadedUrls[0] || null;
    const photos = uploadedUrls.slice(1);

    const unit = buildUnitLabel(form.pkg_type, form.pkg_qty, form.pkg_unit);
    const sale_type = deriveSaleType(form.pkg_type);

    const data = {
      product_name: form.product_name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      sale_type,
      pkg_type: form.pkg_type,
      pkg_qty: form.pkg_qty ? parseFloat(form.pkg_qty) : null,
      pkg_unit: form.pkg_unit || null,
      unit,
      image_url,
      photos,
      stock_status: form.stock_status,
      pickup_available: form.pickup_available,
      delivery_available: form.delivery_available,
      featured: form.featured,
      supplier_id: supplierProfile.id,
      supplier_name: supplierProfile.store_name,
      supplier_type: supplierProfile.supplier_type,
      city: supplierProfile.city,
      region: supplierProfile.region,
      whatsapp: supplierProfile.whatsapp,
      delivery_radius_km: supplierProfile.delivery_radius_km || null,
      price_per_km: supplierProfile.price_per_km || null,
      fixed_delivery_fee: supplierProfile.fixed_delivery_fee || null,
      minimum_order_for_delivery: supplierProfile.minimum_order_for_delivery || null,
      free_delivery_above: supplierProfile.free_delivery_above || null,
      delivery_notes: supplierProfile.delivery_notes || null,
      status: "active",
    };
    if (editProduct) {
      await base44.entities.InsumoProduct.update(editProduct.id, data);
    } else {
      await base44.entities.InsumoProduct.create(data);
    }
    setSaving(false);
    toast.success(editProduct ? "Produto atualizado!" : "Produto adicionado!");
    onSaved();
  };

  const suggestedUnits = UNIT_SUGGESTIONS[form.category] || UNIT_SUGGESTIONS["Outros"];
  const otherUnits = ALL_UNITS.filter(u => !suggestedUnits.includes(u));
  const contentMeasures = UNIT_CONTENT_MEASURES[form.pkg_type] || [];
  const unitExample = getUnitExample(form.pkg_type, form.pkg_unit);

  // Build live preview label
  const previewLabel = form.pkg_type
    ? buildUnitLabel(form.pkg_type, form.pkg_qty, form.pkg_unit)
    : "";

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-base">
            {editProduct ? "✏️ Editar produto" : "📦 Adicionar produto"}
          </DrawerTitle>
        </DrawerHeader>

        <div ref={scrollRef} className="px-4 space-y-4 pb-4 overflow-y-auto" style={{ maxHeight: '68dvh', overscrollBehavior: 'contain' }}>
          {/* Media upload */}
          <FieldBlock label="Fotos e vídeos" hint="Adicione fotos e vídeo. A primeira foto será a capa.">
            <MediaUploader items={mediaItems} onChange={setMediaItems} />
          </FieldBlock>

          {/* Name */}
          <FieldBlock label="Nome do produto *">
            <Input className="h-12 rounded-xl text-base" placeholder="Ex: Ração para gado de corte" value={form.product_name} onChange={e => set("product_name", e.target.value)} />
          </FieldBlock>

          {/* Category */}
          <FieldBlock label="Categoria *">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ label, emoji }) => (
                <button key={label} type="button" onClick={() => handleCategoryChange(label)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all select-none ${
                    form.category === label ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-foreground"
                  }`}>
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </FieldBlock>

          {/* Price */}
          <FieldBlock label="Preço (R$) *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
              <Input className="h-12 rounded-xl pl-9 text-base" type="number" inputMode="decimal" placeholder="0,00" value={form.price} onChange={e => set("price", e.target.value)} />
            </div>
          </FieldBlock>

          {/* Unit selection */}
          <FieldBlock label="Unidade de venda *" hint={form.category ? `Sugestões para ${form.category}` : "Selecione a categoria primeiro para sugestões"}>
            <div className="flex flex-wrap gap-2">
              {suggestedUnits.map(u => (
                <button key={u} type="button" onClick={() => handleUnitChange(u)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                    form.pkg_type === u ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                  }`}>
                  {u}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllUnits(v => !v)}
                className="px-3 py-2 rounded-xl text-sm font-semibold border border-dashed border-border text-muted-foreground select-none"
              >
                {showAllUnits ? "▲ menos" : "▼ outras"}
              </button>
            </div>
            {showAllUnits && (
              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
                {otherUnits.map(u => (
                  <button key={u} type="button" onClick={() => { handleUnitChange(u); setShowAllUnits(false); }}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                      form.pkg_type === u ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                    }`}>
                    {u}
                  </button>
                ))}
              </div>
            )}
          </FieldBlock>

          {/* Content detail — qty + measure when relevant */}
          {form.pkg_type && hasContentDetail(form.pkg_type) && (
            <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Conteúdo da {form.pkg_type} <span className="font-normal normal-case text-muted-foreground/70">(opcional)</span>
              </p>
              {unitExample && <p className="text-xs text-muted-foreground">{unitExample}</p>}
              <div className="grid grid-cols-2 gap-3">
                <FieldBlock label="Quantidade">
                  <Input
                    className="h-11 rounded-xl text-base" type="number" inputMode="decimal"
                    placeholder="Ex: 25"
                    value={form.pkg_qty}
                    onChange={e => set("pkg_qty", e.target.value)}
                  />
                </FieldBlock>
                <FieldBlock label="Medida">
                  <div className="flex flex-wrap gap-1.5">
                    {contentMeasures.map(m => (
                      <button key={m} type="button" onClick={() => set("pkg_unit", m)}
                        className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all select-none ${
                          form.pkg_unit === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </FieldBlock>
              </div>
            </div>
          )}

          {/* Price preview */}
          {form.price && form.pkg_type && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <p className="text-xs text-green-700 font-bold">Prévia do preço:</p>
              <p className="text-sm font-extrabold text-green-800">
                R$ {parseFloat(form.price).toFixed(2).replace(".", ",")} / {previewLabel}
              </p>
            </div>
          )}

          {/* Brand */}
          <FieldBlock label="Marca" hint='Ex: Guabi, Tortuga, Pfizer...'>
            <Input className="h-12 rounded-xl text-base" placeholder="Marca do produto (opcional)" value={form.brand} onChange={e => set("brand", e.target.value)} />
          </FieldBlock>

          {/* Description */}
          <FieldBlock label="Descrição" hint="Indicação, composição, modo de uso, etc.">
            <Textarea className="rounded-xl text-base min-h-[75px]" placeholder="Descreva o produto..." value={form.description} onChange={e => set("description", e.target.value)} />
          </FieldBlock>

          {/* Stock status */}
          <FieldBlock label="Situação do estoque">
            <div className="flex gap-2">
              {STOCK.map(s => (
                <button key={s} type="button" onClick={() => set("stock_status", s)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all select-none ${
                    form.stock_status === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-foreground"
                  }`}>
                  {s === "Disponível" ? "🟢" : s === "Sob encomenda" ? "🟡" : "🔴"} {s}
                </button>
              ))}
            </div>
          </FieldBlock>

          {/* Availability toggles */}
          <FieldBlock label="Disponibilidade">
            <div className="grid grid-cols-3 gap-2">
              {[
                { field: "pickup_available", label: "🏪 Retirada" },
                { field: "delivery_available", label: "🚚 Entrega" },
                { field: "featured", label: "⭐ Destaque" },
              ].map(({ field, label }) => (
                <button key={field} type="button" onClick={() => set(field, !form[field])}
                  className={`py-3 rounded-xl text-xs font-bold border transition-all select-none ${
                    form[field] ? "bg-primary/10 border-primary text-primary" : "bg-muted/50 border-border text-muted-foreground"
                  }`}>
                  {label}<br />
                  <span className="font-extrabold">{form[field] ? "Sim" : "Não"}</span>
                </button>
              ))}
            </div>
          </FieldBlock>
        </div>

        <DrawerFooter>
          <Button className="w-full h-12 rounded-xl font-bold gap-2 text-base" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            {saving ? "Salvando..." : editProduct ? "Salvar alterações" : "Adicionar produto"}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}