import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { Truck, Store, AlertCircle, CheckCircle2, Gift } from "lucide-react";

function fmt(n) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

export default function FreightCalculator({ open, onClose, input }) {
  const [distanceKm, setDistanceKm] = useState("");
  const [orderValue, setOrderValue] = useState(input?.price?.toFixed(2) || "");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const dist = parseFloat(distanceKm);
    const order = parseFloat(orderValue) || 0;

    if (!input) return;

    // Pickup only
    if (!input.delivery_available) {
      setResult({ type: "pickup_only" });
      return;
    }

    if (isNaN(dist) || dist < 0) {
      setResult({ type: "error", message: "Informe uma distância válida." });
      return;
    }

    // Outside radius
    if (input.delivery_radius_km && dist > input.delivery_radius_km) {
      setResult({
        type: "out_of_range",
        radius: input.delivery_radius_km,
        pickupAvailable: input.pickup_available,
      });
      return;
    }

    // Below minimum order
    if (input.minimum_order_for_delivery && order < input.minimum_order_for_delivery) {
      setResult({
        type: "below_minimum",
        minimum: input.minimum_order_for_delivery,
      });
      return;
    }

    // Free delivery threshold
    if (input.free_delivery_above && order >= input.free_delivery_above) {
      setResult({
        type: "success",
        freight: 0,
        total: input.price + 0,
        isFree: true,
      });
      return;
    }

    // Calculate freight
    const fixed = input.fixed_delivery_fee || 0;
    const perKm = input.price_per_km || 0;
    const freight = fixed + perKm * dist;

    setResult({
      type: "success",
      freight,
      total: input.price + freight,
      isFree: false,
    });
  };

  const handleClose = () => {
    setDistanceKm("");
    setOrderValue(input?.price?.toFixed(2) || "");
    setResult(null);
    onClose();
  };

  if (!input) return null;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Calcular frete — {input.product_name}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 space-y-4 pb-2">
          {/* Supplier info summary */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loja</span>
              <span className="font-semibold text-foreground">{input.supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Localização</span>
              <span className="font-semibold text-foreground">{input.city}{input.state ? `, ${input.state}` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço do produto</span>
              <span className="font-bold text-green-600">{fmt(input.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retirada na loja</span>
              <span className={`font-semibold ${input.pickup_available ? "text-green-600" : "text-red-500"}`}>
                {input.pickup_available ? "✓ Disponível" : "✗ Não disponível"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrega</span>
              <span className={`font-semibold ${input.delivery_available ? "text-green-600" : "text-red-500"}`}>
                {input.delivery_available
                  ? input.delivery_radius_km
                    ? `✓ Até ${input.delivery_radius_km} km`
                    : "✓ Disponível"
                  : "✗ Não realiza entrega"}
              </span>
            </div>
          </div>

          {input.delivery_notes && (
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              📋 {input.delivery_notes}
            </p>
          )}

          {input.delivery_available && (
            <>
              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">Sua distância até a loja (km)</label>
                <Input
                  className="h-11 rounded-xl text-base"
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex: 45"
                  value={distanceKm}
                  onChange={(e) => { setDistanceKm(e.target.value); setResult(null); }}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-foreground block mb-1.5">Valor do pedido (R$)</label>
                <Input
                  className="h-11 rounded-xl text-base"
                  type="number"
                  inputMode="decimal"
                  placeholder="Ex: 500"
                  value={orderValue}
                  onChange={(e) => { setOrderValue(e.target.value); setResult(null); }}
                />
                {input.free_delivery_above && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    🎁 Frete grátis em pedidos acima de {fmt(input.free_delivery_above)}
                  </p>
                )}
                {input.minimum_order_for_delivery && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Pedido mínimo para entrega: {fmt(input.minimum_order_for_delivery)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 space-y-2 ${
              result.type === "success" ? "bg-green-50 border border-green-200" :
              result.type === "out_of_range" || result.type === "below_minimum" ? "bg-amber-50 border border-amber-200" :
              result.type === "pickup_only" ? "bg-blue-50 border border-blue-200" :
              "bg-red-50 border border-red-200"
            }`}>
              {result.type === "success" && (
                <>
                  <div className="flex items-center gap-2">
                    {result.isFree
                      ? <Gift className="h-5 w-5 text-green-600" />
                      : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    <span className="font-bold text-green-700">
                      {result.isFree ? "Frete grátis neste pedido!" : "Estimativa calculada"}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Produto</span><span className="font-semibold text-foreground">{fmt(input.price)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete estimado</span>
                      <span className={`font-semibold ${result.isFree ? "text-green-600" : "text-foreground"}`}>
                        {result.isFree ? "Grátis" : fmt(result.freight)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-1.5 mt-1">
                      <span className="font-bold text-foreground">Total estimado</span>
                      <span className="text-xl font-extrabold text-green-700">{fmt(result.total)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Valor estimado. Confirme com o fornecedor antes de finalizar o pedido.</p>
                </>
              )}
              {result.type === "out_of_range" && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-700">Entrega indisponível para essa distância</p>
                    <p className="text-sm text-amber-600 mt-1">Este fornecedor entrega até {result.radius} km.</p>
                    {result.pickupAvailable && (
                      <p className="text-sm text-amber-600 mt-1 font-semibold">✓ Retirada na loja disponível.</p>
                    )}
                  </div>
                </div>
              )}
              {result.type === "below_minimum" && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-700">Pedido abaixo do mínimo para entrega</p>
                    <p className="text-sm text-amber-600 mt-1">Pedido mínimo: {fmt(result.minimum)}</p>
                  </div>
                </div>
              )}
              {result.type === "pickup_only" && (
                <div className="flex items-start gap-2">
                  <Store className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-700">Somente retirada na loja</p>
                    <p className="text-sm text-blue-600 mt-1">Este fornecedor não realiza entregas. Entre em contato para combinar a retirada.</p>
                  </div>
                </div>
              )}
              {result.type === "error" && (
                <p className="text-sm text-red-600 font-semibold">{result.message}</p>
              )}
            </div>
          )}
        </div>

        <DrawerFooter className="gap-2">
          {input.delivery_available && !result && (
            <Button className="w-full rounded-xl" onClick={calculate}>
              Calcular frete
            </Button>
          )}
          {result && result.type === "success" && input.whatsapp && (
            <a
              href={`https://wa.me/55${input.whatsapp.replace(/\D/g, "")}?text=Olá! Tenho interesse no produto "${input.product_name}" e gostaria de confirmar o frete e fazer um pedido.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2">
                Falar no WhatsApp para confirmar
              </Button>
            </a>
          )}
          {(!input.delivery_available || (result && result.type !== "success")) && input.whatsapp && (
            <a
              href={`https://wa.me/55${input.whatsapp.replace(/\D/g, "")}?text=Olá! Tenho interesse no produto "${input.product_name}" no TerraPonte.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2">
                Falar no WhatsApp
              </Button>
            </a>
          )}
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}