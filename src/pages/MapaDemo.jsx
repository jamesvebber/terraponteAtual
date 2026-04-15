import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Users, MapPin, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const storeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28], shadowSize: [33, 33],
});

// Minha loja (fictícia) — Goiânia
const STORE = { lat: -16.6869, lng: -49.2648, name: "Agropecuária São João" };

// Clientes fictícios ao redor
const CLIENTS = [
  { id: 1, lat: -16.32, lng: -48.95, name: "Sítio Boa Esperança", city: "Anápolis", region: "GO", dist: 51 },
  { id: 2, lat: -16.95, lng: -49.55, name: "Produtor João Alves", city: "Inhumas", region: "GO", dist: 35 },
  { id: 3, lat: -17.10, lng: -49.01, name: "Fazenda Santa Rita", city: "Bela Vista", region: "GO", dist: 62 },
  { id: 4, lat: -16.45, lng: -49.22, name: "Rancho Mato Verde", city: "Goianira", region: "GO", dist: 27 },
  { id: 5, lat: -16.82, lng: -49.80, name: "Sítio das Pedras", city: "Trindade", region: "GO", dist: 42 },
  { id: 6, lat: -16.55, lng: -49.35, name: "Produtor Maria Lima", city: "Senador Canedo", region: "GO", dist: 18 },
  { id: 7, lat: -17.25, lng: -49.55, name: "Fazenda Boa Vista", city: "Indiara", region: "GO", dist: 78 },
  { id: 8, lat: -16.75, lng: -48.60, name: "Sítio Esperança", city: "Leopoldo de Bulhões", region: "GO", dist: 58 },
];

export default function MapaDemo() {
  const navigate = useNavigate();
  const [radiusKm, setRadiusKm] = useState(100);

  const visible = CLIENTS.filter(c => c.dist <= radiusKm);

  return (
    <div className="px-4 pt-6 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">📍 Clientes Próximos</h1>
          <p className="text-xs text-muted-foreground">Preview — dados fictícios para demonstração</p>
        </div>
      </div>

      {/* Stats + Radius */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">
            {visible.length} clientes em {radiusKm} km
          </p>
        </div>
        <div className="flex gap-1.5">
          {[25, 50, 100, 200].map(r => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors select-none ${
                radiusKm === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-600 inline-block" /> Sua loja</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-600 inline-block" /> Clientes</span>
      </div>

      {/* Privacy note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3">
        <p className="text-[11px] text-blue-700 font-medium">
          🔒 Apenas localização aproximada é exibida. Coordenadas exatas nunca são reveladas.
        </p>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border mb-4" style={{ height: 420 }}>
        <MapContainer center={[STORE.lat, STORE.lng]} zoom={9} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Store */}
          <Marker position={[STORE.lat, STORE.lng]} icon={storeIcon}>
            <Popup>
              <div className="text-sm font-bold">📍 Sua loja</div>
              <div className="text-xs text-gray-500">{STORE.name}</div>
            </Popup>
          </Marker>

          {/* Radius circle */}
          <Circle
            center={[STORE.lat, STORE.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.06, weight: 1.5 }}
          />

          {/* Clients */}
          {visible.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={clientIcon}>
              <Popup>
                <div className="text-sm font-bold">{c.name}</div>
                <div className="text-xs text-gray-500">~{c.dist} km de distância</div>
                <div className="text-xs text-gray-500">{c.city} - {c.region}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Client list */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Clientes próximos</p>
        {visible.map(c => (
          <div key={c.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{c.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.city} - {c.region}</p>
            </div>
            <span className="text-xs font-bold text-primary shrink-0">~{c.dist} km</span>
          </div>
        ))}
      </div>
    </div>
  );
}