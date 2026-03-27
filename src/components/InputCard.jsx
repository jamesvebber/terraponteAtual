import { MapPin, Truck, Store, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InputCard({ input }) {
  const whatsappUrl = input.whatsapp
    ? `https://wa.me/55${input.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o anúncio do produto "${input.product_name}" no Mercado Rural e gostaria de mais informações.`
    : null;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-foreground text-base">{input.product_name}</h3>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            {input.category}
          </span>
        </div>
        <p className="text-xl font-extrabold text-primary whitespace-nowrap">
          R$ {input.price?.toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="mt-3 space-y-1.5">
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
        {input.freight_cost != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Frete: R$ {input.freight_cost.toFixed(2).replace(".", ",")}</span>
          </div>
        )}
      </div>

      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block mt-4">
          <Button className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
            <MessageCircle className="h-5 w-5" />
            Chamar no WhatsApp
          </Button>
        </a>
      )}
    </div>
  );
}