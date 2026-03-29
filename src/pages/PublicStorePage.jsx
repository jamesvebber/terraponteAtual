import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import InsumoProductCard from "../components/InsumoProductCard";
import SkeletonCard from "../components/SkeletonCard";
import { slugify } from "../utils/slugify";
import {
  MessageCircle, MapPin, Share2, Store, Truck, ShoppingBag, Phone,
} from "lucide-react";
import { toast } from "sonner";

export default function PublicStorePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const allProfiles = await base44.entities.SupplierProfile.list();
      const match = allProfiles.find(p => slugify(p.store_name) === slug);
      if (!match) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const prods = await base44.entities.InsumoProduct.filter(
        { supplier_id: match.id, status: "active" }, "-created_date"
      );
      setProfile(match);
      setProducts(prods);
      setLoading(false);
    }
    load();
  }, [slug]);

  const profileUrl = `${window.location.origin}/loja/${slug}`;

  const handleShare = async () => {
    if (!profile) return;
    const text = `🏪 ${profile.store_name}\n📍 ${[profile.city, profile.region].filter(Boolean).join(" - ")}\n🌾 Veja nossos produtos e insumos no TerraPonte:\n${profileUrl}`;
    try {
      if (navigator.share) { await navigator.share({ title: profile.store_name, text, url: profileUrl }); return; }
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

  const activeProducts = products.filter(p => p.status === "active");
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
        {/* Hero card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.logo_url
                ? <img src={profile.logo_url} alt={profile.store_name} className="w-full h-full object-cover" />
                : <Store className="h-10 w-10 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-foreground leading-tight mb-1">{profile.store_name}</h1>
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
                <InsumoProductCard key={p.id} product={p} isBest={p.id === bestId} />
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

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">Cadastre sua loja gratuitamente no TerraPonte</p>
          <button onClick={() => navigate("/minha-loja")} className="text-xs font-bold text-primary underline-offset-2 underline select-none">
            Criar minha loja grátis
          </button>
        </div>
      </div>
    </div>
  );
}