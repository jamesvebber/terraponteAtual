import { MapPin, MessageCircle, Store, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const categoryEmoji = {
  "Alimentos da roça": "🍯",
  "Laticínios": "🧀",
  "Gado e animais": "🐂",
  "Hortifruti": "🥬",
  "Máquinas e ferramentas": "🚜",
  "Artesanato rural": "🪵",
  "Serviços rurais": "🔧",
  "Outros": "📦",
};

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const waUrl = listing.whatsapp
    ? `https://wa.me/55${listing.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o anúncio "${listing.title}" no Mercado Rural e tenho interesse.`
    : null;

  const tag = listing.featured ? "⭐ Destaque" : listing.seller_type === "Produtor" ? "🌱 Produtor local" : "🏪 Loja";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div
        className="w-full h-40 bg-muted flex items-center justify-center cursor-pointer"
        onClick={() => navigate(`/marketplace/${listing.id}`)}
      >
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{categoryEmoji[listing.category] || "📦"}</span>
        )}
      </div>

      <div className="p-3">
        {/* Tag */}
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-2">
          {tag}
        </span>

        {/* Title & price */}
        <h3
          className="font-bold text-foreground text-sm leading-tight mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-2"
          onClick={() => navigate(`/marketplace/${listing.id}`)}
        >
          {listing.title}
        </h3>
        <p className="text-green-600 font-extrabold text-lg mb-2">
          R$ {listing.price?.toFixed(2).replace(".", ",")}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
          <Store className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.seller_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.city}{listing.region ? `, ${listing.region}` : ""}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-9 text-xs font-bold rounded-xl"
            onClick={() => navigate(`/marketplace/${listing.id}`)}
          >
            Ver anúncio
          </Button>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-green-500 text-green-600 hover:bg-green-50">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}