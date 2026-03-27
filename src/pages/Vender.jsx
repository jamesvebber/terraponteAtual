import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "Gado", label: "🐂 Gado" },
  { value: "Leite", label: "🥛 Leite" },
  { value: "Ovos", label: "🥚 Ovos" },
  { value: "Frutas", label: "🍊 Frutas" },
  { value: "Máquinas", label: "🚜 Máquinas" },
];

export default function Vender() {
  const [form, setForm] = useState({
    product_name: "",
    category: "",
    description: "",
    price: "",
    city: "",
    state: "",
    whatsapp: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.product_name || !form.category || !form.price || !form.city || !form.whatsapp) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);

    let image_url = null;
    if (imageFile) {
      const result = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = result.file_url;
    }

    await base44.entities.ProductListing.create({
      ...form,
      price: parseFloat(form.price),
      image_url,
      status: "active",
    });

    setSubmitting(false);
    setSuccess(true);
    toast.success("Anúncio publicado com sucesso!");

    setTimeout(() => {
      setForm({
        product_name: "",
        category: "",
        description: "",
        price: "",
        city: "",
        state: "",
        whatsapp: "",
      });
      setImageFile(null);
      setImagePreview(null);
      setSuccess(false);
    }, 2500);
  };

  if (success) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Anúncio publicado!</h2>
        <p className="text-sm text-muted-foreground">Seu produto já está disponível.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <PlusCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Vender</h1>
          <p className="text-xs text-muted-foreground font-medium">Publique seu produto</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Image upload */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Foto do produto</Label>
          <label className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:bg-muted transition-colors overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground font-medium">Toque para adicionar</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        {/* Category */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Categoria *</Label>
          <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
            <SelectTrigger className="h-12 rounded-xl text-base">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product name */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Nome do produto *</Label>
          <Input
            className="h-12 rounded-xl text-base"
            placeholder="Ex: 10 cabeças de gado nelore"
            value={form.product_name}
            onChange={(e) => handleChange("product_name", e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Descrição</Label>
          <Textarea
            className="rounded-xl text-base min-h-[80px]"
            placeholder="Descreva seu produto..."
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        {/* Price */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Preço (R$) *</Label>
          <Input
            className="h-12 rounded-xl text-base"
            type="number"
            placeholder="0,00"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
          />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label className="text-sm font-semibold mb-2 block">Cidade *</Label>
            <Input
              className="h-12 rounded-xl text-base"
              placeholder="Sua cidade"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">UF</Label>
            <Input
              className="h-12 rounded-xl text-base"
              placeholder="SP"
              maxLength={2}
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">WhatsApp *</Label>
          <Input
            className="h-12 rounded-xl text-base"
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg mt-2"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Publicar anúncio"
          )}
        </Button>

        <div className="h-4" />
      </div>
    </div>
  );
}