import { MapPin, Truck, Store, MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InputCard({ input, isBest }) {
  const custoFinal = (input.price || 0) + (input.freight_cost || 0);

  const whatsappUrl = input.whatsapp
    ? `https://wa.me/55${input.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o anúncio do produto "${input.product_name}" no Mercado Rural e gostaria de mais informações.`
    : null;

  return (
    <div
      className={cn(
        "bg-card rounded-2xl p-4 shadow-sm border transition-all duration-200",
        isBest
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border"
      )}
    >
      {/* Best badge */}
      {isBest && (
        <div className="flex items-center gap-1.5 mb-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full w-fit">
          <Star className="h-3.5 w-3.5 fill-current" />
          🔥 Melhor opção
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-2">
          <h3 className="font-bold text-foreground text-base leading-tight">{input.product_name}</h3>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
            {input.category}
          </span>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="bg-muted/60 rounded-xl p-3 space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Preço</span>
          <span className="font-semibold text-foreground">R$ {input.price?.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            <span>Frete</span>
          </div>
          <span className="font-semibold text-foreground">
            {input.freight_cost != null ? `R$ ${input.freight_cost.toFixed(2).replace(".", ",")}` : "—"}
          </span>
        </div>
        <div className="border-t border-border/60 pt-1.5 flex items-center justify-between">
          <span className="font-bold text-foreground text-sm">Total</span>
          <span
            className={cn(
              "text-lg font-extrabold",
              isBest ? "text-primary" : "text-foreground"
            )}
          >
            R$ {custoFinal.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Location & supplier */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="h-4 w-4 shrink-0" />
          <span className="truncate">{input.supplier}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            {input.city}{input.state ? `, ${input.state}` : ""}
            {input.distance_km ? ` · ${input.distance_km} km` : ""}
          </span>
        </div>
      </div>

      {/* WhatsApp */}
      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full h-11 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
            <MessageCircle className="h-4 w-4" />
            Chamar no WhatsApp
          </Button>
        </a>
      )}
    </div>
  );
}