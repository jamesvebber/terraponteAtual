import { useState } from "react";
import { MapPin, Truck, Store, MessageCircle, Star, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FreightCalculator from "./FreightCalculator";

export default function InputCard({ input, isBest, isNearest, economia }) {
  const [freightOpen, setFreightOpen] = useState(false);

  const whatsappUrl = input.whatsapp
    ? `https://wa.me/55${input.whatsapp.replace(/\D/g, "")}?text=Olá! Tenho interesse no produto "${input.product_name}" no TerraPonte.`
    : null;

  return (
    <>
      <div
        className={cn(
          "bg-card rounded-2xl p-4 shadow-sm border transition-all duration-200",
          isBest ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border"
        )}
      >
        {/* Badges */}
        {(isBest || isNearest) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {isBest && (
              <div className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                <Star className="h-3.5 w-3.5 fill-current" />
                🔥 Melhor preço
              </div>
            )}
            {isNearest && !isBest && (
              <div className="flex items-center gap-1.5 bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                📍 Mais próximo
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-3">
          <h3 className="font-bold text-foreground text-base leading-tight">{input.product_name}</h3>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
            {input.category}
          </span>
        </div>

        {/* Price */}
        <div className="bg-muted/60 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Preço</span>
            <span className="text-2xl font-extrabold text-green-600">
              R$ {input.price?.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {economia > 0 && (
            <p className="text-xs font-bold text-green-600 mt-1.5">
              💰 Economize R$ {economia.toFixed(2).replace(".", ",")} nesta opção
            </p>
          )}
        </div>

        {/* Supplier & location */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium text-foreground">{input.supplier}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{input.city}{input.state ? `, ${input.state}` : ""}</span>
          </div>
        </div>

        {/* Pickup / Delivery badges */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full",
            input.pickup_available !== false
              ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground line-through"
          )}>
            🏪 {input.pickup_available !== false ? "Retirada na loja" : "Sem retirada"}
          </span>
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full",
            input.delivery_available
              ? "bg-blue-100 text-blue-700"
              : "bg-muted text-muted-foreground"
          )}>
            🚚 {input.delivery_available
              ? input.delivery_radius_km ? `Entrega até ${input.delivery_radius_km} km` : "Entrega disponível"
              : "Sem entrega"}
          </span>
        </div>

        {input.delivery_notes && (
          <p className="text-xs text-muted-foreground bg-muted/60 rounded-xl px-3 py-2 mb-3">
            📋 {input.delivery_notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-10 text-sm font-bold rounded-xl gap-1.5"
            variant="outline"
            onClick={() => setFreightOpen(true)}
          >
            <Calculator className="h-4 w-4" />
            {input.delivery_available ? "Calcular frete" : "Ver condições"}
          </Button>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="h-10 w-10 rounded-xl bg-green-600 hover:bg-green-700 text-white p-0">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      <FreightCalculator
        open={freightOpen}
        onClose={() => setFreightOpen(false)}
        input={input}
      />
    </>
  );
}