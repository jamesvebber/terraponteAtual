import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ListingCard from "../components/ListingCard";
import { Button } from "@/components/ui/button";
import SkeletonCard from "../components/SkeletonCard";
import {
  ArrowLeft, MessageCircle, MapPin, Store, Calendar, BadgeCheck,
  Leaf, Building2, Handshake, Flag, Share2,
} from "lucide-react";
import { slugify } from "../utils/slugify";
import { PROD_DOMAIN } from "../utils/domain";
import { toast } from "sonner";
import ReportSheet from "../components/ReportSheet";

const typeIcon = { Produtor: Leaf, Loja: Building2, Cooperativa: Handshake };
const typeColor = { Produtor: "text-green-600 bg-green-50", Loja: "text-blue-600 bg-blue-50", Cooperativa: "text-amber-600 bg-amber-50" };
const badgeColor = {
  "Produtor local": "bg-green-100 text-green-700",
  "Loja parceira": "bg-blue-100 text-blue-700",
  "Verificado": "bg-amber-100 text-amber-700",
};

const categoryFilters = ["Todos", "Alimentos da roça", "Laticínios", "Gado e animais", "Hortifruti", "Máquinas e ferramentas", "Artesanato rural", "Serviços rurais", "Outros"];

export default function SellerProfile() {
  const { sellerName } = useParams();
  const navigate = useNavigate();
  const name = decodeURIComponent(sellerName);

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Todos");
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [profiles, allListings] = await Promise.all([
        base44.entities.SellerProfile.filter({ seller_name: name }),
        base44.entities.Listing.filter({ seller_name: name, status: "active" }, "-created_date"),
      ]);
      setProfile(profiles[0] || null);
      setListings(allListings);
      setLoading(false);
    }
    load();
  }, [name]);

  if (loading) {
    return (
      <div className="pb-8">
        <div className="px-4 pt-5 pb-3">
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="mx-4 bg-card border border-border rounded-2xl p-5 mb-4 animate-pulse space-y-3">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-2xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-5 w-3/4 bg-muted rounded-full" />
              <div className="h-4 w-1/2 bg-muted rounded-full" />
            </div>
          </div>
          <div className="h-3 w-full bg-muted rounded-full" />
          <div className="h-3 w-5/6 bg-muted rounded-full" />
          <div className="h-11 w-full bg-muted rounded-xl" />
        </div>
        <div className="px-4 grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const filtered = category === "Todos" ? listings : listings.filter(l => l.category === category);
  const TypeIcon = typeIcon[profile?.seller_type] || Store;
  const waUrl = profile?.whatsapp
    ? `https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}?text=Olá ${name}! Vi seu perfil no TerraPonte.`
    : null;

  const joinDate = profile?.created_date
    ? new Date(profile.created_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="pb-8">
      {/* Back */}
      <div className="px-4 pt-5 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground font-semibold select-none"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      {/* Hero card */}
      <div className="mx-4 bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-primary">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-foreground leading-tight">{name}</h1>

            {/* Type badge */}
            {profile?.seller_type && (
              <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${typeColor[profile.seller_type]}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {profile.seller_type}
              </div>
            )}

            {/* Trust badge */}
            {profile?.badge && (
              <div className={`inline-flex items-center gap-1 mt-1.5 ml-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor[profile.badge]}`}>
                <BadgeCheck className="h-3.5 w-3.5" />
                {profile.badge}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.bio}</p>
        )}

        {/* Meta info */}
        <div className="space-y-1.5 mb-4">
          {(profile?.city || profile?.region) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <span>{[profile.city, profile.region].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <span>Membro desde {joinDate}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <span>{listings.length} anúncio{listings.length !== 1 ? "s" : ""} ativo{listings.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl font-bold"
            onClick={() => document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver anúncios
          </Button>
        </div>

        {/* Share profile */}
        <button
          onClick={async () => {
            const slug = slugify(name);
            const url = `https://terraponte.app/user/${slug}`;
            const text = `👨\u200d🌾 ${name}\n📍 ${[profile?.city, profile?.region].filter(Boolean).join(" - ")}\n🌾 Veja meus anúncios no TerraPonte:\n${url}`;
            try { if (navigator.share) { await navigator.share({ title: name, text }); return; } } catch {}
            await navigator.clipboard.writeText(text);
            toast.success("Link copiado!");
          }}
          className="flex items-center gap-1.5 text-xs text-primary font-bold py-1 select-none"
        >
          <Share2 className="h-3.5 w-3.5" /> Compartilhar perfil
        </button>

        {/* Report seller */}
        <button
          onClick={() => setReportOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-3 select-none"
        >
          <Flag className="h-3.5 w-3.5" /> Denunciar vendedor
        </button>

        <ReportSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="seller"
          targetId={name}
          targetTitle={name}
        />
      </div>

      {/* Listings */}
      <div id="listings-section" className="px-4">
        <h2 className="text-base font-bold text-foreground mb-3">
          Anúncios de {name}
        </h2>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 scrollbar-hide">
          {categoryFilters.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors select-none ${
                category === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🌾</span>
            <p className="text-sm text-muted-foreground font-medium">Nenhum anúncio encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}