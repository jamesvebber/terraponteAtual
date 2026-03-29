import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import FreightCalculator from "../components/FreightCalculator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, MapPin, Store, MessageCircle, Calculator, Package,
  Truck, ShoppingBag, Phone, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { toSlug } from "./SlugRedirect";
import { formatInsumoPrice, formatEquivalentPrice } from "../utils/insumoPrice";

const categoryEmoji = {
  "Ração": "🌾", "Sal mineral": "🧂", "Adubo": "🌱", "Sementes": "🌻",
  "Defensivos": "🧪", "Medicamentos veterinários": "💊", "Ferramentas": "🔧",
  "Equipamentos": "⚙️", "Outros": "📦",
};

export default function InsumoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [freightOpen, setFreightOpen] = useState(false);

  useEffect(() => {
    base44.entities.InsumoProduct.filter({ id }).then(([p]) => {
      setProduct(p || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="font-bold text-foreground mb-1">Produto não encontrado</p>
        <Button variant="outline" className="rounded-xl mt-3" onClick={() => navigate("/insumos")}>
          Voltar aos insumos
        </Button>
      </div>
    );
  }

  const slug = toSlug(product.product_name, product.city);
  const shareUrl = `${window.location.origin}/p/${slug}`;

  const handleShare = async () => {
    const price = `R$ ${product.price?.toFixed(2).replace(".", ",")}/${product.unit}`;
    const location = [product.city, product.region].filter(Boolean).join(" - ");
    const text = `🌾 INSUMO - ${product.product_name}\n💰 ${price}\n📍 ${location}\n\nVer produto:\n${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.product_name, text, url: shareUrl });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    await navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  const waUrl = product.whatsapp
    ? `https://wa.me/55${product.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o produto "${product.product_name}" no TerraPonte e tenho interesse.`
    : null;

  const inputForCalc = {
    ...product,
    supplier: product.supplier_name,
    state: product.region,
    pickup_available: product.pickup_available !== false,
    delivery_available: !!product.delivery_available,
  };

  const stockColor =
    product.stock_status === "Esgotado" ? "bg-red-100 text-red-600" :
    product.stock_status === "Sob encomenda" ? "bg-amber-100 text-amber-700" :
    "bg-green-100 text-green-700";

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 sticky top-0 bg-background z-10 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0 select-none"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-extrabold text-foreground leading-tight line-clamp-1 flex-1">
          {product.product_name}
        </h1>
      </div>

      {/* Image */}
      <div className="w-full h-56 bg-muted flex items-center justify-center relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
          : <span className="text-7xl">{categoryEmoji[product.category] || "📦"}</span>
        }
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.featured && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Destaque</span>
          )}
        </div>
        {product.stock_status && (
          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${stockColor}`}>
            {product.stock_status}
          </span>
        )}
      </div>

      <div className="px-4 pt-4 pb-24 space-y-5">
        {/* Title & Price */}
        <div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-2 inline-block">
            {product.category}
          </span>
          <h2 className="text-xl font-extrabold text-foreground leading-snug">{product.product_name}</h2>
          {product.brand && <p className="text-sm text-muted-foreground mt-0.5">{product.brand}</p>}
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-green-600 leading-snug">{formatInsumoPrice(product)}</p>
            {formatEquivalentPrice(product) && (
              <p className="text-sm text-muted-foreground mt-0.5">{formatEquivalentPrice(product)}</p>
            )}
          </div>
        </div>

        {/* Store info */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-bold text-foreground text-sm">{product.supplier_name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{product.city}{product.region ? `, ${product.region}` : ""}</span>
          </div>
          {product.whatsapp && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{product.whatsapp}</span>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Disponibilidade</p>
          <div className="flex gap-2">
            <div className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl ${product.pickup_available !== false ? "bg-green-50 border border-green-200" : "bg-muted border border-border opacity-50"}`}>
              <ShoppingBag className={`h-5 w-5 ${product.pickup_available !== false ? "text-green-600" : "text-muted-foreground"}`} />
              <span className={`text-xs font-bold ${product.pickup_available !== false ? "text-green-700" : "text-muted-foreground"}`}>
                {product.pickup_available !== false ? "Retirada" : "Sem retirada"}
              </span>
            </div>
            <div className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl ${product.delivery_available ? "bg-blue-50 border border-blue-200" : "bg-muted border border-border opacity-50"}`}>
              <Truck className={`h-5 w-5 ${product.delivery_available ? "text-blue-600" : "text-muted-foreground"}`} />
              <span className={`text-xs font-bold ${product.delivery_available ? "text-blue-700" : "text-muted-foreground"}`}>
                {product.delivery_available
                  ? product.delivery_radius_km ? `Até ${product.delivery_radius_km}km` : "Entrega"
                  : "Sem entrega"}
              </span>
            </div>
          </div>
          {product.delivery_notes && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{product.delivery_notes}</p>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Descrição</p>
            <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>

      {/* Fixed bottom actions */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 pt-3 max-w-lg mx-auto"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-12 px-3 rounded-xl gap-1.5 font-bold select-none"
            onClick={() => setFreightOpen(true)}
          >
            <Calculator className="h-4 w-4" />
            Frete
          </Button>
          <Button
            variant="outline"
            className="h-12 px-3 rounded-xl gap-1.5 font-bold select-none"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full h-12 rounded-xl gap-2 font-bold bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
          )}
        </div>
        {product.supplier_id && (
          <button
            onClick={() => navigate(`/minha-loja?supplier=${product.supplier_id}`)}
            className="w-full mt-2 h-10 rounded-xl text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2 select-none"
          >
            <Store className="h-4 w-4" /> Ver loja
          </button>
        )}
      </div>

      <FreightCalculator open={freightOpen} onClose={() => setFreightOpen(false)} input={inputForCalc} />
    </>
  );
}