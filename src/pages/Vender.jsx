import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2, CheckCircle2, Camera, X, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "Alimentos da roça", emoji: "🍯" },
  { value: "Laticínios", emoji: "🧀" },
  { value: "Gado e animais", emoji: "🐂" },
  { value: "Hortifruti", emoji: "🥬" },
  { value: "Máquinas e ferramentas", emoji: "🚜" },
  { value: "Artesanato rural", emoji: "🪵" },
  { value: "Serviços rurais", emoji: "🔧" },
  { value: "Outros", emoji: "📦" },
];

const SELLER_TYPES = ["Produtor", "Loja"];

const PROFANITY = ["merda", "porra", "caralho", "puta", "viado", "fdp"];
const hasProfanity = (t) => PROFANITY.some((w) => t?.toLowerCase().includes(w));
const validPhone = (p) => p.replace(/\D/g, "").length >= 10;

const UNITS = [
  { value: "unidade", label: "unidade" },
  { value: "kg", label: "kg" },
  { value: "litro", label: "litro" },
  { value: "saca", label: "saca" },
  { value: "saco", label: "saco" },
  { value: "cabeça", label: "cabeça" },
  { value: "caixa", label: "caixa" },
  { value: "@", label: "arroba (@)" },
  { value: "mês", label: "mês" },
  { value: "hora", label: "hora" },
];

const EMPTY = {
  title: "", description: "", category: "", price: "", unit: "unidade",
  city: "", region: "", seller_name: "", seller_type: "Produtor", whatsapp: "",
};

function FieldGroup({ label, hint, children, error }) {
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
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
            onClick={() => { setForm(EMPTY); setImageFile(null); setImagePreview(null); setPublishedId(null); setErrors({}); setTouched({}); }}
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    setTouched(Object.fromEntries(Object.keys(form).map(k => [k, true])));
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) { toast.error("Corrija os campos destacados."); return; }

    setSubmitting(true);
    let image_url = null;
    if (imageFile) {
      const result = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = result.file_url;
    }

    const listing = await base44.entities.Listing.create({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseFloat(form.price),
      unit: form.unit,
      city: form.city.trim(),
      region: form.region.trim().toUpperCase(),
      seller_name: form.seller_name.trim(),
      seller_type: form.seller_type,
      whatsapp: form.whatsapp,
      image_url,
      status: "active",
    });

    setSubmitting(false);
    setPublishedId(listing.id);
  };

  return (
    <div className="px-4 pt-6 pb-10">
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

      <div className="space-y-5">

        {/* === Produto === */}
        <SectionHeader emoji="📦" title="Produto" />

        {/* Image */}
        <FieldGroup label="Foto do produto" hint="Uma boa foto aumenta muito as chances de venda.">
          <label className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed border-border bg-muted/40 cursor-pointer hover:bg-muted transition-colors overflow-hidden relative">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Toque para adicionar foto</span>
                <span className="text-xs text-muted-foreground/70">JPG, PNG até 10 MB</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
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
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => set("category", cat.value)}
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

        {/* Price + unit */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <FieldGroup label="Preço (R$) *" hint='Ex: "35,00"' error={fieldError("price")}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
                <Input
                  className="h-12 rounded-xl text-base pl-10"
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </div>
            </FieldGroup>
          </div>
          <div className="w-32">
            <FieldGroup label="Unidade">
              <select
                className="w-full h-12 rounded-xl border border-border bg-card text-sm px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.unit}
                onChange={e => set("unit", e.target.value)}
              >
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </FieldGroup>
          </div>
        </div>

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