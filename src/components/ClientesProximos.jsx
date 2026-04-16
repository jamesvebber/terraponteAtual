import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, Users, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom green marker for store
const storeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom blue marker for clients
const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ClientesProximos({ supplierProfile }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(50);

  const storeLat = supplierProfile?.lat;
  const storeLng = supplierProfile?.lng;
  const hasStoreLocation = storeLat && storeLng;

  useEffect(() => {
    if (!hasStoreLocation) {
      setLoading(false);
      return;
    }
    loadClients();
  }, [hasStoreLocation]);

  const loadClients = async () => {
    setLoading(true);
    // Load all SellerProfiles that have location data (these are user profiles with lat/lng)
    const all = await base44.entities.SellerProfile.filter({ location_consent: true });
    const nearby = all
      .filter(c => c.lat && c.lng && c.owner_email !== supplierProfile.owner_email)
      .map(c => ({
        ...c,
        distanceKm: haversineKm(storeLat, storeLng, c.lat, c.lng),
      }))
      .filter(c => c.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    setClients(nearby);
    setLoading(false);
  };

  // No store location captured yet
  if (!hasStoreLocation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
          <Navigation className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-base font-extrabold text-foreground mb-2">Localização da loja não definida</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Para ver clientes próximos, ative a localização no seu perfil.
        </p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/profile")}>
          Ir para o perfil
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} em {radiusKm} km
          </p>
        </div>
        {/* Radius selector */}
        <div className="flex gap-1.5">
          {[25, 50, 100, 200].map(r => (
            <button
              key={r}
              onClick={() => { setRadiusKm(r); loadClients(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors select-none ${
                radiusKm === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
        <p className="text-[11px] text-blue-700 font-medium">
          🔒 Apenas localização aproximada é exibida. Coordenadas exatas nunca são reveladas.
        </p>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border" style={{ height: 380 }}>
        <MapContainer
          center={[storeLat, storeLng]}
          zoom={9}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Store marker */}
          <Marker position={[storeLat, storeLng]} icon={storeIcon}>
            <Popup>
              <div className="text-sm font-bold">📍 Sua loja</div>
              <div className="text-xs text-gray-500">{supplierProfile.store_name}</div>
            </Popup>
          </Marker>

          {/* Radius circle */}
          <Circle
            center={[storeLat, storeLng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.05, weight: 1.5 }}
          />

          {/* Client markers */}
          {clients.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={clientIcon}>
              <Popup>
                <div className="text-sm font-bold">{c.seller_name || "Produtor"}</div>
                <div className="text-xs text-gray-500">~{Math.round(c.distanceKm)} km de distância</div>
                {c.city && <div className="text-xs text-gray-500">{c.city} - {c.region}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="text-center py-6 bg-muted/30 rounded-2xl">
          <p className="text-sm font-semibold text-foreground mb-1">Nenhum cliente encontrado neste raio</p>
          <p className="text-xs text-muted-foreground">Tente aumentar o raio de busca.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Lista de clientes próximos</p>
          {clients.slice(0, 10).map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{(c.seller_name || "?")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.seller_name || "Produtor"}</p>
                <p className="text-xs text-muted-foreground">{c.city || ""}{c.region ? ` - ${c.region}` : ""}</p>
              </div>
              <span className="text-xs font-bold text-primary shrink-0">~{Math.round(c.distanceKm)} km</span>
            </div>
          ))}
          {clients.length > 10 && (
            <p className="text-xs text-center text-muted-foreground">+ {clients.length - 10} outros clientes no raio</p>
          )}
        </div>
      )}
    </div>
  );
}