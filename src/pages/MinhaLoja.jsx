import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Store, Loader2, CheckCircle2, Camera, X, ChevronRight,
  PlusCircle, Package, Pencil, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import AddInsumoForm from "../components/AddInsumoForm";

const SUPPLIER_TYPES = ["Agropecuária", "Cooperativa", "Fornecedor de insumos", "Loja", "Revendedor"];

function Section({ title, children }) {
  return (
    <div className="mb-5">
      {title && <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">{children}</div>
    </div>
  );
}

export default function MinhaLoja() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("perfil"); // "perfil" | "produtos" | "entrega"
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [form, setForm] = useState({
    store_name: "", responsible_name: "", supplier_type: "Agropecuária",
    city: "", region: "", whatsapp: "", description: "",
    pickup_available: true, delivery_available: false,
    delivery_radius_km: "", price_per_km: "", fixed_delivery_fee: "",
    minimum_order_for_delivery: "", free_delivery_above: "", delivery_notes: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoadingProfile(true);
    const profiles = await base44.entities.SupplierProfile.filter({ owner_email: user.email });
    if (profiles[0]) {
      const p = profiles[0];
      setProfile(p);
      setForm({
        store_name: p.store_name || "",
        responsible_name: p.responsible_name || "",
        supplier_type: p.supplier_type || "Agropecuária",
        city: p.city || "",
        region: p.region || "",
        whatsapp: p.whatsapp || "",
        description: p.description || "",
        pickup_available: p.pickup_available !== false,
        delivery_available: !!p.delivery_available,
        delivery_radius_km: p.delivery_radius_km || "",
        price_per_km: p.price_per_km || "",
        fixed_delivery_fee: p.fixed_delivery_fee || "",
        minimum_order_for_delivery: p.minimum_order_for_delivery || "",
        free_delivery_above: p.free_delivery_above || "",
        delivery_notes: p.delivery_notes || "",
      });
      if (p.logo_url) setLogoPreview(p.logo_url);
      // Load products
      const prods = await base44.entities.InsumoProduct.filter({ supplier_id: p.id }, "-created_date");
      setProducts(prods);
    }
    setLoadingProfile(false);
  };

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSaveProfile = async () => {
    if (!form.store_name || !form.city || !form.whatsapp) {
      toast.error("Preencha nome da loja, cidade e WhatsApp.");
      return;
    }
    setSaving(true);
    let logo_url = profile?.logo_url || null;
    if (logoFile) {
      const res = await base44.integrations.Core.UploadFile({ file: logoFile });
      logo_url = res.file_url;
    }
    const data = {
      ...form,
      delivery_radius_km: form.delivery_radius_km ? parseFloat(form.delivery_radius_km) : null,
      price_per_km: form.price_per_km ? parseFloat(form.price_per_km) : null,
      fixed_delivery_fee: form.fixed_delivery_fee ? parseFloat(form.fixed_delivery_fee) : null,
      minimum_order_for_delivery: form.minimum_order_for_delivery ? parseFloat(form.minimum_order_for_delivery) : null,
      free_delivery_above: form.free_delivery_above ? parseFloat(form.free_delivery_above) : null,
      logo_url,
      owner_email: user.email,
    };
    if (profile) {
      await base44.entities.SupplierProfile.update(profile.id, data);
    } else {
      const created = await base44.entities.SupplierProfile.create(data);
      setProfile(created);
    }
    setSaving(false);
    toast.success("Perfil salvo com sucesso!");
    loadData();
  };

  const handleToggleProduct = async (product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    await base44.entities.InsumoProduct.update(product.id, { status: newStatus });
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
  };

  const handleDeleteProduct = async (id) => {
    await base44.entities.InsumoProduct.delete(id);
    setProducts(ps => ps.filter(p => p.id !== id));
    toast.success("Produto removido.");
  };

  const handleProductSaved = () => {
    setAddProductOpen(false);
    setEditProduct(null);
    loadData();
  };

  if (isLoadingAuth || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <Store className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-2">Área do Fornecedor</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Entre na sua conta para cadastrar sua loja e gerenciar seus produtos.
        </p>
        <Button className="w-full max-w-xs h-12 rounded-xl font-bold" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
          Entrar / Criar conta
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/insumos")} className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Minha Loja</h1>
          <p className="text-xs text-muted-foreground font-medium">Gerencie sua loja e seus produtos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-5 gap-1">
        {[
          { id: "perfil", label: "Perfil" },
          { id: "produtos", label: `Produtos${products.length ? ` (${products.length})` : ""}` },
          { id: "entrega", label: "Entrega" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors select-none ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === TAB: PERFIL === */}
      {tab === "perfil" && (
        <div className="space-y-4">
          {/* Logo upload */}
          <div>
            <Label className="text-sm font-bold text-foreground block mb-2">Logo / Foto da loja</Label>
            <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-border bg-muted/40 cursor-pointer overflow-hidden relative">
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  <button type="button" onClick={e => { e.preventDefault(); setLogoFile(null); setLogoPreview(null); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Adicionar logo</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
              }} />
            </label>
          </div>

          {/* Store name */}
          <div>
            <Label className="text-sm font-bold text-foreground block mb-1.5">Nome da loja *</Label>
            <Input className="h-11 rounded-xl" placeholder='Ex: Agropecuária São João' value={form.store_name} onChange={e => set("store_name", e.target.value)} />
          </div>

          <div>
            <Label className="text-sm font-bold text-foreground block mb-1.5">Responsável</Label>
            <Input className="h-11 rounded-xl" placeholder='Nome do responsável' value={form.responsible_name} onChange={e => set("responsible_name", e.target.value)} />
          </div>

          {/* Supplier type */}
          <div>
            <Label className="text-sm font-bold text-foreground block mb-2">Tipo de fornecedor *</Label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPLIER_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set("supplier_type", t)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors select-none text-left ${form.supplier_type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-sm font-bold text-foreground block mb-1.5">Cidade *</Label>
              <Input className="h-11 rounded-xl" placeholder='Sua cidade' value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-bold text-foreground block mb-1.5">UF</Label>
              <Input className="h-11 rounded-xl" placeholder='GO' maxLength={2} value={form.region} onChange={e => set("region", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-foreground block mb-1.5">WhatsApp *</Label>
            <Input className="h-11 rounded-xl" type="tel" placeholder='(62) 99999-9999' value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} />
          </div>

          <div>
            <Label className="text-sm font-bold text-foreground block mb-1.5">Descrição da loja</Label>
            <Textarea className="rounded-xl min-h-[80px]" placeholder='Fale um pouco sobre sua loja, produtos e diferenciais...' value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <Button className="w-full h-12 rounded-xl font-bold gap-2" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      )}

      {/* === TAB: PRODUTOS === */}
      {tab === "produtos" && (
        <div>
          {!profile ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground mb-3">Cadastre o perfil da sua loja primeiro.</p>
              <Button variant="outline" className="rounded-xl" onClick={() => setTab("perfil")}>Ir para Perfil</Button>
            </div>
          ) : (
            <>
              <Button className="w-full h-12 rounded-xl font-bold gap-2 mb-4" onClick={() => { setEditProduct(null); setAddProductOpen(true); }}>
                <PlusCircle className="h-4 w-4" /> Adicionar produto
              </Button>

              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum produto cadastrado ainda.</p>
                  <p className="text-xs mt-1">Toque em "Adicionar produto" para começar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map(prod => (
                    <div key={prod.id} className={`bg-card border rounded-2xl p-4 ${prod.status === "inactive" ? "opacity-50 border-border" : "border-border"}`}>
                      <div className="flex gap-3">
                        <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {prod.image_url ? <img src={prod.image_url} alt={prod.product_name} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-foreground text-sm leading-tight">{prod.product_name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${prod.stock_status === "Disponível" ? "bg-green-100 text-green-700" : prod.stock_status === "Esgotado" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                              {prod.stock_status || "Disponível"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{prod.category} · {prod.unit}</p>
                          <p className="text-green-600 font-extrabold text-base mt-1">R$ {prod.price?.toFixed(2).replace(".", ",")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs gap-1.5" onClick={() => { setEditProduct(prod); setAddProductOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => handleToggleProduct(prod)}>
                          {prod.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {prod.status === "active" ? "Pausar" : "Ativar"}
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDeleteProduct(prod.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === TAB: ENTREGA === */}
      {tab === "entrega" && (
        <div className="space-y-4">
          {/* Pickup toggle */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-bold text-foreground text-sm">Retirada na loja</p>
                <p className="text-xs text-muted-foreground">Clientes podem retirar pessoalmente</p>
              </div>
              <button onClick={() => set("pickup_available", !form.pickup_available)} className="select-none">
                {form.pickup_available
                  ? <ToggleRight className="h-8 w-8 text-primary" />
                  : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* Delivery toggle */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-foreground text-sm">Realiza entregas</p>
                <p className="text-xs text-muted-foreground">Defina as condições de entrega</p>
              </div>
              <button onClick={() => set("delivery_available", !form.delivery_available)} className="select-none">
                {form.delivery_available
                  ? <ToggleRight className="h-8 w-8 text-primary" />
                  : <ToggleLeft className="h-8 w-8 text-muted-foreground" />}
              </button>
            </div>

            {form.delivery_available && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground block mb-1">Raio máximo de entrega (km)</Label>
                  <Input className="h-10 rounded-xl text-sm" type="number" placeholder='Ex: 80' value={form.delivery_radius_km} onChange={e => set("delivery_radius_km", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground block mb-1">Taxa fixa de entrega (R$)</Label>
                  <Input className="h-10 rounded-xl text-sm" type="number" placeholder='Ex: 30' value={form.fixed_delivery_fee} onChange={e => set("fixed_delivery_fee", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground block mb-1">Preço por km (R$)</Label>
                  <Input className="h-10 rounded-xl text-sm" type="number" placeholder='Ex: 1.50' value={form.price_per_km} onChange={e => set("price_per_km", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground block mb-1">Pedido mínimo para entrega (R$)</Label>
                  <Input className="h-10 rounded-xl text-sm" type="number" placeholder='Ex: 200' value={form.minimum_order_for_delivery} onChange={e => set("minimum_order_for_delivery", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground block mb-1">Frete grátis acima de (R$)</Label>
                  <Input className="h-10 rounded-xl text-sm" type="number" placeholder='Ex: 1000' value={form.free_delivery_above} onChange={e => set("free_delivery_above", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground block mb-1">Observações de entrega</Label>
                  <Textarea className="rounded-xl text-sm min-h-[70px]" placeholder='Ex: Entregamos às terças e quintas, a combinar' value={form.delivery_notes} onChange={e => set("delivery_notes", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <Button className="w-full h-12 rounded-xl font-bold gap-2" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      )}

      {/* Add/Edit product drawer */}
      <AddInsumoForm
        open={addProductOpen}
        onClose={() => { setAddProductOpen(false); setEditProduct(null); }}
        onSaved={handleProductSaved}
        supplierProfile={profile}
        editProduct={editProduct}
      />
    </div>
  );
}