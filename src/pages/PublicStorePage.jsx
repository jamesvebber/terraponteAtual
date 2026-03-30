import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import InsumoProductCard from "../components/InsumoProductCard";
import SkeletonCard from "../components/SkeletonCard";
import { slugify } from "../utils/slugify";
import { PROD_DOMAIN } from "../utils/domain";
import { setPageMeta, resetPageMeta } from "../utils/pageMeta";
import {
  MessageCircle, MapPin, Share2, Store, Truck, ShoppingBag, Phone,
  Shield, BadgeCheck, ShieldCheck, Clock, Flag,
} from "lucide-react";
import MediaGallery from "../components/MediaGallery";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { AnnouncementsFeed } from "../components/StoreAnnouncements";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const BADGE_CONFIG = {
  nao_verificada: { label: "Não verificada", color: "bg-gray-100 text-gray-500", icon: Shield },
  em_analise: { label: "Em análise", color: "bg-blue-100 text-blue-700", icon: Clock },
  verificada: { label: "Loja verificada", color: "bg-green-100 text-green-700", icon: BadgeCheck },
  representante_oficial: { label: "Representante oficial", color: "bg-amber-100 text-amber-700", icon: ShieldCheck },
};

const REPORT_REASONS = ["Loja falsa", "Produto não entregue", "Informações incorretas", "Comportamento suspeito", "Outro"];

export default function PublicStorePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  useEffect(() => {
    async function load() {
      const allProfiles = await base44.entities.SupplierProfile.list();
      const normalizedSlug = slug.trim().toLowerCase();
      const match = allProfiles.find(p => slugify((p.store_name || "").trim()) === normalizedSlug);
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      // Fetch all products for this store — filter status client-side to catch null/undefined too
      const prods = await base44.entities.InsumoProduct.filter(
        { supplier_id: match.id }, "-created_date"
      );
      setProfile(match);
      setProducts(prods.filter(p => p.status !== "inactive"));
      setLoading(false);

      const loc = [match.city, match.region].filter(Boolean).join(" - ");
      setPageMeta({
        title: match.store_name,
        description: match.description || `${match.supplier_type || "Loja"} em ${loc}. Veja os produtos no TerraPonte.`,
        imageUrl: match.logo_url || null,
        canonicalUrl: `https://terraponte.app/store/${slug}`,
      });
    }
    load();
    return () => resetPageMeta();
  }, [slug]);

  const profileUrl = `https://terraponte.app/store/${slug}`;

  const handleShare = async () => {
    if (!profile) return;
    const loc = [profile.city, profile.region].filter(Boolean).join(" - ");
    const text = `🏪 ${profile.store_name}\n📍 ${loc}\n🌾 Veja nossos produtos no TerraPonte:\n${profileUrl}`;
    try {
      if (navigator.share) { await navigator.share({ title: profile.store_name, text }); return; }
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
      <h2 className="text-lg font-bold text-foreground mb-2">Loja não encontrada</h2>
      <Button variant="outline" className="rounded-xl mt-3" onClick={() => navigate("/insumos")}>
        Ver insumos
      </Button>
    </div>
  );

  const waUrl = profile.whatsapp
    ? `https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}?text=Olá! Vi o perfil de ${profile.store_name} no TerraPonte e tenho interesse.`
    : null;

  const activeProducts = products;
  const bestId = [...activeProducts].sort((a, b) => (a.price || 0) - (b.price || 0))[0]?.id;

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
        {/* Store media gallery */}
        {(() => {
          const isVideoUrl = (url) => /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(url);
          const allUrls = [
            ...(profile.logo_url ? [profile.logo_url] : []),
            ...((profile.store_media || [])),
          ];
          if (allUrls.length > 0) {
            const media = allUrls.map(url => ({ url, type: isVideoUrl(url) ? 'video' : 'image' }));
            return <div className="mb-5"><MediaGallery media={media} /></div>;
          }
          return null;
        })()}

        {/* Hero card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {profile.logo_url
              ? <img src={profile.logo_url} alt={profile.store_name} className="w-full h-full object-cover" />
              : <Store className="h-10 w-10 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-extrabold text-foreground leading-tight">{profile.store_name}</h1>
              {(profile.verification_status === "verificada" || profile.verification_status === "representante_oficial") && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                </span>
              )}
            </div>
            {profile.supplier_type && (
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full mb-1.5">
                {profile.supplier_type}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{[profile.city, profile.region].filter(Boolean).join(", ")}</span>
            </div>
            {profile.whatsapp && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{profile.whatsapp}</span>
              </div>
            )}
          </div>
        </div>

        {profile.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.description}</p>
        )}

          {/* Delivery / pickup badges */}
          <div className="flex gap-2 mb-4">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${profile.pickup_available !== false ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground/60"}`}>
              <ShoppingBag className="h-3.5 w-3.5" />
              {profile.pickup_available !== false ? "Retirada disponível" : "Sem retirada"}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${profile.delivery_available ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground/60"}`}>
              <Truck className="h-3.5 w-3.5" />
              {profile.delivery_available
                ? profile.delivery_radius_km ? `Entrega até ${profile.delivery_radius_km}km` : "Entrega disponível"
                : "Sem entrega"}
            </div>
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

        {/* Products */}
        {activeProducts.length > 0 && (
          <>
            <h2 className="text-base font-extrabold text-foreground mb-3">
              Produtos de {profile.store_name}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {activeProducts.map(p => (
                <InsumoProductCard key={p.id} product={p} isBest={p.id === bestId} isVerified={profile.verification_status === "verificada" || profile.verification_status === "representante_oficial"} />
              ))}
            </div>
          </>
        )}

        {activeProducts.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <span className="text-4xl mb-3 block">🌿</span>
            <p className="text-sm text-muted-foreground font-medium">Nenhum produto ativo no momento</p>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <Button className="mt-4 rounded-xl gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <MessageCircle className="h-4 w-4" /> Consultar pelo WhatsApp
                </Button>
              </a>
            )}
          </div>
        )}

        <AnnouncementsFeed storeId={profile.id} />

        {/* Trust box */}
        {(() => {
          const status = profile.verification_status || "nao_verificada";
          const badge = BADGE_CONFIG[status] || BADGE_CONFIG.nao_verificada;
          const BadgeIcon = badge.icon;
          const joinDate = profile.created_date
            ? new Date(profile.created_date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
            : null;
          return (
            <div className="mt-5 bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">Confiança e segurança</p>

              {status === "nao_verificada" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-700 font-semibold">⚠️ Confira os dados da loja antes de realizar pagamento.</p>
                </div>
              )}

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${badge.color}`}>
                <BadgeIcon className="h-3.5 w-3.5" />
                {badge.label}
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {profile.whatsapp && <p>📱 WhatsApp: <span className="font-semibold text-foreground">{profile.whatsapp}</span></p>}
                {(profile.city || profile.region) && <p>📍 <span className="font-semibold text-foreground">{[profile.city, profile.region].filter(Boolean).join(", ")}</span></p>}
                {joinDate && <p>📅 Membro desde <span className="font-semibold text-foreground">{joinDate}</span></p>}
              </div>

              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-red-500 font-semibold select-none mt-1"
              >
                <Flag className="h-3.5 w-3.5" /> Reportar loja
              </button>
            </div>
          );
        })()}

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">Cadastre sua loja gratuitamente no TerraPonte</p>
          <button onClick={() => navigate("/minha-loja")} className="text-xs font-bold text-primary underline-offset-2 underline select-none">
            Criar minha loja grátis
          </button>
        </div>
      </div>

      {/* Report drawer */}
      <Drawer open={reportOpen} onOpenChange={v => { setReportOpen(v); if (!v) { setReportReason(""); setReportDetails(""); setReportDone(false); } }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-500" /> Reportar loja
            </DrawerTitle>
          </DrawerHeader>
          {reportDone ? (
            <div className="px-4 py-8 flex flex-col items-center text-center">
              <BadgeCheck className="h-12 w-12 text-green-600 mb-3" />
              <p className="font-bold text-foreground mb-1">Reporte enviado</p>
              <p className="text-sm text-muted-foreground">Nossa equipe vai analisar em breve.</p>
            </div>
          ) : (
            <div className="px-4 space-y-3 pb-2">
              <p className="text-sm text-muted-foreground">Selecione o motivo:</p>
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReportReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border transition-colors select-none ${
                    reportReason === r ? "bg-red-50 border-red-400 text-red-700" : "bg-card border-border text-foreground"
                  }`}>{r}</button>
              ))}
            </div>
          )}
          <DrawerFooter>
            {reportDone ? (
              <Button className="w-full rounded-xl" onClick={() => setReportOpen(false)}>Fechar</Button>
            ) : (
              <>
                <Button className="w-full rounded-xl bg-red-600 hover:bg-red-700" disabled={!reportReason || reporting}
                  onClick={async () => {
                    setReporting(true);
                    await base44.entities.StoreReport.create({
                      store_id: profile.id,
                      store_name: profile.store_name,
                      reason: reportReason,
                      details: reportDetails,
                    });
                    setReporting(false);
                    setReportDone(true);
                  }}>
                  {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar reporte"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
                </DrawerClose>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}