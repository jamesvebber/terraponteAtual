import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, CheckCircle2, Camera, X, Image, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LISTING_CATEGORIES, SALE_FORMATS_BY_CATEGORY, FORMATS_WITH_PKG_DETAILS } from "../utils/listingCategories";
import { formatListingPrice } from "../utils/listingPrice";

function FieldGroup({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-foreground block">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const [tab, setTab] = useState(urlParams.get("tab") === "photos" ? "photos" : "info");

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    base44.entities.Listing.filter({ id }).then(([l]) => {
      if (!l) { navigate("/meus-anuncios"); return; }
      setListing(l);
      setForm({
        title: l.title || "",
        description: l.description || "",
        category: l.category || "",
        price: l.price?.toString() || "",
        sale_format: l.sale_format || "",
        pkg_qty: l.pkg_qty?.toString() || "",
        pkg_unit: l.pkg_unit || "",
        city: l.city || "",
        region: l.region || "",
        seller_name: l.seller_name || "",
        whatsapp: l.whatsapp || "",
        status: l.status || "active",
      });
      setLoading(false);
    });
  }, [id]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!form.title || !form.price || !form.city) { toast.error("Preencha os campos obrigatórios."); return; }
    setSaving(true);
    const unitLabel = form.pkg_qty && form.pkg_unit
      ? `${form.sale_format} de ${form.pkg_qty} ${form.pkg_unit}`
      : form.sale_format;
    await base44.entities.Listing.update(id, {
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
      whatsapp: form.whatsapp,
    });
    setSaving(false);
    toast.success("Anúncio atualizado!");
    navigate(`/marketplace/${id}`);
  };

  // ── Photo management ──
  const allPhotos = listing ? [
    ...(listing.image_url ? [{ url: listing.image_url, isCover: true }] : []),
    ...(listing.photos || []).map(url => ({ url, isCover: false })),
  ] : [];

  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newPhotos = [...(listing.photos || []), file_url];
    await base44.entities.Listing.update(id, { photos: newPhotos });
    setListing(l => ({ ...l, photos: newPhotos }));
    setUploadingPhoto(false);
    toast.success("Foto adicionada!");
  };

  const handleRemovePhoto = async (url, isCover) => {
    if (!window.confirm("Remover esta foto?")) return;
    if (isCover) {
      const remaining = listing.photos || [];
      const newCover = remaining[0] || null;
      const newPhotos = remaining.slice(1);
      await base44.entities.Listing.update(id, { image_url: newCover, photos: newPhotos });
      setListing(l => ({ ...l, image_url: newCover, photos: newPhotos }));
    } else {
      const newPhotos = (listing.photos || []).filter(p => p !== url);
      await base44.entities.Listing.update(id, { photos: newPhotos });
      setListing(l => ({ ...l, photos: newPhotos }));
    }
    toast.success("Foto removida.");
  };

  const handleSetCover = async (url) => {
    const oldCover = listing.image_url;
    const newPhotos = [
      ...(listing.photos || []).filter(p => p !== url),
      ...(oldCover ? [oldCover] : []),
    ];
    await base44.entities.Listing.update(id, { image_url: url, photos: newPhotos });
    setListing(l => ({ ...l, image_url: url, photos: newPhotos }));
    toast.success("Capa atualizada!");
  };

  if (isLoadingAuth || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (listing && user && listing.created_by !== user.email) {
    navigate("/meus-anuncios");
    return null;
  }

  return (
    <div className="px-4 pt-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/meus-anuncios")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground">Editar anúncio</h1>
          <p className="text-xs text-muted-foreground truncate">{listing?.title}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-5 gap-1">
        {[
          { id: "info", label: "📋 Informações" },
          { id: "photos", label: `📷 Fotos (${allPhotos.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all select-none ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ── */}
      {tab === "info" && (
        <div className="space-y-4">
          <FieldGroup label="Título *">
            <Input className="h-12 rounded-xl text-base" value={form.title} onChange={e => set("title", e.target.value)} />
          </FieldGroup>

          <FieldGroup label="Descrição">
            <Textarea className="rounded-xl text-base min-h-[90px]" value={form.description} onChange={e => set("description", e.target.value)} />
          </FieldGroup>

          <FieldGroup label="Categoria">
            <div className="grid grid-cols-2 gap-2">
              {LISTING_CATEGORIES.map(cat => (
                <button key={cat.value} type="button" onClick={() => { set("category", cat.value); set("sale_format", ""); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors select-none ${form.category === cat.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                  <span>{cat.emoji}</span><span className="text-left leading-tight">{cat.value}</span>
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Preço (R$) *">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">R$</span>
              <Input className="h-12 rounded-xl text-base pl-10" type="number" inputMode="decimal" value={form.price} onChange={e => set("price", e.target.value)} />
            </div>
          </FieldGroup>

          {form.category && (
            <FieldGroup label="Forma de venda">
              <div className="grid grid-cols-2 gap-2">
                {(SALE_FORMATS_BY_CATEGORY[form.category] || []).map(sf => (
                  <button key={sf.value} type="button" onClick={() => set("sale_format", sf.value)}
                    className={`flex items-center justify-center px-3 py-3 rounded-xl text-sm font-semibold border transition-colors select-none ${form.sale_format === sf.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                    {sf.label}
                  </button>
                ))}
              </div>
            </FieldGroup>
          )}

          {FORMATS_WITH_PKG_DETAILS.includes(form.sale_format) && (
            <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Detalhes da embalagem</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Quantidade">
                  <Input className="h-11 rounded-xl text-base" type="number" value={form.pkg_qty} onChange={e => set("pkg_qty", e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Unidade">
                  <Input className="h-11 rounded-xl text-base" placeholder="kg, unidades" value={form.pkg_unit} onChange={e => set("pkg_unit", e.target.value)} />
                </FieldGroup>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <FieldGroup label="Cidade *">
                <Input className="h-12 rounded-xl text-base" value={form.city} onChange={e => set("city", e.target.value)} />
              </FieldGroup>
            </div>
            <div>
              <FieldGroup label="UF">
                <Input className="h-12 rounded-xl text-base" maxLength={2} value={form.region} onChange={e => set("region", e.target.value.toUpperCase())} />
              </FieldGroup>
            </div>
          </div>

          <FieldGroup label="Seu nome / loja *">
            <Input className="h-12 rounded-xl text-base" value={form.seller_name} onChange={e => set("seller_name", e.target.value)} />
          </FieldGroup>

          <FieldGroup label="WhatsApp *">
            <Input className="h-12 rounded-xl text-base" type="tel" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} />
          </FieldGroup>

          <Button className="w-full h-14 text-base font-bold rounded-xl gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Salvando...</> : <><CheckCircle2 className="h-5 w-5" /> Salvar alterações</>}
          </Button>
        </div>
      )}

      {/* ── PHOTOS TAB ── */}
      {tab === "photos" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">A primeira foto é a capa do anúncio. Toque em ⭐ para definir outra capa.</p>

          <div className="grid grid-cols-2 gap-3">
            {allPhotos.map(({ url, isCover }) => (
              <div key={url} className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                <img src={url} alt="" className="w-full h-full object-contain" />
                {isCover && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⭐ Capa
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!isCover && (
                    <button onClick={() => handleSetCover(url)}
                      className="h-7 w-7 rounded-full bg-black/60 flex items-center justify-center select-none">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                    </button>
                  )}
                  <button onClick={() => handleRemovePhoto(url, isCover)}
                    className="h-7 w-7 rounded-full bg-black/60 flex items-center justify-center select-none">
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add photo slot */}
            <label className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
              {uploadingPhoto ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-xs font-semibold text-muted-foreground">Adicionar foto</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} disabled={uploadingPhoto} />
            </label>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Fotos ajudam a vender mais. Adicione até 8 fotos do produto.
          </p>
        </div>
      )}
    </div>
  );
}