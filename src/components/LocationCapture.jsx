import { useState } from "react";
import { MapPin, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * LocationCapture — pede consentimento, captura lat/lng e salva no SellerProfile.
 * Props:
 *   sellerProfile  — perfil atual (pode ser null se ainda não existe)
 *   user           — objeto do usuário autenticado
 *   onSaved        — callback após salvar com sucesso
 */
export default function LocationCapture({ sellerProfile, user, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const alreadyHasLocation = sellerProfile?.lat && sellerProfile?.lng;

  if (dismissed || alreadyHasLocation) return null;

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
          if (sellerProfile) {
            await base44.entities.SellerProfile.update(sellerProfile.id, data);
          } else {
            await base44.entities.SellerProfile.create({
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
            Permita que lojas próximas saibam que você está na região e receba ofertas relevantes.
            Sua localização exata nunca é exibida publicamente — apenas distância aproximada.
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