import { MapPin, MessageCircle, Store, Clock, Tag } from "lucide-react";
import { formatListingPrice } from "../utils/listingPrice";
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

const STATUS_LABEL = {
  active: null,
  paused: { text: "Pausado", color: "bg-yellow-100 text-yellow-700" },
  sold: { text: "Vendido", color: "bg-gray-100 text-gray-500" },
  unavailable: { text: "Indisponível", color: "bg-red-100 text-red-600" },
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const waUrl = listing.whatsapp
    ? `https://wa.me/55${listing.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o anúncio "${listing.title}" no TerraPonte e tenho interesse.`
    : null;

  const tag = listing.featured
    ? "⭐ Destaque"
    : listing.seller_type === "Produtor"
    ? "🌱 Produtor local"
    : "🏪 Loja";

  const statusInfo = listing.status ? STATUS_LABEL[listing.status] : null;
  const freshness = timeAgo(listing.updated_date || listing.created_date);
  const isInactive = listing.status && listing.status !== "active";



  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${isInactive ? "opacity-60" : ""}`}>
      {/* Status badge overlay */}
      {statusInfo && (
        <div className={`absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
          {statusInfo.text}
        </div>
      )}

      {/* Image */}
      <div
        className="w-full aspect-[4/3] bg-muted flex items-center justify-center cursor-pointer overflow-hidden relative"
      onClick={() => navigate(`/marketplace/${listing.id}`)}
    >
      {listing.image_url ? (
        <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-3xl">{categoryEmoji[listing.category] || "📦"}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{listing.category || "Produto"}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        {/* Tag + freshness */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {tag}
          </span>
          {freshness && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
              <Clock className="h-2.5 w-2.5" />{freshness}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-bold text-foreground text-sm leading-snug mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-2"
          onClick={() => navigate(`/marketplace/${listing.id}`)}
        >
          {listing.title}
        </h3>

        {/* Price */}
        <p className="text-green-600 font-extrabold text-base mb-0.5 leading-snug">{formatListingPrice(listing)}</p>
        {listing.price_per_kg && listing.unit && listing.unit !== "kg" && (
          <p className="text-[10px] text-muted-foreground mb-1">≈ R$ {listing.price_per_kg.toFixed(2).replace(".", ",")}/kg</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-0.5">
          <Store className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.seller_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.city}{listing.region ? `, ${listing.region}` : ""}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-10 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
            onClick={() => navigate(`/marketplace/${listing.id}`)}
          >
            Ver anúncio
          </Button>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-green-500 text-green-600 hover:bg-green-50">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}