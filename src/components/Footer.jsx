import { useNavigate } from "react-router-dom";

const WA_SUPPORT = "https://wa.me/5562999999999?text=Olá! Preciso de ajuda com o TerraPonte.";

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-border bg-card px-6 py-8 mt-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🌾</span>
        <div>
          <p className="text-base font-extrabold text-foreground leading-tight">TerraPonte</p>
          <p className="text-[11px] text-muted-foreground">O mercado rural da sua região</p>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {[
          { label: "Como funciona", path: "/support" },
          { label: "Sobre o TerraPonte", path: "/support" },
          { label: "Termos de uso", path: "/terms" },
          { label: "Política de privacidade", path: "/privacy" },
          { label: "Contato / Suporte", path: "/support" },
        ].map(({ label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="text-left text-sm text-muted-foreground font-medium hover:text-primary transition-colors py-1 select-none"
          >
            {label}
          </button>
        ))}
        <a
          href={WA_SUPPORT}
          target="_blank"
          rel="noopener noreferrer"
          className="text-left text-sm text-green-600 font-bold py-1"
        >
          💬 WhatsApp Suporte
        </a>
      </div>

      <div className="border-t border-border pt-4 space-y-1">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} TerraPonte · Todos os direitos reservados
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Conectando produtores e compradores do campo 🌿
        </p>
      </div>
    </footer>
  );
}