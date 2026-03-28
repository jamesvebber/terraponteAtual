import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { Camera, X, Loader2, CheckCircle2 } from "lucide-react";
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

const UNITS = [
  { label: "saco 25kg", emoji: "👜" },
  { label: "saco 50kg", emoji: "👜" },
  { label: "litro", emoji: "🧴" },
  { label: "kg", emoji: "⚖️" },
  { label: "unidade", emoji: "📦" },
  { label: "caixa", emoji: "🗃️" },
  { label: "galão", emoji: "🪣" },
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
  price: "", unit: "", stock_status: "Disponível",
  pickup_available: true, delivery_available: false, featured: false,
};

export default function AddInsumoForm({ open, onClose, onSaved, supplierProfile, editProduct }) {
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [unitDrawerOpen, setUnitDrawerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      setForm({
        product_name: editProduct.product_name || "",
        category: editProduct.category || "",
        brand: editProduct.brand || "",
        description: editProduct.description || "",
        price: editProduct.price?.toString() || "",
        unit: editProduct.unit || "",
        stock_status: editProduct.stock_status || "Disponível",
        pickup_available: editProduct.pickup_available !== false,
        delivery_available: !!editProduct.delivery_available,
        featured: !!editProduct.featured,
      });
      setImagePreview(editProduct.image_url || null);
    } else {
      setForm({
        ...EMPTY,
        pickup_available: supplierProfile?.pickup_available !== false,
        delivery_available: !!supplierProfile?.delivery_available,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [open, editProduct]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.product_name.trim() || !form.category || !form.price || !form.unit) {
      toast.error("Preencha nome, categoria, preço e unidade.");
      return;
    }
    if (!supplierProfile) {
      toast.error("Cadastre o perfil da loja antes de adicionar produtos.");
      return;
    }
    setSaving(true);
    let image_url = editProduct?.image_url || null;
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }
    const data = {
      ...form,
      price: parseFloat(form.price),
      image_url,
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

        <div className="px-4 space-y-4 pb-2 overflow-y-auto max-h-[72vh]">
          {/* Image upload */}
          <FieldBlock label="Foto do produto" hint="Produtos com foto vendem mais.">
            <label className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-colors hover:bg-muted">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button"
                    onClick={e => { e.preventDefault(); setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Camera className="h-8 w-8" />
                  <span className="text-sm font-semibold">Toque para adicionar foto</span>
                  <span className="text-xs opacity-70">JPG ou PNG</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
              }} />
            </label>
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

          {/* Price & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <FieldBlock label="Preço (R$) *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                <Input className="h-12 rounded-xl pl-9 text-base" type="number" inputMode="decimal" placeholder="0,00" value={form.price} onChange={e => set("price", e.target.value)} />
              </div>
            </FieldBlock>
            <FieldBlock label="Unidade *">
              <button
                type="button"
                onClick={() => setUnitDrawerOpen(true)}
                className={`w-full h-12 rounded-xl border px-3 text-sm font-semibold text-left select-none transition-colors ${
                  form.unit ? "border-input bg-card text-foreground" : "border-input bg-card text-muted-foreground"
                }`}
              >
                {form.unit || "Selecionar unidade"}
              </button>
            </FieldBlock>
          </div>

          {/* Unit drawer */}
          <Drawer open={unitDrawerOpen} onOpenChange={setUnitDrawerOpen}>
            <DrawerContent>
              <DrawerHeader><DrawerTitle>Unidade de venda</DrawerTitle></DrawerHeader>
              <div className="px-4 pb-2 space-y-2">
                {UNITS.map(({ label, emoji }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { set("unit", label); setUnitDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors select-none ${
                      form.unit === label ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}
                  >
                    <span className="text-lg">{emoji}</span> {label}
                  </button>
                ))}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <button className="w-full h-11 rounded-xl bg-muted text-muted-foreground font-semibold text-sm select-none">Cancelar</button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

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