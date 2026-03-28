import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SELLER_TYPES = ["Produtor", "Loja", "Cooperativa"];
const BADGES = ["", "Produtor local", "Loja parceira", "Verificado"];

export default function EditSellerProfile() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    seller_name: "",
    seller_type: "Produtor",
    bio: "",
    city: "",
    region: "",
    whatsapp: "",
    photo_url: "",
    badge: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    base44.entities.SellerProfile.filter({ owner_email: user.email }).then((results) => {
      if (results[0]) {
        const p = results[0];
        setProfileId(p.id);
        setForm({
          seller_name: p.seller_name || "",
          seller_type: p.seller_type || "Produtor",
          bio: p.bio || "",
          city: p.city || "",
          region: p.region || "",
          whatsapp: p.whatsapp || "",
          photo_url: p.photo_url || "",
          badge: p.badge || "",
        });
        if (p.photo_url) setImagePreview(p.photo_url);
      } else {
        // Pre-fill name from user
        setForm(f => ({ ...f, seller_name: user.full_name || "" }));
      }
      setLoading(false);
    });
  }, [isAuthenticated, user]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.seller_name) { toast.error("Nome obrigatório"); return; }
    setSaving(true);

    let photo_url = form.photo_url;
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      photo_url = res.file_url;
    }

    const data = { ...form, photo_url, owner_email: user.email };
    if (form.badge === "") delete data.badge;

    if (profileId) {
      await base44.entities.SellerProfile.update(profileId, data);
    } else {
      await base44.entities.SellerProfile.create(data);
    }

    setSaving(false);
    toast.success("Perfil salvo!");
    navigate(-1);
  };

  if (isLoadingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/profile");
    return null;
  }

  return (
    <div className="px-4 pt-5 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground font-semibold select-none mb-5"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">Editar perfil de vendedor</h1>
      </div>

      {/* Photo */}
      <div className="flex flex-col items-center mb-6">
        <label className="cursor-pointer">
          <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
            {imagePreview ? (
              <img src={imagePreview} alt="foto" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera className="h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Foto/logo</span>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <p className="text-xs text-muted-foreground mt-2">Toque para alterar</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Nome / Empresa *</Label>
          <Input className="h-12 rounded-xl text-base" value={form.seller_name} onChange={e => set("seller_name", e.target.value)} placeholder="Ex: Sítio dos Pinheiros" />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Tipo de vendedor *</Label>
          <Select value={form.seller_type} onValueChange={v => set("seller_type", v)}>
            <SelectTrigger className="h-12 rounded-xl text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SELLER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Descrição / Bio</Label>
          <Textarea
            className="rounded-xl text-base min-h-[90px]"
            placeholder="Fale um pouco sobre você ou seu negócio..."
            value={form.bio}
            onChange={e => set("bio", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label className="text-sm font-semibold mb-2 block">Cidade</Label>
            <Input className="h-12 rounded-xl text-base" placeholder="Sua cidade" value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">UF</Label>
            <Input className="h-12 rounded-xl text-base" placeholder="MG" maxLength={2} value={form.region} onChange={e => set("region", e.target.value.toUpperCase())} />
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">WhatsApp</Label>
          <Input className="h-12 rounded-xl text-base" type="tel" placeholder="(34) 99999-9999" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Selo de confiança</Label>
          <Select value={form.badge || ""} onValueChange={v => set("badge", v)}>
            <SelectTrigger className="h-12 rounded-xl text-base">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Nenhum</SelectItem>
              {["Produtor local", "Loja parceira", "Verificado"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg mt-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar perfil"}
        </Button>
      </div>
    </div>
  );
}