import { useNavigate } from "react-router-dom";
import { Sprout, Store, X } from "lucide-react";

export default function AnunciarModal({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleProdutor = () => {
    onClose();
    navigate("/vender");
  };

  const handleLoja = () => {
    onClose();
    navigate("/minha-loja");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-background rounded-t-3xl p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)", marginBottom: "4rem" }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <h2 className="text-lg font-extrabold text-foreground mb-1 pr-8">Como você quer anunciar?</h2>
        <p className="text-xs text-muted-foreground mb-3 leading-snug">
          Produtor anuncia o que produz ou o serviço que oferece.<br />
          Lojas e cooperativas criam sua vitrine em Insumos.
        </p>

        <div className="space-y-2.5">
          {/* Produtor */}
          <button
            onClick={handleProdutor}
            className="w-full flex items-center gap-3 bg-primary/8 border border-primary/25 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform select-none"
          >
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-extrabold text-foreground text-sm leading-tight">Sou produtor</p>
              <p className="text-xs text-muted-foreground mt-0.5">Anunciar no Mercado</p>
            </div>
          </button>

          {/* Loja */}
          <button
            onClick={handleLoja}
            className="w-full flex items-center gap-3 bg-muted/60 border border-border rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform select-none"
          >
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-extrabold text-foreground text-sm leading-tight">Sou loja, cooperativa ou representante</p>
              <p className="text-xs text-muted-foreground mt-0.5">Criar loja em Insumos</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}