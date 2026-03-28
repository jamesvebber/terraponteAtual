import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, MapPin, Store, Loader2, ChevronRight, Flag } from "lucide-react";
import ReportSheet from "../components/ReportSheet";

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

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Support going back to wherever user came from
  const goBack = () => navigate(-1);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    base44.entities.Listing.filter({ id }).then((data) => {
      setListing(data[0] || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <span className="text-5xl mb-4">😕</span>
        <h2 className="text-lg font-bold text-foreground mb-2">Anúncio não encontrado</h2>
        <Button onClick={() => navigate("/marketplace")} variant="outline" className="rounded-xl">
          Voltar ao Marketplace
        </Button>
      </div>
    );
  }

  const waUrl = listing.whatsapp
    ? `https://wa.me/55${listing.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o anúncio "${listing.title}" no TerraPonte e tenho interesse.`
    : null;

  return (
    <div className="pb-40">
      {/* Back button */}
      <div className="px-4 pt-5 pb-2">
        <button
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground font-semibold select-none"
        >
          <ArrowLeft className="h-4 w-4" /> Marketplace
        </button>
      </div>

      {/* Image */}
      <div className="w-full h-56 bg-muted flex items-center justify-center">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-7xl">{categoryEmoji[listing.category] || "📦"}</span>
        )}
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {listing.featured && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">⭐ Destaque</span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {categoryEmoji[listing.category]} {listing.category}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {listing.seller_type === "Produtor" ? "🌱 Produtor" : "🏪 Loja"}
          </span>
        </div>

        {/* Title & Price */}
        <div>
          <h1 className="text-xl font-extrabold text-foreground leading-tight">{listing.title}</h1>
          <p className="text-3xl font-extrabold text-green-600 mt-2">
            R$ {listing.price?.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Description */}
        {listing.description && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-1.5">Descrição</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Seller info */}
        <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-bold text-foreground mb-2">Informações do vendedor</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4 shrink-0" />
            <span>{listing.seller_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{listing.city}{listing.region ? `, ${listing.region}` : ""}</span>
          </div>
        </div>

        {/* Report listing */}
        <button
          onClick={() => setReportOpen(true)}
          className="w-full flex items-center gap-2 text-xs text-muted-foreground font-medium py-1 select-none"
        >
          <Flag className="h-3.5 w-3.5" /> Denunciar este anúncio
        </button>

        {/* More from seller */}
        <button
          onClick={() => navigate(`/seller/${encodeURIComponent(listing.seller_name)}`)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground select-none"
        >
          <span>Ver perfil de {listing.seller_name}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <ReportSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="listing"
          targetId={listing.id}
          targetTitle={listing.title}
        />
      </div>

      {/* Fixed bottom CTA — sits above BottomNav (h-16 = 4rem) */}
      <div
        className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4 flex gap-3 max-w-lg mx-auto"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
              <MessageCircle className="h-5 w-5" /> Entrar em contato
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}