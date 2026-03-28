import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Camera, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Ração", "Sal mineral", "Adubo", "Sementes", "Defensivos", "Medicamentos veterinários", "Ferramentas", "Equipamentos", "Outros"];
const UNITS = ["saco 25kg", "saco 50kg", "litro", "kg", "unidade", "caixa", "galão"];
const STOCK_OPTIONS = ["Disponível", "Sob encomenda", "Esgotado"];

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

  useEffect(() => {
    if (editProduct) {
      setForm({
        product_name: editProduct.product_name || "",
        category: editProduct.category || "",
        brand: editProduct.brand || "",
        description: editProduct.description || "",
        price: editProduct.price || "",
        unit: editProduct.unit || "",
        stock_status: editProduct.stock_status || "Disponível",
        pickup_available: editProduct.pickup_available !== false,
        delivery_available: !!editProduct.delivery_available,
        featured: !!editProduct.featured,
      });
      setImagePreview(editProduct.image_url || null);
      setImageFile(null);
    } else {
      setForm({ ...EMPTY, pickup_available: supplierProfile?.pickup_available !== false, delivery_available: !!supplierProfile?.delivery_available });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editProduct, open]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSave = async () => {
    if (!form.product_name || !form.category || !form.price || !form.unit) {
      toast.error("Preencha nome, categoria, preço e unidade.");
      return;
    }
    if (!supplierProfile) {
      toast.error("Cadastre o perfil da sua loja primeiro.");
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
      delivery_radius_km: supplierProfile.delivery_radius_km,
      price_per_km: supplierProfile.price_per_km,
      fixed_delivery_fee: supplierProfile.fixed_delivery_fee,
      minimum_order_for_delivery: supplierProfile.minimum_order_for_delivery,
      free_delivery_above: supplierProfile.free_delivery_above,
      delivery_notes: supplierProfile.delivery_notes,
      status: "active",
    };
    if (editProduct) {
      await base44.entities.InsumoProduct.update(editProduct.id, data);
    } else {
      await base44.entities.InsumoProduct.create(data);
    }
    setSaving(false);
    toast.success(editProduct ? "Produto atualizado!" : "Produto cadastrado com sucesso!");
    onSaved();
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{editProduct ? "Editar produto" : "Adicionar produto"}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-3 pb-2 overflow-y-auto max-h-[70vh]">
          {/* Image */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Foto do produto</Label>
            <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-border bg-muted/40 cursor-pointer overflow-hidden relative">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={e => { e.preventDefault(); setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-semibold">Adicionar foto</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
              }} />
            </label>
          </div>

          {/* Product name */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Nome do produto *</Label>
            <Input className="h-11 rounded-xl" placeholder='Ex: Ração para gado de corte' value={form.product_name} onChange={e => set("product_name", e.target.value)} />
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Categoria *</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => set("category", c)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors select-none text-left ${form.category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Preço (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                <Input className="h-11 rounded-xl pl-8 text-sm" type="number" inputMode="decimal" placeholder="0,00" value={form.price} onChange={e => set("price", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Unidade *</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.unit} onChange={e => set("unit", e.target.value)}
              >
                <option value="">Selecionar</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Marca</Label>
            <Input className="h-11 rounded-xl" placeholder='Ex: Guabi, Tortuga...' value={form.brand} onChange={e => set("brand", e.target.value)} />
          </div>

          <div>
            <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Descrição</Label>
            <Textarea className="rounded-xl text-sm min-h-[70px]" placeholder='Detalhe o produto, composição, indicação...' value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Stock status */}
          <div>
            <Label className="text-xs font-bold text-muted-foreground block mb-1.5">Estoque</Label>
            <div className="flex gap-2">
              {STOCK_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => set("stock_status", s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors select-none ${form.stock_status === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Availability toggles */}
          <div className="flex gap-2">
            <button type="button" onClick={() => set("pickup_available", !form.pickup_available)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors select-none ${form.pickup_available ? "bg-green-100 border-green-400 text-green-700" : "bg-card border-border text-muted-foreground"}`}>
              🏪 Retirada {form.pickup_available ? "✓" : "✗"}
            </button>
            <button type="button" onClick={() => set("delivery_available", !form.delivery_available)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors select-none ${form.delivery_available ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-card border-border text-muted-foreground"}`}>
              🚚 Entrega {form.delivery_available ? "✓" : "✗"}
            </button>
            <button type="button" onClick={() => set("featured", !form.featured)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors select-none ${form.featured ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-card border-border text-muted-foreground"}`}>
              ⭐ Destaque {form.featured ? "✓" : "✗"}
            </button>
          </div>
        </div>

        <DrawerFooter>
          <Button className="w-full rounded-xl gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvando..." : editProduct ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}