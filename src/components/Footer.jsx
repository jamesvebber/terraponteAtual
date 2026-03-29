import { useNavigate } from "react-router-dom";
import { MessageCircle, FileText, ShieldCheck, HelpCircle, Info } from "lucide-react";

const WA = "https://wa.me/5562999999999?text=Olá! Preciso de ajuda com o TerraPonte.";

export default function Footer() {
  const navigate = useNavigate();

  const links = [
    { label: "Sobre o TerraPonte", action: () => navigate("/sobre") },
    { label: "Como funciona", action: () => navigate("/sobre") },
    { label: "Termos de Uso", action: () => navigate("/terms") },
    { label: "Política de Privacidade", action: () => navigate("/privacy") },
    { label: "Suporte / Ajuda", action: () => navigate("/support") },
    { label: "Contato", action: () => navigate("/sobre") },
  ];

  return (
    <footer className="border-t border-border bg-card px-5 py-8 mt-6">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🌾</span>
        <div>
          <p className="text-sm font-extrabold text-foreground">TerraPonte</p>
          <p className="text-[11px] text-muted-foreground">O mercado rural da sua região</p>
        </div>
      </div>

      {/* Links grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5">
        {links.map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="text-left text-xs text-muted-foreground font-medium hover:text-primary transition-colors py-0.5 select-none"
          >
            {label}
          </button>
        ))}
      </div>

      {/* WhatsApp support */}
      <a
        href={WA}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5"
      >
        <MessageCircle className="h-4 w-4 text-green-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-green-700">WhatsApp Suporte</p>
          <p className="text-[11px] text-muted-foreground">Fale conosco direto pelo WhatsApp</p>
        </div>
      </a>

      <div className="border-t border-border pt-4 space-y-1 text-center">
        <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} TerraPonte · Todos os direitos reservados</p>
        <p className="text-[11px] text-muted-foreground">Conectando o campo 🌿</p>
      </div>
    </footer>
  );
}