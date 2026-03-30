import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Loader2, Camera, X, Search } from "lucide-react";

const CATEGORIES = [
  "Ração", "Sal mineral", "Adubo", "Sementes", "Herbicidas", "Inseticidas",
  "Medicamentos veterinários", "Suplementos", "Ferramentas", "Selaria",
  "Pet shop", "Equipamentos", "Peças", "Outros",
];

const SALE_TYPES = ["por embalagem", "por kg", "por litro", "por unidade", "por caixa"];

const EMPTY = {
  product_name: "", category: "", price: "", description: "",
  sale_type: "por unidade", pkg_qty: "", pkg_unit: "",
  image_url: "", stock_status: "Disponível",
};

export default function AdminAddProduct({ open, onClose, stores, onSaved }) {
  const [storeSearch, setStoreSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("store"); // "store" | "product"

  useEffect(() => {
    if (!open) {
      setStoreSearch("");
      setSelectedStore(null);
      setForm(EMPTY);
      setImageFile(null);
      setImagePreview(null);
      setStep("store");
    }
  }, [open]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const filteredStores = stores.filter(s =>
    !storeSearch || s.store_name?.toLowerCase().includes(storeSearch.toLowerCase()) || s.city?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedStore || !form.product_name || !form.category || !form.price || !form.sale_type) return;
    setSaving(true);

    let image_url = form.image_url;
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }

    const unitLabel = form.pkg_qty && form.pkg_unit
      ? `${form.sale_type} de ${form.pkg_qty} ${form.pkg_unit}`
      : form.sale_type;

    const product = await base44.entities.InsumoProduct.create({
      product_name: form.product_name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      description: form.description.trim(),
      sale_type: form.sale_type,
      pkg_qty: form.pkg_qty ? parseFloat(form.pkg_qty) : null,
      pkg_unit: form.pkg_unit || null,
      unit: unitLabel,
      image_url,
      stock_status: form.stock_status || "Disponível",
      status: "active",
      pickup_available: selectedStore.pickup_available !== false,
      delivery_available: !!selectedStore.delivery_available,
      delivery_radius_km: selectedStore.delivery_radius_km || null,
      price_per_km: selectedStore.price_per_km || null,
      fixed_delivery_fee: selectedStore.fixed_delivery_fee || null,
      minimum_order_for_delivery: selectedStore.minimum_order_for_delivery || null,
      free_delivery_above: selectedStore.free_delivery_above || null,
      delivery_notes: selectedStore.delivery_notes || null,
      supplier_id: selectedStore.id,
      supplier_name: selectedStore.store_name,
      supplier_type: selectedStore.supplier_type,
      city: selectedStore.city,
      region: selectedStore.region,
      whatsapp: selectedStore.whatsapp,
    });

    setSaving(false);
    onSaved(product);
  };

  const canSave = selectedStore && form.product_name && form.category && form.price && form.sale_type;

  return (
    <Drawer open={open} onOpenChange={v => !v && onClose()}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>
            {step === "store" ? "Selecionar loja" : `Produto para ${selectedStore?.store_name}`}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 space-y-4 pb-4">

          {/* STEP 1: Select store */}
          {step === "store" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full h-11 pl-9 pr-3 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Buscar loja..."
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                {filteredStores.map(store => (
                  <button key={store.id} onClick={() => { setSelectedStore(store); setStep("product"); }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors select-none">
                    <p className="font-bold text-sm text-foreground">{store.store_name}</p>
                    <p className="text-xs text-muted-foreground">{store.supplier_type} · {[store.city, store.region].filter(Boolean).join(", ")}</p>
                  </button>
                ))}
                {filteredStores.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhuma loja encontrada</p>
                )}
              </div>
            </>
          )}

          {/* STEP 2: Product form */}
          {step === "product" && (
            <>
              <button onClick={() => setStep("store")} className="text-xs text-primary font-bold select-none">
                ← Trocar loja
              </button>

              {/* Image */}
              <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-border bg-muted/40 cursor-pointer overflow-hidden relative">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={e => { e.preventDefault(); setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Camera className="h-7 w-7 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Adicionar foto</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                }} />
              </label>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Nome do produto *</label>
                <Input className="h-11 rounded-xl" placeholder="Ex: Ração Fazenda Top 40kg" value={form.product_name} onChange={e => set("product_name", e.target.value)} />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Categoria *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => set("category", cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors select-none text-left ${
                        form.category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Preço (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                  <Input className="h-11 rounded-xl pl-10" type="number" inputMode="decimal" placeholder="0,00" value={form.price} onChange={e => set("price", e.target.value)} />
                </div>
              </div>

              {/* Sale type */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Tipo de venda *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SALE_TYPES.map(st => (
                    <button key={st} type="button" onClick={() => set("sale_type", st)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors select-none ${
                        form.sale_type === st ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                      }`}>{st}</button>
                  ))}
                </div>
              </div>

              {/* Pkg details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Quantidade</label>
                  <Input className="h-11 rounded-xl" type="number" inputMode="decimal" placeholder="Ex: 40" value={form.pkg_qty} onChange={e => set("pkg_qty", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Unidade</label>
                  <Input className="h-11 rounded-xl" placeholder="Ex: kg, L" value={form.pkg_unit} onChange={e => set("pkg_unit", e.target.value)} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Descrição</label>
                <Textarea className="rounded-xl text-sm min-h-[72px]" placeholder="Descrição do produto..." value={form.description} onChange={e => set("description", e.target.value)} />
              </div>

              {/* Stock status */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Disponibilidade</label>
                <div className="flex gap-2">
                  {["Disponível", "Sob encomenda", "Esgotado"].map(s => (
                    <button key={s} type="button" onClick={() => set("stock_status", s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors select-none ${
                        form.stock_status === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter>
          {step === "product" && (
            <Button className="w-full rounded-xl h-12 font-bold" disabled={!canSave || saving} onClick={handleSave}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar produto"}
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}