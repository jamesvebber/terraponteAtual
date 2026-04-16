import { useState } from "react";
import { MapPin, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * LocationCapture — captura lat/lng e salva no SellerProfile ou SupplierProfile.
 * Props:
 *   profile        — perfil atual (SellerProfile ou SupplierProfile, pode ser null)
 *   user           — objeto do usuário autenticado
 *   entityName     — "SellerProfile" (padrão) ou "SupplierProfile"
 *   onSaved        — callback após salvar com sucesso
 *   allowUpdate    — se true, mostra botão para atualizar mesmo quando já tem localização
 */
export default function LocationCapture({ profile, user, entityName = "SellerProfile", onSaved, allowUpdate = false }) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const alreadyHasLocation = profile?.lat && profile?.lng;

  // Se já tem localização e não é modo "allowUpdate", não mostra nada
  if (alreadyHasLocation && !allowUpdate) return null;

  // Se dispensou nesta sessão (sem localização ainda), não mostra
  if (dismissed && !alreadyHasLocation) return null;

  const handleCapture = () => {
    if (!navigator.geolocation) {
      toast.error("Seu dispositivo não suporta geolocalização.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const data = {
            lat,
            lng,
            location_consent: true,
            location_updated_at: new Date().toISOString(),
          };
          if (profile?.id) {
            await base44.entities[entityName].update(profile.id, data);
          } else {
            await base44.entities[entityName].create({
              ...data,
              owner_email: user.email,
              seller_name: user.full_name || user.email,
              seller_type: "Produtor",
            });
          }
          toast.success("📍 Localização salva com sucesso!");
          onSaved?.();
        } catch {
          toast.error("Não foi possível salvar a localização.");
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) toast.error("Permissão de localização negada.");
        else toast.error("Não foi possível obter sua localização.");
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Modo: já tem localização, mostrar opção de atualizar
  if (alreadyHasLocation && allowUpdate) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-green-200 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800">Localização ativa</p>
            <p className="text-xs text-green-700">
              {profile.location_updated_at
                ? `Atualizada em ${new Date(profile.location_updated_at).toLocaleDateString("pt-BR")}`
                : "Salva anteriormente"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-xl border-green-300 text-green-700 font-bold text-xs gap-1.5 shrink-0"
          onClick={handleCapture}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <><RefreshCw className="h-3.5 w-3.5" /> Atualizar</>
          )}
        </Button>
      </div>
    );
  }

  // Modo: sem localização, pedir permissão
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center select-none"
      >
        <X className="h-3.5 w-3.5 text-green-700" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="h-10 w-10 rounded-xl bg-green-200 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-green-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-800 mb-0.5">Ative sua localização</p>
          <p className="text-xs text-green-700 leading-relaxed mb-3">
            Permita que compradores e lojas próximas te encontrem.
            Sua localização exata nunca é exibida — apenas distância aproximada.
          </p>
          <Button
            size="sm"
            className="h-8 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1.5"
            onClick={handleCapture}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Obtendo localização...</>
            ) : (
              <><MapPin className="h-3.5 w-3.5" /> Permitir localização</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}