import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";
import { slugify } from "../utils/slugify";
import { PROD_DOMAIN } from "../utils/domain";
import {
  MessageCircle, MapPin, Share2, Store, Leaf, Handshake, BadgeCheck, Calendar,
} from "lucide-react";
import { toast } from "sonner";

const typeIcon = { Produtor: Leaf, Loja: Store, Cooperativa: Handshake };
const typeColor = {
  Produtor: "bg-green-100 text-green-700",
  Loja: "bg-blue-100 text-blue-700",
  Cooperativa: "bg-amber-100 text-amber-700",
};

export default function PublicSellerPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const allProfiles = await base44.entities.SellerProfile.list();
      const match = allProfiles.find(p => slugify(p.seller_name) === slug);
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const allListings = await base44.entities.Listing.filter(
        { seller_name: match.seller_name, status: "active" }, "-created_date"
      );
      setProfile(match);
      setListings(allListings);
      setLoading(false);
    }
    load();
  }, [slug]);

  const profileUrl = `${PROD_DOMAIN}/produtor/${slug}`;

  const handleShare = async () => {
    if (!profile) return;
    const text = `👨‍🌾 ${profile.seller_name}\n📍 ${[profile.city, profile.region].filter(Boolean).join(" - ")}\n🌾 Veja meus anúncios no TerraPonte:\n${profileUrl}`;
    try {
      if (navigator.share) { await navigator.share({ title: profile.seller_name, text, url: profileUrl }); return; }
    } catch {}
    await navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  if (loading) return (
    <div className="px-4 pt-6 pb-10">
      <div className="bg-card border border-border rounded-2xl p-5 mb-5 animate-pulse space-y-3">
        <div className="flex gap-4">
          <div className="h-24 w-24 rounded-2xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-5 w-3/4 bg-muted rounded-full" />
            <div className="h-4 w-1/2 bg-muted rounded-full" />
            <div className="h-4 w-2/3 bg-muted rounded-full" />
          </div>
        </div>
        <div className="h-10 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <span className="text-5xl mb-4">😕</span>
      <h2 className="text-lg font-bold text-foreground mb-2">Perfil não encontrado</h2>
      <Button variant="outline" className="rounded-xl mt-3" onClick={() => navigate("/marketplace")}>
        Ver marketplace
      </Button>
    </div>
  );

  const TypeIcon = typeIcon[profile.seller_type] || Store;
  const waUrl = profile.whatsapp
    ? `https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}?text=Olá ${profile.seller_name}! Vi seu perfil no TerraPonte.`
    : null;
  const joinDate = profile.created_date
    ? new Date(profile.created_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="pb-10">
      {/* Brand bar */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 select-none">
          <span className="text-lg">🌾</span>
          <span className="text-sm font-extrabold text-primary-foreground">TerraPonte</span>
        </button>
        <span className="text-xs text-primary-foreground/70 font-medium">Mercado rural digital</span>
      </div>

      <div className="px-4 pt-5">
        {/* Hero card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.photo_url
                ? <img src={profile.photo_url} alt={profile.seller_name} className="w-full h-full object-cover" />
                : <span className="text-4xl font-extrabold text-primary">{profile.seller_name.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-foreground leading-tight mb-1.5">{profile.seller_name}</h1>
              {profile.seller_type && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-1.5 ${typeColor[profile.seller_type]}`}>
                  <TypeIcon className="h-3.5 w-3.5" />
                  {profile.seller_type}
                </div>
              )}
              {profile.badge && (
                <div className="inline-flex items-center gap-1 ml-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> {profile.badge}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{[profile.city, profile.region].filter(Boolean).join(", ")}</span>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.bio}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Store className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <span>{listings.length} anúncio{listings.length !== 1 ? "s" : ""} ativo{listings.length !== 1 ? "s" : ""}</span>
            {joinDate && (
              <>
                <span className="text-border">·</span>
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                <span>Desde {joinDate}</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
            )}
            <Button variant="outline" className="h-11 px-4 rounded-xl font-bold gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <>
            <h2 className="text-base font-extrabold text-foreground mb-3">Anúncios de {profile.seller_name}</h2>
            <div className="grid grid-cols-2 gap-3">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </>
        )}

        {listings.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <span className="text-4xl mb-3 block">🌾</span>
            <p className="text-sm text-muted-foreground font-medium">Nenhum anúncio ativo no momento</p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">Você também pode anunciar no TerraPonte</p>
          <button onClick={() => navigate("/vender")} className="text-xs font-bold text-primary underline-offset-2 underline select-none">
            Criar meu anúncio grátis
          </button>
        </div>
      </div>
    </div>
  );
}