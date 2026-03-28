import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketCard({ product_name, price, unit, trend, icon, urgency }) {
  const isUp = trend === "up";

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon || "📦"}</span>
        <h3 className="font-semibold text-foreground text-sm leading-tight">{product_name}</h3>
      </div>
      <p className="text-2xl font-extrabold text-foreground mb-1">
        R$ {price?.toFixed(2).replace(".", ",")}
      </p>
      <p className="text-xs text-muted-foreground mb-2">por {unit}</p>
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            isUp
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          )}
        >
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {isUp ? "↑ Subiu" : "↓ Caiu"}
        </div>
        {urgency && (
          <span className="text-[10px] font-bold ml-1">{urgency}</span>
        )}
      </div>
    </div>
  );
}