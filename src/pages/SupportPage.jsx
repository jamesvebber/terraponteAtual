import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Mail, MessageCircle, ChevronDown, ChevronUp, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportSheet from "../components/ReportSheet";

const FAQ = [
  {
    q: "Como publico um anúncio?",
    a: "Acesse a aba \"Anunciar\" no menu inferior. Preencha as informações do produto, adicione uma foto e seu WhatsApp. Após publicar, o anúncio aparece no Marketplace do TerraPonte."
  },
  {
    q: "Como entro em contato com um vendedor?",
    a: "Abra o anúncio desejado e toque no botão verde \"WhatsApp\". Você será redirecionado diretamente para uma conversa com o vendedor."
  },
  {
    q: "Meu anúncio não aparece no Marketplace. O que fazer?",
    a: "Verifique se o anúncio foi publicado com sucesso na aba \"Anunciar\". Se o problema persistir, entre em contato com o suporte do TerraPonte."
  },
  {
    q: "Como denuncio um anúncio ou vendedor suspeito?",
    a: "Na página do anúncio, role até o final e toque em \"Denunciar este anúncio\". No perfil do vendedor, toque em \"Denunciar vendedor\". Nossa equipe analisará em breve."
  },
  {
    q: "Como excluo minha conta?",
    a: "Acesse Conta → Configurações → Zona de perigo → Excluir conta. A exclusão é permanente e irreversível."
  },
  {
    q: "Por que o app pede meu WhatsApp?",
    a: "O WhatsApp é exibido no seu anúncio para que compradores entrem em contato diretamente com você. Ele nunca é usado para envio de publicidade."
  },
  {
    q: "Por que preciso informar cidade e região?",
    a: "Cidade e estado ajudam compradores a encontrar produtos próximos a eles e tornam seu anúncio mais relevante para pessoas da sua região."
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-none">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left select-none gap-3"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <p className="text-sm text-muted-foreground pb-3.5 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="px-4 pt-5 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground font-semibold mb-5 select-none"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Suporte</h1>
          <p className="text-xs text-muted-foreground">Estamos aqui para ajudar</p>
        </div>
      </div>

      {/* Contact options */}
      <div className="space-y-3 mb-8">
        <a href="mailto:suporte@terraponte.app" className="block">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">E-mail</p>
              <p className="text-xs text-muted-foreground">suporte@terraponte.app</p>
            </div>
          </div>
        </a>

        <a href="https://wa.me/5511999999999?text=Olá! Preciso de suporte no TerraPonte." target="_blank" rel="noopener noreferrer" className="block">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">(11) 99999-9999 · Seg–Sex, 9h–18h</p>
            </div>
          </div>
        </a>

        <button onClick={() => setReportOpen(true)} className="w-full block">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Flag className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-left">
              <p className="font-bold text-foreground text-sm">Reportar um problema</p>
              <p className="text-xs text-muted-foreground">Nos avise sobre erros ou conteúdo inadequado</p>
            </div>
          </div>
        </button>
      </div>

      {/* FAQ */}
      <h2 className="text-base font-bold text-foreground mb-3">Perguntas frequentes</h2>
      <div className="bg-card border border-border rounded-2xl px-4">
        {FAQ.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
      </div>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="listing"
        targetId="platform"
        targetTitle="Problema na plataforma"
      />
    </div>
  );
}