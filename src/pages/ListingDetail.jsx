import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, MapPin, Store, Loader2, ChevronRight, Flag, Share2, Clock, Pencil, ChevronLeft } from "lucide-react";
import { formatListingPrice } from "../utils/listingPrice";
import { toSlug } from "./SlugRedirect";
import { PROD_DOMAIN } from "../utils/domain";
import { toast } from "sonner";
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
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [renewing, setRenewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setPhotoIndex(0);
    base44.entities.Listing.filter({ id }).then((data) => {
      setListing(data[0] || null);
      setLoading(false);
    }).catch(() => {
      setError(true);
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

  if (error || (!loading && !listing)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <span className="text-5xl mb-4">😕</span>
        <h2 className="text-lg font-bold text-foreground mb-2">Não foi possível carregar este anúncio</h2>
        <p className="text-sm text-muted-foreground mb-6">O anúncio pode ter sido removido ou houve um erro de conexão.</p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={() => { setLoading(true); setError(false); base44.entities.Listing.filter({ id }).then(data => { setListing(data[0] || null); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }} className="rounded-xl">Tentar novamente</Button>
          <Button onClick={() => navigate("/meus-anuncios")} variant="outline" className="rounded-xl">Voltar para meus anúncios</Button>
          <Button onClick={() => navigate("/marketplace")} variant="ghost" className="rounded-xl">Ir ao Marketplace</Button>
        </div>
      </div>
    );
  }

  const slug = toSlug(listing.title, listing.city);
  const shareUrl = `${PROD_DOMAIN}/p/${slug}`;

  const handleShare = async () => {
    const price = `R$ ${listing.price?.toFixed(2).replace(".", ",")}`;
    const location = [listing.city, listing.region].filter(Boolean).join(" - ");
    const text = `🌾 VENDA - ${listing.title}\n💰 ${price}\n📍 ${location}\n\nVer anúncio:\n${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    await navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

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

      {/* Photo gallery */}
      {(() => {
        const allPhotos = [
          ...(listing.image_url ? [listing.image_url] : []),
          ...(listing.photos || []),
        ];
        const currentPhoto = allPhotos[photoIndex];
        return (
          <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden relative">
            {currentPhoto
              ? <img src={currentPhoto} alt={listing.title} className="w-full h-full object-contain" />
              : <span className="text-7xl">{categoryEmoji[listing.category] || "📦"}</span>}
            {allPhotos.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center select-none">
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <button onClick={() => setPhotoIndex(i => (i + 1) % allPhotos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 flex items-center justify-center select-none">
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allPhotos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)}
                      className={`h-1.5 rounded-full transition-all select-none ${i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}

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
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-extrabold text-foreground leading-tight flex-1">{listing.title}</h1>
          </div>
          {/* Freshness + status */}
          <div className="flex items-center gap-2 mb-2">
            {listing.updated_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <Clock className="h-3.5 w-3.5" />
                {(() => {
                  const diff = Date.now() - new Date(listing.updated_date).getTime();
                  const hrs = Math.floor(diff / 3600000);
                  const days = Math.floor(hrs / 24);
                  if (hrs < 1) return "publicado agora";
                  if (hrs < 24) return `atualizado há ${hrs}h`;
                  if (days === 1) return "atualizado ontem";
                  return `atualizado há ${days} dias`;
                })()}
              </span>
            )}
            {listing.status === "active" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Anúncio ativo</span>
            )}
            {listing.status === "paused" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏸ Pausado</span>
            )}
            {listing.status === "sold" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Vendido</span>
            )}
          </div>
          <p className="text-3xl font-extrabold text-green-600 leading-snug">{formatListingPrice(listing)}</p>
        </div>

        {/* Renewal banner for owner */}
        {user && listing.created_by === user.email && (() => {
          const daysSinceUpdate = Math.floor((Date.now() - new Date(listing.updated_date || listing.created_date).getTime()) / 86400000);
          if (daysSinceUpdate < 30) return null;
          return (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-1">⏰ Seu anúncio está há {daysSinceUpdate} dias sem atualização</p>
              <p className="text-xs text-amber-700 mb-3">Renove para manter visibilidade e mostrar que ainda está disponível.</p>
              <button
                disabled={renewing}
                onClick={async () => {
                  setRenewing(true);
                  await base44.entities.Listing.update(listing.id, { status: "active" });
                  setListing(l => ({ ...l, updated_date: new Date().toISOString() }));
                  setRenewing(false);
                }}
                className="h-9 px-4 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 select-none disabled:opacity-60"
              >
                {renewing ? "Renovando..." : "✅ Renovar anúncio"}
              </button>
            </div>
          );
        })()}

        {/* Description */}
        {listing.description && (
          <div>
            <h2 className="text-sm font-bold text-foreground mb-1.5">Descrição</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Property info */}
        {listing.category === "Propriedades rurais" && (listing.prop_type || listing.prop_area) && (
          <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
            <h2 className="text-sm font-bold text-foreground mb-2">🏡 Dados do imóvel</h2>
            {listing.prop_type && <p className="text-sm text-foreground font-semibold">{listing.prop_type}</p>}
            {listing.prop_area && <p className="text-sm text-muted-foreground">{listing.prop_area} {listing.prop_area_unit}</p>}
            {listing.prop_purpose && <p className="text-sm text-muted-foreground capitalize">Finalidade: {listing.prop_purpose}</p>}
            {listing.prop_aptitude && <p className="text-sm text-muted-foreground">Aptidão: {listing.prop_aptitude}</p>}
            <div className="flex gap-2 mt-1">
              {listing.prop_has_water && <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">💧 Água</span>}
              {listing.prop_has_power && <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">⚡ Energia</span>}
            </div>
            {listing.prop_infrastructure && <p className="text-sm text-muted-foreground">{listing.prop_infrastructure}</p>}
            {listing.prop_distance_km && <p className="text-sm text-muted-foreground">{listing.prop_distance_km} km da cidade</p>}
          </div>
        )}

        {/* Availability & Delivery */}
        {(listing.availability_status || listing.delivery_type || listing.freight_info) && (
          <div className="bg-muted/50 rounded-2xl p-4">
            <h2 className="text-sm font-bold text-foreground mb-3">Disponibilidade e entrega</h2>
            <div className="flex flex-wrap gap-2">
              {listing.availability_status && (
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  listing.availability_status === "Disponível" ? "bg-green-100 text-green-700" :
                  listing.availability_status === "Sob encomenda" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-600"
                }`}>📦 {listing.availability_status}</span>
              )}
              {listing.delivery_type && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">🚚 {listing.delivery_type}</span>
              )}
              {listing.freight_info && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">{listing.freight_info}</span>
              )}
            </div>
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

        {/* Owner actions */}
        {user && listing.created_by === user.email && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/editar-anuncio/${listing.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-primary text-primary text-sm font-bold select-none"
            >
              <Pencil className="h-4 w-4" /> Editar anúncio
            </button>
            <button
              onClick={() => navigate(`/editar-anuncio/${listing.id}?tab=photos`)}
              className="h-10 px-4 rounded-xl border border-border text-foreground text-sm font-bold flex items-center gap-1.5 select-none"
            >
              📷 Fotos
            </button>
          </div>
        )}

        {/* Report listing */}
        <div className="flex items-center justify-between bg-muted/50 border border-border rounded-2xl px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Algo errado com este anúncio?</p>
            <p className="text-[11px] text-muted-foreground">Anúncios falsos podem ser removidos.</p>
          </div>
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-bold select-none shrink-0"
          >
            <Flag className="h-3.5 w-3.5" /> Reportar
          </button>
        </div>

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
        <Button
          variant="outline"
          className="h-12 px-4 rounded-xl font-bold gap-2 select-none"
          onClick={handleShare}
        >
          <Share2 className="h-5 w-5" /> Compartilhar
        </Button>
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