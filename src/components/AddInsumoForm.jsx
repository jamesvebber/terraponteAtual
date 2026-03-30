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

const CATEGORIES = [
  { label: "Ração", emoji: "🌾" },
  { label: "Sal mineral", emoji: "🧂" },
  { label: "Adubo", emoji: "🌱" },
  { label: "Sementes", emoji: "🌻" },
  { label: "Defensivos", emoji: "🧪" },
  { label: "Medicamentos veterinários", emoji: "💊" },
  { label: "Ferramentas", emoji: "🔧" },
  { label: "Equipamentos", emoji: "⚙️" },
  { label: "Outros", emoji: "📦" },
];

const SALE_TYPES = [
  { value: "por embalagem", label: "Por embalagem", emoji: "📦" },
  { value: "por kg", label: "Por kg", emoji: "⚖️" },
  { value: "por litro", label: "Por litro", emoji: "🧴" },
  { value: "por unidade", label: "Por unidade", emoji: "🔢" },
  { value: "por caixa", label: "Por caixa", emoji: "🗃️" },
];
const PKG_TYPES = ["saco", "pacote", "caixa", "galão", "frasco", "balde", "unidade"];
const PKG_UNITS = ["kg", "g", "litro", "ml", "unidade"];
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
  price: "", sale_type: "", pkg_type: "saco", pkg_qty: "", pkg_unit: "kg",
  stock_status: "Disponível",
  pickup_available: true, delivery_available: false, featured: false,
};

export default function AddInsumoForm({ open, onClose, onSaved, supplierProfile, editProduct }) {
  const [form, setForm] = useState(EMPTY);
  const [mediaItems, setMediaItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [unitDrawerOpen, setUnitDrawerOpen] = useState(false);
  const scrollRef = useRef(null);
  useScrollOnFocus(scrollRef);

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      setForm({
        product_name: editProduct.product_name || "",
        category: editProduct.category || "",
        brand: editProduct.brand || "",
        description: editProduct.description || "",
        price: editProduct.price?.toString() || "",
        sale_type: editProduct.sale_type || "",
        pkg_type: editProduct.pkg_type || "saco",
        pkg_qty: editProduct.pkg_qty?.toString() || "",
        pkg_unit: editProduct.pkg_unit || "kg",
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
  }, [open, editProduct]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.product_name.trim() || !form.category || !form.price || !form.sale_type) {
      toast.error("Preencha nome, categoria, preço e tipo de venda.");
      return;
    }
    if (form.sale_type === "por embalagem" && (!form.pkg_qty || !form.pkg_type || !form.pkg_unit)) {
      toast.error("Preencha os dados da embalagem.");
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
    const unitLabel = form.sale_type === "por embalagem" && form.pkg_type && form.pkg_qty && form.pkg_unit
      ? `${form.pkg_type} ${form.pkg_qty}${form.pkg_unit}`
      : form.sale_type.replace("por ", "");
    const data = {
      ...form,
      price: parseFloat(form.price),
      pkg_qty: form.pkg_qty ? parseFloat(form.pkg_qty) : null,
      unit: unitLabel,
      image_url,
      photos,
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
          <FieldBlock label="Nome do produto *" hint='Ex: Ração para gado de corte 50kg'>
            <Input className="h-12 rounded-xl text-base" placeholder="Nome do produto" value={form.product_name} onChange={e => set("product_name", e.target.value)} />
          </FieldBlock>

          {/* Category */}
          <FieldBlock label="Categoria *">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ label, emoji }) => (
                <button key={label} type="button" onClick={() => set("category", label)}
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

          {/* Sale type */}
          <FieldBlock label="Tipo de venda *">
            <div className="grid grid-cols-2 gap-2">
              {SALE_TYPES.map(({ value, label, emoji }) => (
                <button key={value} type="button" onClick={() => set("sale_type", value)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all select-none ${
                    form.sale_type === value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-foreground"
                  }`}>
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </FieldBlock>

          {/* Package fields — only when "por embalagem" */}
          {form.sale_type === "por embalagem" && (
            <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Dados da embalagem</p>
              {/* Package type */}
              <FieldBlock label="Tipo de embalagem">
                <div className="flex flex-wrap gap-2">
                  {PKG_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => set("pkg_type", t)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                        form.pkg_type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </FieldBlock>
              {/* Qty + unit */}
              <div className="grid grid-cols-2 gap-3">
                <FieldBlock label="Quantidade">
                  <Input className="h-11 rounded-xl text-base" type="number" inputMode="decimal" placeholder="Ex: 40" value={form.pkg_qty} onChange={e => set("pkg_qty", e.target.value)} />
                </FieldBlock>
                <FieldBlock label="Unidade">
                  <div className="flex flex-wrap gap-2">
                    {PKG_UNITS.map(u => (
                      <button key={u} type="button" onClick={() => set("pkg_unit", u)}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                          form.pkg_unit === u ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                        }`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </FieldBlock>
              </div>
              {/* Preview */}
              {form.price && form.pkg_qty && form.pkg_type && form.pkg_unit && (
                <div className="bg-card border border-border rounded-xl px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">Prévia</p>
                  <p className="text-sm font-bold text-foreground">
                    R$ {parseFloat(form.price).toFixed(2).replace(".", ",")} por {form.pkg_type} de {form.pkg_qty} {form.pkg_unit}
                  </p>
                  {(() => {
                    const qty = parseFloat(form.pkg_qty);
                    const price = parseFloat(form.price);
                    if (!qty || !price) return null;
                    let divisor = qty;
                    let unitLabel = form.pkg_unit;
                    if (form.pkg_unit === "g") { divisor = qty / 1000; unitLabel = "kg"; }
                    if (form.pkg_unit === "ml") { divisor = qty / 1000; unitLabel = "litro"; }
                    if (divisor <= 0 || unitLabel === "unidade") return null;
                    return <p className="text-xs text-muted-foreground">Equivale a R$ {(price / divisor).toFixed(2).replace(".", ",")}/{unitLabel}</p>;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Brand */}
          <FieldBlock label="Marca" hint='Ex: Guabi, Tortuga, Presence...'>
            <Input className="h-12 rounded-xl text-base" placeholder="Marca do produto (opcional)" value={form.brand} onChange={e => set("brand", e.target.value)} />
          </FieldBlock>

          {/* Description */}
          <FieldBlock label="Descrição" hint="Indicação, composição, quantidade embalada, etc.">
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
          <FieldBlock label="Disponibilidade" hint="Define como o comprador pode adquirir este produto.">
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