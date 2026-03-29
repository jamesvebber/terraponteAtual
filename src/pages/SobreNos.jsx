import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, ShieldCheck, FileText, HelpCircle } from "lucide-react";

export default function SobreNos() {
  const navigate = useNavigate();

  const STEPS = [
    { emoji: "📢", title: "Publique seu anúncio", body: "Qualquer produtor ou loja pode anunciar gratuitamente. Basta preencher o formulário com foto, preço e WhatsApp." },
    { emoji: "🔍", title: "Compradores encontram você", body: "Seus produtos aparecem no marketplace regional para compradores da sua região pesquisarem." },
    { emoji: "💬", title: "Negociem direto pelo WhatsApp", body: "Sem intermediários, sem taxas. O contato é direto entre comprador e vendedor." },
    { emoji: "🚜", title: "Combine entrega ou retirada", body: "Você combina a logística diretamente com o comprador, do jeito que for melhor para vocês." },
  ];

  const principles = [
    { emoji: "🤝", title: "Direto ao ponto", body: "Sem taxas, sem burocracia." },
    { emoji: "📍", title: "Regional", body: "Foco em produtores e compradores locais." },
    { emoji: "🔒", title: "Seguro", body: "Denúncias e moderação ativa." },
    { emoji: "📱", title: "Mobile First", body: "Feito para celular e para o campo." },
  ];

  const contactLinks = [
    { Icon: MessageCircle, label: "WhatsApp Suporte", sub: "Fale conosco pelo WhatsApp", href: "https://wa.me/5562999999999?text=Olá! Preciso de ajuda com o TerraPonte.", color: "text-green-600" },
    { Icon: Mail, label: "E-mail", sub: "contato@terraponte.com.br", href: "mailto:contato@terraponte.com.br", color: "text-blue-600" },
  ];

  const legalLinks = [
    { Icon: FileText, label: "Termos de Uso", path: "/terms" },
    { Icon: ShieldCheck, label: "Política de Privacidade", path: "/privacy" },
    { Icon: HelpCircle, label: "Suporte e Ajuda", path: "/support" },
  ];

  return (
    <div className="px-4 pt-5 pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-semibold mb-5 select-none">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Hero */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-md shrink-0">
          <span className="text-2xl">🌾</span>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Sobre o TerraPonte</h1>
          <p className="text-sm text-muted-foreground">O mercado rural digital da sua região</p>
        </div>
      </div>

      {/* Mission */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-6">
        <p className="text-sm text-foreground font-semibold leading-relaxed">
          O TerraPonte conecta produtores rurais, cooperativas e fornecedores de insumos com compradores locais — direto pelo WhatsApp, sem taxas, sem intermediários.
        </p>
      </div>

      {/* Como funciona */}
      <h2 className="text-base font-extrabold text-foreground mb-4">Como funciona</h2>
      <div className="space-y-3 mb-7">
        {STEPS.map((s, i) => (
          <div key={i} className="flex gap-3 bg-card border border-border rounded-2xl p-4">
            <span className="text-2xl shrink-0">{s.emoji}</span>
            <div>
              <p className="text-sm font-bold text-foreground mb-0.5">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Principles */}
      <h2 className="text-base font-extrabold text-foreground mb-3">Nossos princípios</h2>
      <div className="grid grid-cols-2 gap-3 mb-7">
        {principles.map((v, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4">
            <span className="text-xl">{v.emoji}</span>
            <p className="text-sm font-bold text-foreground mt-1.5 mb-0.5">{v.title}</p>
            <p className="text-xs text-muted-foreground">{v.body}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <h2 className="text-base font-extrabold text-foreground mb-3">Contato</h2>
      <div className="space-y-2 mb-7">
        {contactLinks.map(({ Icon, label, sub, href, color }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 select-none">
            <Icon className={`h-5 w-5 shrink-0 ${color}`} />
            <div>
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Legal */}
      <h2 className="text-base font-extrabold text-foreground mb-3">Legal</h2>
      <div className="space-y-2">
        {legalLinks.map(({ Icon, label, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 select-none">
            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}