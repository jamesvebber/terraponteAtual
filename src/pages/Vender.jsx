import { useState, useRef, useEffect } from "react";
import { useScrollOnFocus } from "../hooks/useScrollOnFocus";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, CheckCircle2, ChevronRight, Eye, Zap, Shield, Crown, Check, Star } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import MediaUploader from "../components/MediaUploader";
import { LISTING_CATEGORIES, SALE_FORMATS_BY_CATEGORY, FORMATS_WITH_PKG_DETAILS } from "../utils/listingCategories";
import { formatListingPrice } from "../utils/listingPrice";
import { toast } from "sonner";

const stripePromise = loadStripe('pk_test_51TMTVMKUpjZIh8bE7YnKa8KFJGFbQBx1s5lZ99rDCFNNLWUuGqMMcUybpLwzW9GGCEcc0MQJWk09dE9pXbi8gBfo00vXtPz5Ns');



const SELLER_TYPES = ["Produtor", "Loja"];

// Limites por plano: maxActive = null significa ilimitado
const PLAN_LIMITS = {
  bronze: { maxActive: 1, label: 'Bronze', nextPlan: 'prata' },
  prata:  { maxActive: 2, label: 'Prata',  nextPlan: 'ouro' },
  ouro:   { maxActive: null, label: 'Ouro', nextPlan: null },
  // planos business seguem regra do ouro
  essencial: { maxActive: 10, label: 'Essencial', nextPlan: 'business' },
  business:  { maxActive: null, label: 'Business', nextPlan: null },
  master:    { maxActive: null, label: 'Master', nextPlan: null },
};

const AD_TYPES = [
  {
    id: 'bronze',
    name: 'Bronze',
    emoji: '🥉',
    price: 'Grátis',
    color: 'bg-gray-100 border-gray-200 text-gray-700',
    btnColor: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    features: [
      '1 foto no anúncio',
      'Visibilidade básica',
      '1 anúncio por vez'
    ],
    limits: { maxPhotos: 1, maxActive: 1 }
  },
  {
    id: 'prata',
    name: 'Prata',
    emoji: '🥈',
    price: 'R$ 19,90',
    color: 'bg-blue-100 border-blue-200 text-blue-700',
    btnColor: 'bg-blue-600 text-white hover:bg-blue-700',
    features: [
      '3 fotos no anúncio',
      '✅ Selo "Verificado"',
      'Destaque no feed',
      '1 disparo WhatsApp',
      'Até 2 anúncios ativos'
    ],
    limits: { maxPhotos: 3, maxActive: 2 }
  },
  {
    id: 'ouro',
    name: 'Ouro',
    emoji: '🥇',
    price: 'R$ 39,90',
    color: 'bg-amber-100 border-amber-200 text-amber-700',
    btnColor: 'bg-amber-600 text-white hover:bg-amber-700',
    features: [
      '8 fotos no anúncio',
      '🏆 Selo "Verificado" Ouro',
      'Destaque máximo',
      '3 disparos WhatsApp',
      'Anúncios ilimitados'
    ],
    limits: { maxPhotos: 8, maxActive: null }
  }
];

const PROFANITY = ["merda", "porra", "caralho", "puta", "viado", "fdp"];
const hasProfanity = (t) => PROFANITY.some((w) => t?.toLowerCase().includes(w));
const validPhone = (p) => p.replace(/\D/g, "").length >= 10;



const EMPTY = {
  title: "", description: "", category: "", price: "",
  sale_format: "", pkg_qty: "", pkg_unit: "",
  city: "", region: "", seller_name: "", seller_type: "Produtor", whatsapp: "",
  availability_status: "Disponível", delivery_type: "", freight_info: "",
  prop_type: "", prop_purpose: "venda", prop_area: "", prop_area_unit: "hectare",
  prop_aptitude: "", prop_has_water: false, prop_has_power: false,
  prop_infrastructure: "", prop_distance_km: "",
};

function FieldGroup({ label, hint = "", children, error = null }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-foreground block">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-0.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

function SectionHeader({ emoji, title }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <span className="text-lg">{emoji}</span>
      <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide">{title}</h2>
    </div>
  );
}

export default function Vender() {
  const { isAuthenticated, isLoadingAuth, user, sellerProfile } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  useScrollOnFocus(scrollRef);
  const [form, setForm] = useState(EMPTY);
  const [mediaItems, setMediaItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [adType, setAdType] = useState(null);
  const [showAdTypeSelector, setShowAdTypeSelector] = useState(false);

  const getDefaultAdType = () => {
    if (!sellerProfile?.plan_type) return 'bronze';
    if (sellerProfile.plan_type === 'ouro') return 'ouro';
    if (sellerProfile.plan_type === 'prata') return 'prata';
    return 'bronze';
  };

  // Pré-preenche nome e WhatsApp do perfil quando disponíveis
  useEffect(() => {
    setAdType(getDefaultAdType());
    if (user || sellerProfile) {
      setForm(prev => ({
        ...prev,
        seller_name: prev.seller_name || sellerProfile?.seller_name || user?.full_name || "",
        whatsapp: prev.whatsapp || sellerProfile?.whatsapp || "",
      }));
    }
  }, [sellerProfile, user]);

  const getAdTypeConfig = (typeId) => AD_TYPES.find(t => t.id === typeId);

  const checkPlanLimit = async () => {
    const plan = sellerProfile?.plan_type || 'bronze';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.bronze;
    if (limits.maxActive === null) return { allowed: true };

    const activeListings = await base44.entities.Listing.filter({ status: "active", created_by: user?.email });
    if (activeListings.length >= limits.maxActive) {
      return { allowed: false, limit: limits.maxActive, plan: limits.label, nextPlan: limits.nextPlan };
    }
    return { allowed: true };
  };

  if (isLoadingAuth) {
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
          <PlusCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-2">Anuncie no TerraPonte</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Entre na sua conta para publicar anúncios e vender direto para compradores da sua região.
        </p>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="w-full max-w-xs h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base"
        >
          Entrar / Criar conta
        </button>
      </div>
    );
  }

  // Success screen
  if (publishedId) {
    return (
      <div className="px-4 pt-12 flex flex-col items-center justify-center min-h-[75vh] text-center">
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-5 shadow">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Anúncio publicado!</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">
          Seu produto já está visível no TerraPonte para compradores da sua região.
        </p>
        <div className="w-full max-w-xs space-y-3">
          <Button
            className="w-full h-12 rounded-xl font-bold gap-2"
            onClick={() => navigate(`/marketplace/${publishedId}`)}
          >
            <Eye className="h-4 w-4" /> Ver meu anúncio
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-bold gap-2"
            onClick={() => { setForm(EMPTY); setMediaItems([]); setPublishedId(null); setErrors({}); setTouched({}); }}
          >
            <PlusCircle className="h-4 w-4" /> Publicar outro anúncio
          </Button>
        </div>
      </div>
    );
  }

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setTouched((p) => ({ ...p, [field]: true }));
  };

  const validate = (f) => {
    const e = {};
    if (!f.title || f.title.trim().length < 5) e.title = "Mínimo 5 caracteres.";
    if (hasProfanity(f.title)) e.title = "Título contém conteúdo inadequado.";
    if (!f.category) e.category = "Selecione uma categoria.";
    if (!f.sale_format) e.sale_format = "Selecione a forma de venda.";
    if (!f.price || isNaN(parseFloat(f.price)) || parseFloat(f.price) <= 0) e.price = "Informe um preço válido.";
    if (!f.city || f.city.trim().length < 2) e.city = "Informe a cidade.";
    if (!f.seller_name || f.seller_name.trim().length < 2) e.seller_name = "Informe seu nome ou nome da loja.";
    if (!f.whatsapp || !validPhone(f.whatsapp)) e.whatsapp = "WhatsApp inválido. Inclua o DDD.";
    if (hasProfanity(f.description)) e.description = "Descrição contém conteúdo inadequado.";
    return e;
  };

  const liveErrors = validate(form);
  const isReady = Object.keys(liveErrors).length === 0;

  const fieldError = (field) => touched[field] ? liveErrors[field] : undefined;

  const handleSubmit = async () => {
    setTouched(Object.fromEntries(Object.keys(form).map(k => [k, true])));
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) { toast.error("Corrija os campos destacados."); return; }

    const adConfig = getAdTypeConfig(adType);

    const limitCheck = await checkPlanLimit();
    if (!limitCheck.allowed) {
      const nextMsg = limitCheck.nextPlan
        ? ` Faça upgrade para o plano ${limitCheck.nextPlan.charAt(0).toUpperCase() + limitCheck.nextPlan.slice(1)} e publique mais!`
        : '';
      toast.error(`Limite do plano ${limitCheck.plan}: máximo de ${limitCheck.limit} anúncio${limitCheck.limit > 1 ? 's' : ''} ativo${limitCheck.limit > 1 ? 's' : ''}.${nextMsg}`);
      navigate("/planos");
      return;
    }

    setSubmitting(true);
    // Upload all media files
    const uploadedUrls = [];
    for (const item of mediaItems) {
      if (item.file) {
        const result = await base44.integrations.Core.UploadFile({ file: item.file });
        uploadedUrls.push(result.file_url);
      } else if (item.url) {
        uploadedUrls.push(item.url);
      }
    }
    const image_url = uploadedUrls[0] || null;
    const photos = uploadedUrls.slice(1, 1 + adConfig.limits.maxPhotos);

    const unitLabel = form.pkg_qty && form.pkg_unit
      ? `${form.sale_format} de ${form.pkg_qty} ${form.pkg_unit}`
      : form.sale_format;

    const adExpiry = adType !== 'bronze' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const whatsappDispatchesAllowed = adType === 'prata' ? 1 : adType === 'ouro' ? 3 : 0;

    const hasPremiumPlan = sellerProfile?.plan_type && ['prata', 'ouro', 'essencial', 'business', 'master'].includes(sellerProfile.plan_type);
    const needsPayment = adType !== 'bronze' && !hasPremiumPlan;

    if (needsPayment) {
      toast.warning("Pagamento Avulso em breve! Por enquanto, seu anúncio será criado como Bronze.");
      toast.info("Em breve você poderá pagar R$ 19,90 (Prata) ou R$ 39,90 (Ouro) por anúncio.");
    }

    const listing = await base44.entities.Listing.create({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseFloat(form.price),
      sale_format: form.sale_format,
      pkg_qty: form.pkg_qty ? parseFloat(form.pkg_qty) : null,
      pkg_unit: form.pkg_unit || null,
      unit: unitLabel,
      city: form.city.trim(),
      region: form.region.trim().toUpperCase(),
      seller_name: form.seller_name.trim(),
      seller_type: form.seller_type,
      whatsapp: form.whatsapp,
      image_url,
      photos,
      ...(form.category === "Propriedades rurais" ? {
        prop_type: form.prop_type,
        prop_purpose: form.prop_purpose,
        prop_area: form.prop_area ? parseFloat(form.prop_area) : null,
        prop_area_unit: form.prop_area_unit,
        prop_aptitude: form.prop_aptitude,
        prop_has_water: form.prop_has_water,
        prop_has_power: form.prop_has_power,
        prop_infrastructure: form.prop_infrastructure,
        prop_distance_km: form.prop_distance_km ? parseFloat(form.prop_distance_km) : null,
      } : {}),
      status: "active",
      availability_status: form.availability_status || "Disponível",
      delivery_type: form.delivery_type || null,
      freight_info: form.freight_info || null,
      ad_type: adType,
      ad_expiry: adExpiry,
      is_upgraded: adType !== 'bronze',
      whatsapp_dispatches_allowed: whatsappDispatchesAllowed,
      whatsapp_dispatches_used: 0,
      views_count: 0,
      renewal_count: 0,
    });

    setSubmitting(false);
    setPublishedId(listing.id);

    if (whatsappDispatchesAllowed > 0) {
      try {
        await base44.entities.WhatsAppDispatch.create({
          listing_id: listing.id,
          listing_title: listing.title,
          status: "pendente",
          target_region: listing.region || "Goiás",
          owner_email: user.email,
          scheduled_date: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to queue WhatsApp dispatch:", err);
      }
    }
  };

  return (
    <div ref={scrollRef} className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <PlusCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Anunciar produto</h1>
          <p className="text-xs text-muted-foreground font-medium">Ganhe visibilidade e venda direto pelo WhatsApp</p>
        </div>
      </div>
      
      {/* Upsell Banner for Bronze users */}
      {(sellerProfile?.plan_type === 'bronze' || !sellerProfile?.plan_type) && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Zap className="h-16 w-16 text-amber-600" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-extrabold text-amber-800 flex items-center gap-1.5 mb-1">
              <Zap className="h-4 w-4 fill-amber-500" /> Turbine suas vendas!
            </h3>
            <p className="text-xs text-amber-700/80 font-medium leading-relaxed mb-4 max-w-[85%]">
              Anúncios **Prata e Ouro** ganham selo verificado e disparos automáticos nos grupos de WhatsApp da região.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 rounded-xl border-amber-300 bg-white/50 text-amber-800 font-bold hover:bg-amber-100 transition-colors"
              onClick={() => navigate("/planos")}
            >
              Ver vantagens premium
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-5">

        {/* === Produto === */}
        <SectionHeader emoji="📦" title="Produto" />

        {/* Media */}
        <FieldGroup label="Fotos e vídeos" hint="Adicione fotos e vídeo. A primeira foto será a capa do anúncio.">
          <MediaUploader items={mediaItems} onChange={setMediaItems} />
        </FieldGroup>

        {/* Title */}
        <FieldGroup label="Título *" hint='Ex: "Queijo artesanal meia cura"' error={fieldError("title")}>
          <Input
            className="h-12 rounded-xl text-base"
            placeholder="Descreva o produto em poucas palavras"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </FieldGroup>

        {/* Description */}
        <FieldGroup label="Descrição" hint='Ex: "Produção local, fresco, retirada em Goiás..."' error={fieldError("description")}>
          <Textarea
            className="rounded-xl text-base min-h-[90px]"
            placeholder="Detalhes do produto, condições, disponibilidade..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </FieldGroup>

        {/* Category */}
        <FieldGroup label="Categoria *" error={fieldError("category")}>
          <div className="grid grid-cols-2 gap-2">
            {LISTING_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => { set("category", cat.value); set("sale_format", ""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                  form.category === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="text-left leading-tight">{cat.value}</span>
              </button>
            ))}
          </div>
        </FieldGroup>

        {/* Price */}
        <FieldGroup label="Preço (R$) *" hint='Ex: "35,00"' error={fieldError("price")}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
            <Input
              className="h-12 rounded-xl text-base pl-10"
              type="number" inputMode="decimal" placeholder="0,00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
        </FieldGroup>

        {/* Forma de venda */}
        {form.category && (
          <FieldGroup label="Como este item é vendido? *" error={fieldError("sale_format")}>
            <div className="grid grid-cols-2 gap-2">
              {(SALE_FORMATS_BY_CATEGORY[form.category] || []).map((sf) => (
                <button
                  key={sf.value} type="button"
                  onClick={() => { set("sale_format", sf.value); set("pkg_qty", ""); set("pkg_unit", ""); }}
                  className={`flex items-center justify-center px-3 py-3 rounded-xl text-sm font-semibold border transition-colors select-none ${
                    form.sale_format === sf.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
          </FieldGroup>
        )}

        {/* Optional package details */}
        {FORMATS_WITH_PKG_DETAILS.includes(form.sale_format) && (
          <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Detalhes da embalagem (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Quantidade">
                <Input className="h-11 rounded-xl text-base" type="number" inputMode="decimal" placeholder="Ex: 12" value={form.pkg_qty} onChange={e => set("pkg_qty", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Unidade">
                <Input className="h-11 rounded-xl text-base" placeholder="Ex: kg, unidades" value={form.pkg_unit} onChange={e => set("pkg_unit", e.target.value)} />
              </FieldGroup>
            </div>
            {form.price && form.pkg_qty && form.pkg_unit && (
              <div className="bg-card border border-border rounded-xl px-4 py-2">
                <p className="text-xs text-muted-foreground">Prévia: <span className="font-bold text-foreground">R$ {parseFloat(form.price).toFixed(2).replace(".", ",")} {form.sale_format} de {form.pkg_qty} {form.pkg_unit}</span></p>
              </div>
            )}
          </div>
        )}

        {/* Property-specific fields */}
        {form.category === "Propriedades rurais" && (
          <div className="space-y-4 bg-muted/30 border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">🏡 Dados do imóvel</p>

            <FieldGroup label="Tipo do imóvel">
              <div className="flex flex-wrap gap-2">
                {["Sítio", "Chácara", "Fazenda", "Lote rural", "Rancho", "Terra para arrendamento"].map(t => (
                  <button key={t} type="button" onClick={() => set("prop_type", t)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border select-none transition-colors ${
                      form.prop_type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}>{t}</button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Finalidade">
              <div className="flex gap-2">
                {["venda", "arrendamento", "parceria"].map(p => (
                  <button key={p} type="button" onClick={() => set("prop_purpose", p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border capitalize select-none transition-colors ${
                      form.prop_purpose === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}>{p}</button>
                ))}
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Área">
                <Input className="h-11 rounded-xl text-base" type="number" inputMode="decimal" placeholder="Ex: 48" value={form.prop_area} onChange={e => set("prop_area", e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Unidade da área">
                <div className="flex gap-2">
                  {["hectare", "alqueire"].map(u => (
                    <button key={u} type="button" onClick={() => set("prop_area_unit", u)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border select-none transition-colors ${
                        form.prop_area_unit === u ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                      }`}>{u}</button>
                  ))}
                </div>
              </FieldGroup>
            </div>

            <FieldGroup label="Aptidão da área">
              <div className="flex flex-wrap gap-2">
                {["Pecuária", "Lavoura", "Lazer", "Mista"].map(a => (
                  <button key={a} type="button" onClick={() => set("prop_aptitude", a)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold border select-none transition-colors ${
                      form.prop_aptitude === a ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}>{a}</button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Infraestrutura">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => set("prop_has_water", !form.prop_has_water)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border select-none transition-colors ${
                    form.prop_has_water ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-card border-border text-muted-foreground"
                  }`}>
                  💧 {form.prop_has_water ? "Tem água" : "Sem água"}
                </button>
                <button type="button" onClick={() => set("prop_has_power", !form.prop_has_power)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border select-none transition-colors ${
                    form.prop_has_power ? "bg-yellow-100 border-yellow-400 text-yellow-700" : "bg-card border-border text-muted-foreground"
                  }`}>
                  ⚡ {form.prop_has_power ? "Tem energia" : "Sem energia"}
                </button>
              </div>
              <Input className="h-11 rounded-xl text-base" placeholder="Benfeitorias, currais, casa sede... (opcional)" value={form.prop_infrastructure} onChange={e => set("prop_infrastructure", e.target.value)} />
            </FieldGroup>

            <FieldGroup label="Distância da cidade (km, opcional)">
              <Input className="h-11 rounded-xl text-base" type="number" inputMode="decimal" placeholder="Ex: 15" value={form.prop_distance_km} onChange={e => set("prop_distance_km", e.target.value)} />
            </FieldGroup>
          </div>
        )}

        {/* === Localização === */}
        <SectionHeader emoji="📍" title="Localização" />

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <FieldGroup label="Cidade *" hint='Ex: "São Luís de Montes Belos"' error={fieldError("city")}>
              <Input
                className="h-12 rounded-xl text-base"
                placeholder="Sua cidade"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </FieldGroup>
          </div>
          <div>
            <FieldGroup label="UF">
              <Input
                className="h-12 rounded-xl text-base"
                placeholder="GO"
                maxLength={2}
                value={form.region}
                onChange={(e) => set("region", e.target.value.toUpperCase())}
              />
            </FieldGroup>
          </div>
        </div>

        {/* === Vendedor === */}
        <SectionHeader emoji="👤" title="Vendedor" />

        {/* Seller name */}
        <FieldGroup label="Seu nome ou nome da loja *" hint='Ex: "Sítio Boa Vista" ou "João Silva"' error={fieldError("seller_name")}>
          <Input
            className="h-12 rounded-xl text-base"
            placeholder="Como você quer ser identificado"
            value={form.seller_name}
            onChange={(e) => set("seller_name", e.target.value)}
          />
        </FieldGroup>

        {/* Seller type */}
        <FieldGroup label="Tipo de vendedor">
          <div className="flex gap-2">
            {SELLER_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("seller_type", t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                  form.seller_type === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {t === "Produtor" ? "🌱 Produtor" : "🏪 Loja"}
              </button>
            ))}
          </div>
        </FieldGroup>

        {/* === Disponibilidade e Entrega === */}
        <SectionHeader emoji="🚚" title="Disponibilidade e Entrega" />

        <FieldGroup label="Disponibilidade">
          <div className="flex flex-wrap gap-2">
            {["Disponível", "Sob encomenda", "Indisponível"].map(opt => (
              <button key={opt} type="button" onClick={() => set("availability_status", opt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                  form.availability_status === opt ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}>{opt}</button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Forma de entrega" hint="Opcional — ajuda compradores a se preparar">
          <div className="flex flex-wrap gap-2">
            {["Retirada no local", "Entrega a combinar", "Entrega disponível"].map(opt => (
              <button key={opt} type="button" onClick={() => set("delivery_type", form.delivery_type === opt ? "" : opt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                  form.delivery_type === opt ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}>{opt}</button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Frete" hint="Opcional">
          <div className="flex flex-wrap gap-2">
            {["Sem frete / retirada", "Frete a combinar", "Entrega própria"].map(opt => (
              <button key={opt} type="button" onClick={() => set("freight_info", form.freight_info === opt ? "" : opt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${
                  form.freight_info === opt ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}>{opt}</button>
            ))}
          </div>
        </FieldGroup>

        {/* WhatsApp */}
        <FieldGroup
          label="WhatsApp *"
          hint="Compradores entrarão em contato por aqui. Inclua o DDD."
          error={fieldError("whatsapp")}
        >
          <Input
            className="h-12 rounded-xl text-base"
            type="tel"
            inputMode="tel"
            placeholder="(62) 99999-9999"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
          />
        </FieldGroup>

        {/* === Tipo do Anúncio === */}
        <SectionHeader emoji="📊" title="Tipo do anúncio" />

        <div className="space-y-3">
          {AD_TYPES.map((type) => {
            const isSelected = adType === type.id;
            const isDisabled = type.id === 'bronze' && sellerProfile?.plan_type && sellerProfile.plan_type !== 'bronze';
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setAdType(type.id)}
                disabled={isDisabled}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  isSelected 
                    ? `border-primary bg-primary/5 ${type.color}` 
                    : 'border-border bg-card'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type.color}`}>
                      {type.id === 'bronze' ? <Shield className="h-5 w-5" /> : type.id === 'prata' ? <Star className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground">{type.emoji} {type.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                        {(sellerProfile?.plan_type === 'ouro' || sellerProfile?.plan_type === 'prata') && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                            INCLUÍDO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{type.price}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {type.features.map((feature, i) => (
                    <span key={i} className="text-[10px] bg-muted/50 px-2 py-1 rounded-full text-muted-foreground font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit */}
        <div className="pt-2">
          {!isReady && Object.keys(touched).length > 0 && (
            <p className="text-xs text-muted-foreground text-center mb-3">
              Preencha todos os campos obrigatórios (*) para publicar.
            </p>
          )}
          <Button
            className="w-full h-14 text-base font-bold rounded-xl shadow-md gap-2"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Publicando...</>
            ) : (
              <><ChevronRight className="h-5 w-5" /> Publicar anúncio</>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Ao publicar, você concorda com os <span className="underline cursor-pointer" onClick={() => navigate("/terms")}>Termos de Uso</span> do TerraPonte.
          </p>
        </div>
      </div>
    </div>
  );
}