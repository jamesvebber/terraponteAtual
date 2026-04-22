import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Loader2, PlusCircle, Pencil, Trash2, EyeOff, Eye, CheckCircle2,
  Image, ArrowLeft, Package, Shield, Star, Crown, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatListingPrice } from "../utils/listingPrice";

const STATUS_COLOR = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  sold: "bg-gray-100 text-gray-500",
  pending_review: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  expirado: "bg-red-100 text-red-700",
};
const STATUS_LABEL = { active: "Ativo", paused: "Pausado", sold: "Vendido", pending_review: "Em análise", rejected: "Rejeitado", expirado: "Expirado" };

const AD_TYPE_COLORS = {
  bronze: { bg: "bg-gray-100", text: "text-gray-700", label: "🥉 Bronze" },
  prata: { bg: "bg-blue-100", text: "text-blue-700", label: "🥈 Prata" },
  ouro: { bg: "bg-amber-100", text: "text-amber-700", label: "🥇 Ouro" },
};

const categoryEmoji = {
  "Alimentos da roça": "🍯", "Laticínios": "🧀", "Gado e animais": "🐂",
  "Hortifruti": "🥬", "Máquinas e ferramentas": "🚜", "Artesanato rural": "🪵",
  "Serviços rurais": "🔧", "Carnes e aves": "🥩", "Propriedades rurais": "🏡", "Outros": "📦",
};

export default function MeusAnuncios() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.email) return;
    const data = await base44.entities.Listing.filter({ created_by: user.email }, "-created_date");
    setListings(data);
    setLoading(false);
  }, [user?.email]);

  useEffect(() => { if (!isLoadingAuth) load(); }, [isLoadingAuth, load]);

  const setStatus = async (id, status) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await base44.entities.Listing.update(id, { status });
    toast.success("Status atualizado.");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este anúncio?")) return;
    setListings(prev => prev.filter(l => l.id !== id));
    await base44.entities.Listing.delete(id);
    toast.success("Anúncio excluído.");
  };

  const handleRepublish = async (id) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('republishAd', {
        listingId: id,
        payOverage: true, // auto trigger redirect if overage happens
        successUrl: window.location.origin + "/meus-anuncios",
        cancelUrl: window.location.href,
      });

      if (response.requirePayment) {
        window.location.href = response.checkoutUrl;
        return;
      }
      
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: "active", ad_expiry: response.listing?.ad_expiry } : l));
      toast.success("Anúncio republicado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao republicar. Verifique os limites da sua franquia.');
    }
    setLoading(false);
  };

  if (isLoadingAuth || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="font-bold text-foreground mb-2">Entre para ver seus anúncios</p>
        <Button className="rounded-xl mt-2" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
          Entrar / Criar conta
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/profile")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">Meus anúncios</h1>
          <p className="text-xs text-muted-foreground">{listings.length} anúncio{listings.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="h-10 rounded-xl gap-1.5 text-sm font-bold" onClick={() => navigate("/vender")}>
          <PlusCircle className="h-4 w-4" /> Novo
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 px-4">
          <span className="text-6xl mb-4 block">🌾</span>
          <p className="text-lg font-bold text-foreground mb-2">Nenhum anúncio ainda</p>
          <p className="text-sm text-muted-foreground mb-6">Publique seu primeiro anúncio e venda pelo WhatsApp.</p>
          <Button className="rounded-xl gap-2" onClick={() => navigate("/vender")}>
            <PlusCircle className="h-4 w-4" /> Criar anúncio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <div key={l.id} className={`bg-card border border-border rounded-2xl overflow-hidden ${l.status !== "active" ? "opacity-70" : ""}`}>
              <div className="flex gap-3 p-3">
                {/* Thumb */}
                <div
                  className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/marketplace/${l.id}`)}
                >
                  {l.image_url
                    ? <img src={l.image_url} alt={l.title} className="w-full h-full object-contain" />
                    : <span className="text-3xl">{categoryEmoji[l.category] || "📦"}</span>}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1 mb-0.5">
                    <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 flex-1 cursor-pointer"
                      onClick={() => navigate(`/marketplace/${l.id}`)}>{l.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1 ${STATUS_COLOR[l.status] || "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABEL[l.status] || l.status}
                    </span>
                  </div>
                  
                  {/* Ad Type Badge */}
                  <div className="flex items-center gap-1.5 mt-1 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      AD_TYPE_COLORS[l.ad_type || 'bronze']?.bg || 'bg-gray-100'
                    } ${
                      AD_TYPE_COLORS[l.ad_type || 'bronze']?.text || 'text-gray-700'
                    }`}>
                      {l.ad_type === 'ouro' ? <Crown className="h-2.5 w-2.5" /> : l.ad_type === 'prata' ? <Star className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
                      {AD_TYPE_COLORS[l.ad_type || 'bronze']?.label || '🥉 Bronze'}
                    </span>
                    {l.ad_expiry && new Date(l.ad_expiry) > new Date() && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        Expira {new Date(l.ad_expiry).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{l.category} · {l.city}</p>
                  <p className="text-green-600 font-extrabold text-base mt-1">{formatListingPrice(l)}</p>
                  {(l.photos?.length > 0) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      <Image className="h-3 w-3 inline mr-0.5" />{(l.photos?.length || 0) + 1} foto{(l.photos?.length || 0) + 1 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => navigate(`/editar-anuncio/${l.id}`)}
                  className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5 shrink-0 select-none"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => navigate(`/editar-anuncio/${l.id}?tab=photos`)}
                  className="h-8 px-3 rounded-lg bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 shrink-0 select-none"
                >
                  <Image className="h-3.5 w-3.5" /> Fotos
                </button>
                {l.status === "active" ? (
                  <button onClick={() => setStatus(l.id, "paused")}
                    className="h-8 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center gap-1.5 shrink-0 select-none">
                    <EyeOff className="h-3.5 w-3.5" /> Pausar
                  </button>
                ) : l.status === "paused" ? (
                  <button onClick={() => setStatus(l.id, "active")}
                    className="h-8 px-3 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1.5 shrink-0 select-none">
                    <Eye className="h-3.5 w-3.5" /> Ativar
                  </button>
                ) : l.status === "expirado" ? (
                  <button onClick={() => handleRepublish(l.id)}
                    className="h-8 px-3 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1.5 shrink-0 select-none">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Republicar
                  </button>
                ) : null}
                {l.status !== "sold" && (
                  <button onClick={() => setStatus(l.id, "sold")}
                    className="h-8 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center gap-1.5 shrink-0 select-none">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Vendido
                  </button>
                )}
                <button onClick={() => handleDelete(l.id)}
                  className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0 select-none ml-auto">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}