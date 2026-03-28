import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MarketCard from "../components/MarketCard";
import { Button } from "@/components/ui/button";
import { Loader2, Sprout, TrendingDown } from "lucide-react";

const defaultPrices = [
  { product_name: "Arroba do Boi", price: 310.5, unit: "@", trend: "up", icon: "🐂", urgency: "🔥 Preço em alta hoje" },
  { product_name: "Leite", price: 2.85, unit: "litro", trend: "down", icon: "🥛", urgency: "⚠️ Atenção ao mercado" },
  { product_name: "Milho", price: 72.0, unit: "saca 60kg", trend: "up", icon: "🌽" },
  { product_name: "Soja", price: 138.5, unit: "saca 60kg", trend: "down", icon: "🫘" },
];

export default function Home() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadPrices() {
      const data = await base44.entities.MarketPrice.list();
      const enriched = (data.length > 0 ? data : defaultPrices).map((p, i) => ({
        ...p,
        urgency: i === 0 ? "🔥 Preço em alta hoje" : i === 1 ? "⚠️ Atenção ao mercado" : undefined,
      }));
      setPrices(enriched);
      setLoading(false);
    }
    loadPrices();
  }, []);

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Sprout className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">TerraPonte</h1>
          <p className="text-xs text-muted-foreground font-medium">Preços e oportunidades da sua região</p>
        </div>
      </div>

      {/* Greeting banner */}
      <div className="bg-primary rounded-2xl p-4 mb-4 shadow-md">
        <p className="text-primary-foreground text-sm font-semibold mb-1">Compre direto de quem produz. 🌾</p>
        <p className="text-primary-foreground/80 text-xs">
          Produtos, anúncios e oportunidades da sua região. A ponte entre o produtor e o comprador.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2 mb-6">
        <Button
          onClick={() => navigate("/marketplace")}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-md gap-2"
        >
          🛒 Ver anúncios da sua região
        </Button>
        <Button
          onClick={() => navigate("/insumos")}
          className="w-full h-12 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm shadow-md gap-2"
        >
          <TrendingDown className="h-5 w-5" />
          Ver onde está mais barato
        </Button>
      </div>

      {/* Market prices */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">Cotações</h2>
        <span className="text-[11px] text-muted-foreground font-medium">
          ⏱️ Atualizado hoje às {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {prices.map((item, idx) => (
            <MarketCard key={item.id || idx} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}