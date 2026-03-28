import { useState } from "react";
import { MapPin, Store, MessageCircle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FreightCalculator from "./FreightCalculator";

const categoryEmoji = {
  "Ração": "🌾", "Sal mineral": "🧂", "Adubo": "🌱", "Sementes": "🌻",
  "Defensivos": "🧪", "Medicamentos veterinários": "💊", "Ferramentas": "🔧",
  "Equipamentos": "⚙️", "Outros": "📦",
};

export default function InsumoProductCard({ product, isBest }) {
  const [freightOpen, setFreightOpen] = useState(false);

  const inputForCalc = {
    ...product,
    supplier: product.supplier_name,
    state: product.region,
    pickup_available: product.pickup_available !== false,
    delivery_available: !!product.delivery_available,
  };

  const waUrl = product.whatsapp
    ? `https://wa.me/55${product.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o produto "${product.product_name}" no TerraPonte e tenho interesse.`
    : null;

  const stockColor =
    product.stock_status === "Esgotado" ? "bg-red-100 text-red-600" :
    product.stock_status === "Sob encomenda" ? "bg-amber-100 text-amber-700" :
    "bg-green-100 text-green-700";

  return (
    <>
      <div className={cn(
        "bg-card rounded-2xl overflow-hidden shadow-sm border flex flex-col",
        isBest ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}>
        {/* Image */}
        <div className="relative w-full h-32 bg-muted flex items-center justify-center shrink-0">
          {product.image_url
            ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
            : <span className="text-4xl">{categoryEmoji[product.category] || "📦"}</span>}

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isBest && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                🔥 Menor preço
              </span>
            )}
            {product.featured && !isBest && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ⭐ Destaque
              </span>
            )}
          </div>

          {product.stock_status && product.stock_status !== "Disponível" && (
            <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${stockColor}`}>
              {product.stock_status}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col flex-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-1.5 self-start">
            {product.category}
          </span>
          <h3 className="font-bold text-foreground text-sm leading-snug mb-0.5 line-clamp-2">{product.product_name}</h3>
          {product.brand && <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>}

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-green-600 font-extrabold text-lg">
              R$ {product.price?.toFixed(2).replace(".", ",")}
            </span>
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>

          {/* Supplier & location */}
          <div className="space-y-0.5 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate font-medium text-foreground">{product.supplier_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.city}{product.region ? `, ${product.region}` : ""}</span>
            </div>
          </div>

          {/* Pickup / delivery */}
          <div className="flex gap-1 mb-3 flex-wrap">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
              product.pickup_available !== false ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground/60")}>
              {product.pickup_available !== false ? "🏪 Retirada" : "Sem retirada"}
            </span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
              product.delivery_available ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground/60")}>
              {product.delivery_available
                ? product.delivery_radius_km ? `🚚 Até ${product.delivery_radius_km}km` : "🚚 Entrega"
                : "Sem entrega"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs gap-1 h-9"
              onClick={() => setFreightOpen(true)}>
              <Calculator className="h-3.5 w-3.5" />
              {product.delivery_available ? "Calcular frete" : "Ver condições"}
            </Button>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-9 w-9 rounded-xl bg-green-600 hover:bg-green-700 text-white p-0 shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <FreightCalculator open={freightOpen} onClose={() => setFreightOpen(false)} input={inputForCalc} />
    </>
  );
}