import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { slugify } from "../utils/slugify";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Store, Loader2, CheckCircle2,
  PlusCircle, Package, Pencil, Trash2, Eye, EyeOff,
  Truck, MapPin, Phone, BadgeCheck, Share2, User, Building2,
} from "lucide-react";
import MediaUploader from "../components/MediaUploader";
import { toast } from "sonner";
import AddInsumoForm from "../components/AddInsumoForm";
import { AnnouncementsManager } from "../components/StoreAnnouncements";
import StoreVerificationBlock from "../components/StoreVerificationBlock";
import {
  validateCPF, validateCNPJ, validatePhone, validateFullName,
  formatCPF, formatCNPJ,
} from "../utils/validators";

const SUPPLIER_TYPES = ["Agropecuária", "Cooperativa", "Fornecedor de insumos", "Loja", "Revendedor"];

// ─── Small helpers ────────────────────────────────────────────────
function FieldBlock({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      {title && <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{title}</p>}
      {children}
    </div>
  );
}

function DeliveryToggle({ label, sub, enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all select-none ${
        enabled ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-left">
        <p className={`font-bold text-sm ${enabled ? "text-primary" : "text-foreground"}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}>
        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
      </div>
    </button>
  );
}

// ─── Validated input ───────────────────────────────────────────────
function ValidatedInput({ value, onChange, isValid, isInvalid, errorMsg, ...props }) {
  return (
    <div>
      <Input
        {...props}
        value={value}
        onChange={onChange}
        className={`h-12 rounded-xl text-base ${
          isInvalid ? "border-red-400 focus-visible:ring-red-300" :
          isValid ? "border-green-400 focus-visible:ring-green-300" : ""
        } ${props.className || ""}`}
      />
      {isInvalid && errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
    </div>
  );
}

// ─── Guest screen ──────────────────────────────────────────────────
function GuestScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
        <Store className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-extrabold text-foreground mb-2">Área do Fornecedor</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Entre na sua conta para cadastrar sua loja, adicionar produtos e definir condições de entrega.
      </p>
      <Button className="w-full max-w-xs h-12 rounded-xl font-bold" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
        Entrar / Criar conta
      </Button>
    </div>
  );
}

// ─── Onboarding banner when no profile yet ─────────────────────────
function OnboardingBanner({ onStart }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-2">
      <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
        <Store className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-xl font-extrabold text-foreground mb-2">Cadastre sua loja</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        Venda insumos direto para produtores rurais da sua região. Cadastre sua agropecuária, cooperativa ou loja e comece a receber pedidos hoje.
      </p>
      <div className="w-full max-w-sm space-y-3 mb-8">
        {[
          { icon: Store, text: "Perfil da loja com logo e descrição" },
          { icon: Package, text: "Produtos com foto, preço e estoque" },
          { icon: Truck, text: "Regras de entrega e retirada" },
          { icon: Phone, text: "Contato direto por WhatsApp" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-left bg-muted/60 rounded-xl px-4 py-2.5">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{text}</span>
          </div>
        ))}
      </div>
      <Button className="w-full max-w-sm h-13 rounded-xl font-bold text-base gap-2" onClick={onStart}>
        <PlusCircle className="h-5 w-5" /> Cadastrar minha loja
      </Button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────
const EMPTY_FORM = {
  registration_type: "",
  store_name: "", responsible_name: "", supplier_type: "",
  cargo: "", city: "", region: "",
  whatsapp: "", cnpj: "", cpf: "", linked_cnpj: "",
  instagram: "", description: "",
  pickup_available: true, delivery_available: false,
  delivery_radius_km: "", price_per_km: "", fixed_delivery_fee: "",
  minimum_order_for_delivery: "", free_delivery_above: "", delivery_notes: "",
};

export default function MinhaLoja() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("perfil");
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    const profiles = await base44.entities.SupplierProfile.filter({ owner_email: user.email });
    if (profiles[0]) {
      const p = profiles[0];
      setProfile(p);
      populateForm(p);
      const existing = [
        ...(p.logo_url ? [{ url: p.logo_url }] : []),
        ...((p.store_media || []).map(u => ({ url: u }))),
      ];
      setMediaItems(existing);
      const prods = await base44.entities.InsumoProduct.filter({ supplier_id: p.id }, "-created_date");
      setProducts(prods);
      setShowForm(true);
    }
    setLoading(false);
  };

  const populateForm = (p) => {
    setForm({
      registration_type: p.registration_type || "empresa",
      store_name: p.store_name || "",
      responsible_name: p.responsible_name || "",
      supplier_type: p.supplier_type || "",
      cargo: p.cargo || "",
      city: p.city || "",
      region: p.region || "",
      whatsapp: p.whatsapp || "",
      cnpj: p.cnpj || "",
      cpf: p.cpf || "",
      linked_cnpj: p.linked_cnpj || "",
      instagram: p.instagram || "",
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
  };

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const isEmpresa = form.registration_type === "empresa";
  const isRepresentante = form.registration_type === "representante";

  // ─── Computed validations ──────────────────────────────────────
  const nameValid = validateFullName(form.responsible_name);
  const nameInvalid = form.responsible_name.length > 0 && !nameValid;

  const phoneValid = validatePhone(form.whatsapp);
  const phoneInvalid = form.whatsapp.length > 0 && !phoneValid;

  const cnpjDigits = form.cnpj.replace(/\D/g, "");
  const cnpjValid = validateCNPJ(form.cnpj);
  const cnpjInvalid = cnpjDigits.length > 0 && !cnpjValid;

  const cpfDigits = form.cpf.replace(/\D/g, "");
  const cpfValid = validateCPF(form.cpf);
  const cpfInvalid = cpfDigits.length > 0 && !cpfValid;

  const linkedCnpjDigits = form.linked_cnpj.replace(/\D/g, "");
  const linkedCnpjValid = validateCNPJ(form.linked_cnpj);
  const linkedCnpjInvalid = linkedCnpjDigits.length > 0 && !linkedCnpjValid;

  const formIsValid = (() => {
    if (!form.registration_type) return false;
    if (!form.store_name.trim()) return false;
    if (!nameValid) return false;
    if (!form.supplier_type) return false;
    if (!form.city.trim()) return false;
    if (!phoneValid) return false;
    if (mediaItems.length === 0) return false;
    if (isEmpresa && !cnpjValid) return false;
    if (isRepresentante && !cpfValid) return false;
    if (isRepresentante && !form.cargo.trim()) return false;
    if (linkedCnpjDigits.length > 0 && !linkedCnpjValid) return false;
    return true;
  })();

  const handleSave = async () => {
    if (!formIsValid) {
      if (!form.registration_type) { toast.error("Selecione o tipo de cadastro."); return; }
      if (!form.store_name.trim()) { toast.error("Informe o nome da loja."); return; }
      if (!nameValid) { toast.error("Informe o nome completo (nome e sobrenome)."); return; }
      if (!form.supplier_type) { toast.error("Selecione o tipo de fornecedor."); return; }
      if (!form.city.trim()) { toast.error("Informe a cidade."); return; }
      if (!phoneValid) { toast.error("WhatsApp inválido. Informe DDD + número."); return; }
      if (isEmpresa && !cnpjValid) { toast.error("CNPJ inválido ou obrigatório para empresas."); return; }
      if (isRepresentante && !cpfValid) { toast.error("CPF inválido ou obrigatório para representantes."); return; }
      if (isRepresentante && !form.cargo.trim()) { toast.error("Informe seu cargo ou vínculo."); return; }
      if (mediaItems.length === 0) { toast.error("Adicione ao menos 1 foto ou logo."); return; }
      toast.error("Verifique os campos obrigatórios.");
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
    const logo_url = uploadedUrls[0] || null;
    const store_media = uploadedUrls.slice(1);
    const data = {
      registration_type: form.registration_type,
      store_name: form.store_name.trim(),
      responsible_name: form.responsible_name.trim(),
      supplier_type: form.supplier_type,
      cargo: form.cargo.trim() || null,
      city: form.city.trim(),
      region: form.region.trim(),
      whatsapp: form.whatsapp.trim(),
      cnpj: isEmpresa ? form.cnpj.replace(/\D/g, "") : null,
      cpf: isRepresentante ? form.cpf.replace(/\D/g, "") : null,
      linked_cnpj: form.linked_cnpj ? form.linked_cnpj.replace(/\D/g, "") : null,
      instagram: form.instagram.trim() || null,
      description: form.description.trim(),
      pickup_available: form.pickup_available,
      delivery_available: form.delivery_available,
      delivery_radius_km: form.delivery_radius_km ? parseFloat(form.delivery_radius_km) : null,
      price_per_km: form.price_per_km ? parseFloat(form.price_per_km) : null,
      fixed_delivery_fee: form.fixed_delivery_fee ? parseFloat(form.fixed_delivery_fee) : null,
      minimum_order_for_delivery: form.minimum_order_for_delivery ? parseFloat(form.minimum_order_for_delivery) : null,
      free_delivery_above: form.free_delivery_above ? parseFloat(form.free_delivery_above) : null,
      delivery_notes: form.delivery_notes.trim() || null,
      logo_url, store_media, owner_email: user.email,
      moderation_status: profile ? profile.moderation_status : "pendente",
    };
    if (profile) {
      await base44.entities.SupplierProfile.update(profile.id, data);
      toast.success("Perfil atualizado!");
    } else {
      await base44.entities.SupplierProfile.create(data);
      toast.success("Cadastro enviado para análise!");
    }
    setSaving(false);
    loadData();
  };

  const handleDeleteStore = async () => {
    if (!profile) return;
    const confirmed = window.confirm("Tem certeza que deseja excluir seu cadastro? Todos os produtos serão removidos.");
    if (!confirmed) return;
    for (const prod of products) {
      await base44.entities.InsumoProduct.delete(prod.id);
    }
    await base44.entities.SupplierProfile.delete(profile.id);
    setProfile(null);
    setProducts([]);
    setShowForm(false);
    setMediaItems([]);
    setForm(EMPTY_FORM);
    toast.success("Cadastro excluído com sucesso.");
  };

  const handleToggleProduct = async (product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    try {
      await base44.entities.InsumoProduct.update(product.id, { status: newStatus });
    } catch {
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, status: product.status } : p));
      toast.error("Não foi possível atualizar o produto. Tente novamente.");
    }
  };

  const handleDeleteProduct = async (id) => {
    const backup = products.find(p => p.id === id);
    setProducts(ps => ps.filter(p => p.id !== id));
    toast.success("Produto removido.");
    try {
      await base44.entities.InsumoProduct.delete(id);
    } catch {
      if (backup) setProducts(ps => [backup, ...ps]);
      toast.error("Não foi possível remover. Tente novamente.");
    }
  };

  if (isLoadingAuth || (isAuthenticated && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <GuestScreen />;

  // ─── Moderation status badge ────────────────────────────────────
  const moderationBadge = profile ? {
    pendente: { label: "Em análise", cls: "bg-amber-100 text-amber-700" },
    aprovado: { label: "Ativo", cls: "bg-green-100 text-green-700" },
    rejeitado: { label: "Rejeitado", cls: "bg-red-100 text-red-600" },
  }[profile.moderation_status || "pendente"] : null;

  return (
    <div className="px-4 pt-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/insumos")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Minha Loja</h1>
          {profile && <p className="text-xs text-muted-foreground truncate">{profile.store_name} · {profile.supplier_type}</p>}
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            {moderationBadge && (
              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${moderationBadge.cls}`}>
                <BadgeCheck className="h-3.5 w-3.5" /> {moderationBadge.label}
              </span>
            )}
            <button
              onClick={async () => {
                const slug = slugify(profile.store_name);
                const url = `https://terraponte.app/store/${slug}`;
                const text = `🌾 ${profile.store_name}\n📍 ${[profile.city, profile.region].filter(Boolean).join(" - ")}\n\nVeja nossos produtos no TerraPonte:\n${url}`;
                try { if (navigator.share) { await navigator.share({ title: profile.store_name, text, url }); return; } } catch {}
                await navigator.clipboard.writeText(text);
                toast.success("Link copiado!");
              }}
              className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full shrink-0 select-none"
            >
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </button>
          </div>
        )}
      </div>

      {/* Rejection notice */}
      {profile?.moderation_status === "rejeitado" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-red-700 mb-1">⚠️ Cadastro rejeitado</p>
          {profile.rejection_reason && <p className="text-xs text-red-600">{profile.rejection_reason}</p>}
          <p className="text-xs text-red-600 mt-1">Corrija os dados abaixo e salve novamente para reenviar à análise.</p>
        </div>
      )}

      {/* Onboarding */}
      {!showForm && !profile && (
        <OnboardingBanner onStart={() => setShowForm(true)} />
      )}

      {/* Main form area */}
      {showForm && (
        <>
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-5 gap-1">
            {[
              { id: "perfil", label: "📋 Perfil" },
              { id: "produtos", label: `📦 Produtos${products.length ? ` (${products.length})` : ""}` },
              { id: "entrega", label: "🚚 Entrega" },
              { id: "avisos", label: "📢 Avisos" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all select-none ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── TAB: PERFIL ─── */}
          {tab === "perfil" && (
            <div className="space-y-4">

              {/* ── TIPO DE CADASTRO ── */}
              <SectionCard title="Tipo de cadastro *">
                <p className="text-xs text-muted-foreground -mt-2">Selecione como você vai anunciar no TerraPonte</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      value: "empresa",
                      icon: Building2,
                      title: "Empresa / Loja / Cooperativa",
                      desc: "Anuncio em nome de uma empresa com CNPJ",
                    },
                    {
                      value: "representante",
                      icon: User,
                      title: "Representante / Funcionário / Comissionado",
                      desc: "Anuncio em nome de uma empresa, mas sou pessoa física",
                    },
                  ].map(({ value, icon: Icon, title, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("registration_type", value)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all select-none ${
                        form.registration_type === value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        form.registration_type === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${form.registration_type === value ? "text-primary" : "text-foreground"}`}>{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Only show rest of form after type selected */}
              {form.registration_type && (
                <>
                  {/* Media */}
                  <SectionCard title="Fotos *">
                    <FieldBlock hint="A primeira foto vira a capa. Adicione fotos da fachada, produtos e estrutura.">
                      <MediaUploader items={mediaItems} onChange={setMediaItems} />
                    </FieldBlock>
                    {mediaItems.length === 0 && <p className="text-xs text-red-500">Adicione ao menos 1 foto</p>}
                  </SectionCard>

                  {/* Basic info */}
                  <SectionCard title={isEmpresa ? "Informações da empresa" : "Informações do representante"}>
                    <FieldBlock label={isEmpresa ? "Nome da loja / empresa *" : "Nome da loja que representa *"}
                      hint={isRepresentante ? "Nome da agropecuária, cooperativa ou empresa onde trabalha" : ""}>
                      <Input
                        className="h-12 rounded-xl text-base"
                        placeholder={isEmpresa ? "Ex: Agropecuária São João" : "Ex: Cooperativa Sul Goiano"}
                        value={form.store_name}
                        onChange={e => set("store_name", e.target.value)}
                      />
                    </FieldBlock>

                    <FieldBlock label="Seu nome completo *" hint="Nome e sobrenome">
                      <ValidatedInput
                        placeholder="Nome Sobrenome"
                        value={form.responsible_name}
                        onChange={e => set("responsible_name", e.target.value)}
                        isValid={nameValid}
                        isInvalid={nameInvalid}
                        errorMsg="Informe nome e sobrenome"
                      />
                    </FieldBlock>

                    {isRepresentante && (
                      <FieldBlock label="Cargo / vínculo *" hint="Ex: Vendedor, Representante, Comissionado, Funcionário">
                        <Input
                          className={`h-12 rounded-xl text-base ${form.cargo.trim() ? "border-green-400" : ""}`}
                          placeholder="Ex: Vendedor externo"
                          value={form.cargo}
                          onChange={e => set("cargo", e.target.value)}
                        />
                      </FieldBlock>
                    )}

                    <FieldBlock label="Tipo de fornecedor *">
                      <div className="grid grid-cols-2 gap-2">
                        {SUPPLIER_TYPES.map(t => (
                          <button key={t} type="button" onClick={() => set("supplier_type", t)}
                            className={`py-3 px-3 rounded-xl text-sm font-semibold border transition-all select-none text-left ${
                              form.supplier_type === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-foreground"
                            }`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </FieldBlock>
                  </SectionCard>

                  {/* Documents */}
                  <SectionCard title="Documentos (uso interno)">
                    <p className="text-xs text-muted-foreground -mt-2">Estas informações são sigilosas e nunca serão exibidas publicamente.</p>

                    {isEmpresa && (
                      <FieldBlock label="CNPJ da empresa *">
                        <ValidatedInput
                          placeholder="00.000.000/0001-00"
                          value={form.cnpj}
                          onChange={e => set("cnpj", e.target.value)}
                          isValid={cnpjValid}
                          isInvalid={cnpjInvalid}
                          errorMsg="CNPJ inválido"
                        />
                      </FieldBlock>
                    )}

                    {isRepresentante && (
                      <>
                        <FieldBlock label="CPF do representante *">
                          <ValidatedInput
                            placeholder="000.000.000-00"
                            value={form.cpf}
                            onChange={e => set("cpf", e.target.value)}
                            isValid={cpfValid}
                            isInvalid={cpfInvalid}
                            errorMsg="CPF inválido"
                          />
                        </FieldBlock>
                        <FieldBlock label="CNPJ da empresa vinculada" hint="Opcional — se souber o CNPJ da empresa onde trabalha">
                          <ValidatedInput
                            placeholder="00.000.000/0001-00"
                            value={form.linked_cnpj}
                            onChange={e => set("linked_cnpj", e.target.value)}
                            isValid={linkedCnpjValid}
                            isInvalid={linkedCnpjInvalid}
                            errorMsg="CNPJ inválido"
                          />
                        </FieldBlock>
                      </>
                    )}

                    {isEmpresa && (
                      <FieldBlock label="CPF do responsável" hint="Opcional">
                        <ValidatedInput
                          placeholder="000.000.000-00"
                          value={form.cpf}
                          onChange={e => set("cpf", e.target.value)}
                          isValid={cpfValid}
                          isInvalid={cpfInvalid}
                          errorMsg="CPF inválido"
                        />
                      </FieldBlock>
                    )}
                  </SectionCard>

                  {/* Location & contact */}
                  <SectionCard title="Localização e contato">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <FieldBlock label="Cidade *">
                          <Input className="h-12 rounded-xl text-base" placeholder="Sua cidade" value={form.city} onChange={e => set("city", e.target.value)} />
                        </FieldBlock>
                      </div>
                      <div>
                        <FieldBlock label="UF">
                          <Input className="h-12 rounded-xl text-base" placeholder="GO" maxLength={2} value={form.region} onChange={e => set("region", e.target.value.toUpperCase())} />
                        </FieldBlock>
                      </div>
                    </div>
                    <FieldBlock label="WhatsApp *" hint="Compradores entram em contato por aqui.">
                      <ValidatedInput
                        type="tel"
                        placeholder="(62) 99999-9999"
                        value={form.whatsapp}
                        onChange={e => set("whatsapp", e.target.value)}
                        isValid={phoneValid}
                        isInvalid={phoneInvalid}
                        errorMsg="Telefone inválido. Informe DDD + número."
                      />
                    </FieldBlock>
                    <FieldBlock label="Instagram" hint="Opcional. Ex: @minha_loja">
                      <Input className="h-12 rounded-xl text-base" placeholder="@minha_loja" value={form.instagram} onChange={e => set("instagram", e.target.value)} />
                    </FieldBlock>
                    <FieldBlock label="Descrição" hint="Fale sobre sua loja, produtos e diferenciais.">
                      <Textarea
                        className="rounded-xl text-base min-h-[80px]"
                        placeholder={isEmpresa
                          ? "Ex: Cooperativa com 20 anos de experiência, atendendo produtores de toda a região..."
                          : "Ex: Representante da Cooperativa Sul Goiano, atendendo produtores de Quirinópolis e região..."}
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                      />
                    </FieldBlock>
                  </SectionCard>

                  {profile && (
                    <StoreVerificationBlock profile={profile} onRefresh={loadData} />
                  )}

                  <Button
                    className="w-full h-12 text-base rounded-xl font-bold gap-2"
                    onClick={handleSave}
                    disabled={saving || !formIsValid}
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    {saving ? "Salvando..." : profile ? "Salvar alterações" : "Enviar para análise"}
                  </Button>

                  {!formIsValid && !saving && (
                    <p className="text-xs text-center text-muted-foreground">Preencha todos os campos obrigatórios (*) para continuar</p>
                  )}

                  {profile && (
                    <button
                      onClick={handleDeleteStore}
                      className="w-full h-10 rounded-xl text-sm font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors select-none"
                    >
                      Excluir cadastro
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── TAB: PRODUTOS ─── */}
          {tab === "produtos" && (
            <div>
              {!profile ? (
                <div className="text-center py-12 px-4">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-1">Cadastre o perfil da loja primeiro</p>
                  <p className="text-xs text-muted-foreground mb-4">Assim vinculamos os produtos à sua loja.</p>
                  <Button variant="outline" className="rounded-xl" onClick={() => setTab("perfil")}>
                    Ir para Perfil
                  </Button>
                </div>
              ) : (
                <>
                  <Button className="w-full h-12 rounded-xl font-bold gap-2 mb-4" onClick={() => { setEditProduct(null); setAddProductOpen(true); }}>
                    <PlusCircle className="h-5 w-5" /> Adicionar produto
                  </Button>

                  {products.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Package className="h-14 w-14 text-muted-foreground/25 mx-auto mb-4" />
                      <p className="text-base font-bold text-foreground mb-1">Nenhum produto ainda</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Adicione os insumos que sua loja vende e comece a receber consultas de produtores.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map(prod => (
                        <div key={prod.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${prod.status === "inactive" ? "opacity-60 border-border" : "border-border"}`}>
                          <div className="flex gap-3 p-3">
                            <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              {prod.image_url
                                ? <img src={prod.image_url} alt={prod.product_name} className="w-full h-full object-cover" />
                                : <Package className="h-7 w-7 text-muted-foreground/40" />}
                            </div>
                            <div className="flex-1 min-w-0 py-0.5">
                              <div className="flex items-start justify-between gap-1 mb-0.5">
                                <h3 className="font-bold text-foreground text-sm leading-tight">{prod.product_name}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1 ${
                                  prod.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                                }`}>
                                  {prod.status === "active" ? "Ativo" : "Pausado"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{prod.category}{prod.brand ? ` · ${prod.brand}` : ""}</p>
                              <p className="text-xs text-muted-foreground">{prod.unit}</p>
                              <p className="text-green-600 font-extrabold text-base mt-1">
                                R$ {prod.price?.toFixed(2).replace(".", ",")}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-border px-3 py-2.5 flex items-center justify-between">
                            <span className={`text-xs font-semibold ${prod.stock_status === "Esgotado" ? "text-red-500" : prod.stock_status === "Sob encomenda" ? "text-amber-600" : "text-green-600"}`}>
                              {prod.stock_status === "Esgotado" ? "🔴" : prod.stock_status === "Sob encomenda" ? "🟡" : "🟢"} {prod.stock_status || "Disponível"}
                            </span>
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditProduct(prod); setAddProductOpen(true); }}
                                className="h-8 px-3 rounded-lg bg-muted text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </button>
                              <button onClick={() => handleToggleProduct(prod)}
                                className="h-8 px-3 rounded-lg bg-muted text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                {prod.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                {prod.status === "active" ? "Pausar" : "Ativar"}
                              </button>
                              <button onClick={() => handleDeleteProduct(prod.id)}
                                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── TAB: ENTREGA ─── */}
          {tab === "entrega" && (
            <div className="space-y-4">
              <DeliveryToggle
                label="Retirada na loja"
                sub="Clientes podem buscar pessoalmente"
                enabled={form.pickup_available}
                onToggle={() => set("pickup_available", !form.pickup_available)}
              />
              <DeliveryToggle
                label="Realiza entregas"
                sub="Configure condições abaixo"
                enabled={form.delivery_available}
                onToggle={() => set("delivery_available", !form.delivery_available)}
              />

              {form.delivery_available && (
                <SectionCard title="Condições de entrega">
                  <FieldBlock label="Raio máximo de entrega" hint="Distância máxima que você atende (em km)">
                    <div className="relative">
                      <Input className="h-11 rounded-xl pr-10" type="number" inputMode="decimal" placeholder="Ex: 80" value={form.delivery_radius_km} onChange={e => set("delivery_radius_km", e.target.value)} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">km</span>
                    </div>
                  </FieldBlock>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldBlock label="Taxa fixa de entrega" hint="Cobrada sempre">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                        <Input className="h-11 rounded-xl pl-8" type="number" inputMode="decimal" placeholder="0,00" value={form.fixed_delivery_fee} onChange={e => set("fixed_delivery_fee", e.target.value)} />
                      </div>
                    </FieldBlock>
                    <FieldBlock label="Preço por km" hint="Adicional por distância">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                        <Input className="h-11 rounded-xl pl-8" type="number" inputMode="decimal" placeholder="1,50" value={form.price_per_km} onChange={e => set("price_per_km", e.target.value)} />
                      </div>
                    </FieldBlock>
                  </div>
                  <FieldBlock label="Pedido mínimo para entrega" hint="Valor mínimo do pedido para aceitar entrega">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <Input className="h-11 rounded-xl pl-8" type="number" inputMode="decimal" placeholder="Ex: 200" value={form.minimum_order_for_delivery} onChange={e => set("minimum_order_for_delivery", e.target.value)} />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Frete grátis acima de" hint="Pedidos acima deste valor não pagam frete">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                      <Input className="h-11 rounded-xl pl-8" type="number" inputMode="decimal" placeholder="Ex: 1000" value={form.free_delivery_above} onChange={e => set("free_delivery_above", e.target.value)} />
                    </div>
                  </FieldBlock>
                  <FieldBlock label="Observações sobre entrega" hint="Dias de entrega, restrições, etc.">
                    <Textarea className="rounded-xl text-sm min-h-[75px]" placeholder="Ex: Entregamos às terças e quintas." value={form.delivery_notes} onChange={e => set("delivery_notes", e.target.value)} />
                  </FieldBlock>
                </SectionCard>
              )}

              {!form.pickup_available && !form.delivery_available && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-sm font-semibold text-amber-700">⚠️ Ative pelo menos uma opção de retirada ou entrega para os clientes conseguirem adquirir seus produtos.</p>
                </div>
              )}

              <Button className="w-full h-12 text-base rounded-xl font-bold gap-2" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>
            </div>
          )}
        </>
      )}

      {tab === "avisos" && profile && (
        <AnnouncementsManager storeProfile={profile} />
      )}
      {tab === "avisos" && !profile && (
        <div className="text-center py-12 px-4">
          <p className="text-sm font-semibold text-foreground mb-1">Cadastre o perfil da loja primeiro</p>
          <Button variant="outline" className="rounded-xl mt-2" onClick={() => setTab("perfil")}>Ir para Perfil</Button>
        </div>
      )}

      <AddInsumoForm
        open={addProductOpen}
        onClose={() => { setAddProductOpen(false); setEditProduct(null); }}
        onSaved={() => { setAddProductOpen(false); setEditProduct(null); loadData(); }}
        supplierProfile={profile}
        editProduct={editProduct}
      />
    </div>
  );
}