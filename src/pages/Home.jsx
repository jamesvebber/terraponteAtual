import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MarketCard from "../components/MarketCard";
import { Button } from "@/components/ui/button";
import { Loader2, Sprout, TrendingDown } from "lucide-react";

const defaultPrices = [
  { product_name: "Arroba do Boi", price: 310.5, unit: "@", trend: "up", icon: "🐂" },
  { product_name: "Leite", price: 2.85, unit: "litro", trend: "down", icon: "🥛" },
  { product_name: "Milho", price: 72.0, unit: "saca 60kg", trend: "up", icon: "🌽" },
  { product_name: "Soja", price: 138.5, unit: "saca 60kg", trend: "down", icon: "🫘" },
];

export default function Home() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPrices() {
      const data = await base44.entities.MarketPrice.list();
      setPrices(data.length > 0 ? data : defaultPrices);
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
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Mercado Rural</h1>
          <p className="text-xs text-muted-foreground font-medium">Cotações do dia</p>
        </div>
      </div>

      {/* Greeting banner */}
      <div className="bg-primary rounded-2xl p-4 mb-4 shadow-md">
        <p className="text-primary-foreground text-sm font-semibold mb-1">Bom dia, produtor! 🌾</p>
        <p className="text-primary-foreground/80 text-xs">
          Acompanhe os preços do mercado agropecuário e venda seus produtos.
        </p>
      </div>

      {/* CTA button */}
      <Button
        onClick={() => navigate("/insumos")}
        className="w-full h-13 mb-6 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm shadow-md gap-2"
      >
        <TrendingDown className="h-5 w-5" />
        Ver onde está mais barato
      </Button>

      {/* Market prices */}
      <h2 className="text-base font-bold text-foreground mb-3">Cotações</h2>
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