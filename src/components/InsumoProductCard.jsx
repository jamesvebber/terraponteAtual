import { useState } from "react";
import { MapPin, Store, MessageCircle, Calculator, Package } from "lucide-react";
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

  // Shape the product to be compatible with FreightCalculator
  const inputForCalc = {
    ...product,
    supplier: product.supplier_name,
    state: product.region,
    product_name: product.product_name,
    pickup_available: product.pickup_available !== false,
    delivery_available: !!product.delivery_available,
  };

  const waUrl = product.whatsapp
    ? `https://wa.me/55${product.whatsapp.replace(/\D/g, "")}?text=Olá! Tenho interesse no produto "${product.product_name}" no TerraPonte.`
    : null;

  return (
    <>
      <div className={cn(
        "bg-card rounded-2xl overflow-hidden shadow-sm border transition-all",
        isBest ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}>
        {/* Image */}
        <div className="w-full h-36 bg-muted flex items-center justify-center relative">
          {product.image_url
            ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
            : <span className="text-4xl">{categoryEmoji[product.category] || "📦"}</span>
          }
          {isBest && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
              🔥 Melhor preço
            </div>
          )}
          {product.featured && !isBest && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              ⭐ Destaque
            </div>
          )}
          {product.stock_status && product.stock_status !== "Disponível" && (
            <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full ${product.stock_status === "Esgotado" ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
              {product.stock_status}
            </div>
          )}
        </div>

        <div className="p-3">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-1.5 inline-block">
            {product.category}
          </span>
          <h3 className="font-bold text-foreground text-sm leading-tight mb-0.5">{product.product_name}</h3>
          {product.brand && <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>}

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-green-600 font-extrabold text-lg">R$ {product.price?.toFixed(2).replace(".", ",")}</span>
            <span className="text-xs text-muted-foreground">/ {product.unit}</span>
          </div>

          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="h-3 w-3 shrink-0" />
              <span className="truncate font-medium text-foreground">{product.supplier_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{product.city}{product.region ? `, ${product.region}` : ""}</span>
            </div>
          </div>

          {/* Pickup/Delivery badges */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
              product.pickup_available !== false ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground")}>
              🏪 {product.pickup_available !== false ? "Retirada" : "Sem retirada"}
            </span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
              product.delivery_available ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground")}>
              🚚 {product.delivery_available ? "Entrega" : "Sem entrega"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs gap-1 h-9" onClick={() => setFreightOpen(true)}>
              <Calculator className="h-3.5 w-3.5" />
              {product.delivery_available ? "Calcular frete" : "Ver condições"}
            </Button>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="h-9 w-9 rounded-xl bg-green-600 hover:bg-green-700 text-white p-0">
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