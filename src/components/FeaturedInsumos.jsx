import { useNavigate } from "react-router-dom";
import { MapPin, Store, ChevronRight, BadgeCheck } from "lucide-react";
import AppImage from "./AppImage";

const categoryEmoji = {
  "Ração": "🌾", "Sal mineral": "🧂", "Adubo": "🌱", "Sementes": "🌻",
  "Herbicidas": "🧪", "Inseticidas": "🐛", "Medicamentos veterinários": "💊",
  "Suplementos": "⚗️", "Ferramentas": "🔧", "Selaria": "🐴",
  "Pet shop": "🐾", "Equipamentos": "⚙️", "Peças": "🔩",
  "Vestuário rural": "👕", "Calçados": "👢", "Outros": "📦",
};

function InsumoMiniCard({ product, onClick }) {
  const price = product.price
    ? `R$ ${product.price.toFixed(2).replace(".", ",")}`
    : null;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-40 bg-card border border-border rounded-2xl overflow-hidden text-left select-none active:scale-95 transition-transform"
    >
      <div className="w-full h-24 bg-muted flex items-center justify-center overflow-hidden relative">
        <AppImage
          src={product.image_url}
          alt={product.product_name}
          containerClassName="w-full h-full"
          fallbackEmoji={categoryEmoji[product.category] || "📦"}
        />
        {/* Store badge */}
        <span className="absolute top-1.5 left-1.5 bg-secondary/90 text-secondary-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Store className="h-2.5 w-2.5" /> Loja
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug mb-0.5">
          {product.product_name}
        </p>
        {price && (
          <p className="text-sm font-extrabold text-green-600 leading-snug">{price}</p>
        )}
        <div className="flex items-center gap-1 mt-1 min-w-0">
          <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate">
            {product.supplier_name || product.city}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function FeaturedInsumos({ products, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-foreground">Insumos em destaque</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-40 h-40 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🏪</span>
          <h2 className="text-base font-extrabold text-foreground">Insumos em destaque</h2>
        </div>
        <button
          onClick={() => navigate("/insumos")}
          className="flex items-center gap-1 text-xs font-bold text-primary select-none"
        >
          Ver todos <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
        {products.map(p => (
          <InsumoMiniCard
            key={p.id}
            product={p}
            onClick={() => navigate(`/insumos/${p.id}`)}
          />
        ))}
      </div>
    </div>
  );
}