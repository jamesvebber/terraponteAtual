import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin } from "lucide-react";

export default function RecentListings() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    base44.entities.ProductListing.list("-created_date", 6).then(setListings);
  }, []);

  if (listings.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">Últimos anúncios</h2>
        <span className="text-[11px] text-green-600 font-bold">● Ao vivo</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {listings.map((item) => (
          <a
            key={item.id}
            href={
              item.whatsapp
                ? `https://wa.me/55${item.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o anúncio "${item.product_name}" no Mercado Rural.`
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-40 bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.product_name}
                className="w-full h-24 object-cover"
              />
            ) : (
              <div className="w-full h-24 bg-muted flex items-center justify-center text-3xl">
                {item.category === "Gado" ? "🐂" : item.category === "Leite" ? "🥛" : item.category === "Ovos" ? "🥚" : item.category === "Frutas" ? "🍊" : "🚜"}
              </div>
            )}
            <div className="p-2.5">
              <p className="font-bold text-foreground text-xs leading-tight truncate">{item.product_name}</p>
              <p className="text-green-600 font-extrabold text-sm mt-0.5">
                R$ {item.price?.toFixed(2).replace(".", ",")}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground text-[10px] truncate">{item.city}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}