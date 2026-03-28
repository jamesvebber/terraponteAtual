import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-foreground mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function TermsOfUse() {
  const navigate = useNavigate();
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
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Termos de Uso</h1>
          <p className="text-xs text-muted-foreground">Atualizado em março de 2026</p>
        </div>
      </div>

      <Section title="1. Sobre o Mercado Rural">
        <p>O Mercado Rural é uma plataforma digital que conecta produtores rurais, vendedores e compradores do agronegócio. Ao utilizar o aplicativo, você concorda com estes Termos de Uso.</p>
      </Section>

      <Section title="2. Uso do Marketplace">
        <p>O Marketplace é um espaço para publicação de anúncios de produtos e serviços rurais. Ao publicar um anúncio, você declara que:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>É o legítimo proprietário ou tem autorização para vender o produto anunciado.</li>
          <li>As informações fornecidas são verdadeiras e atualizadas.</li>
          <li>O preço e condições descritos são praticados por você de boa-fé.</li>
        </ul>
      </Section>

      <Section title="3. Responsabilidade sobre anúncios">
        <p>O Mercado Rural é uma plataforma intermediária. Cada vendedor é <strong>inteiramente responsável</strong> pelo conteúdo, veracidade e legalidade dos anúncios publicados em sua conta.</p>
        <p>A plataforma não participa, garante ou intermedia nenhuma negociação ou transação financeira entre usuários.</p>
      </Section>

      <Section title="4. Conteúdo proibido">
        <p>É estritamente proibido publicar anúncios que contenham:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Produtos ilegais, controlados ou de procedência duvidosa.</li>
          <li>Conteúdo ofensivo, discriminatório ou de assédio.</li>
          <li>Fraudes, golpes ou informações intencionalmente falsas.</li>
          <li>Spam ou anúncios duplicados em excesso.</li>
          <li>Material que viole direitos autorais ou marcas registradas.</li>
        </ul>
        <p>Violações resultam em remoção do anúncio e eventual suspensão da conta.</p>
      </Section>

      <Section title="5. Contato e negociação">
        <p>O contato entre comprador e vendedor ocorre diretamente pelo WhatsApp informado no anúncio. O Mercado Rural não é parte das negociações e não se responsabiliza por:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Qualidade, entrega ou pagamento de produtos.</li>
          <li>Disputas entre comprador e vendedor.</li>
          <li>Prejuízos decorrentes de negociações realizadas fora da plataforma.</li>
        </ul>
        <p>Recomendamos sempre verificar o perfil do vendedor e tomar as devidas precauções antes de efetuar qualquer pagamento.</p>
      </Section>

      <Section title="6. Limitação de responsabilidade">
        <p>O Mercado Rural oferece o serviço "como está" e não garante disponibilidade contínua, correção de erros em prazo específico ou adequação para fins específicos. Não somos responsáveis por danos indiretos, perda de dados ou lucros cessantes.</p>
      </Section>

      <Section title="7. Regras de conta">
        <ul className="list-disc pl-4 space-y-1">
          <li>Cada usuário pode ter apenas uma conta ativa.</li>
          <li>É proibido compartilhar credenciais de acesso.</li>
          <li>Contas utilizadas para abusos serão suspensas sem aviso prévio.</li>
          <li>O usuário pode excluir sua conta a qualquer momento em Configurações.</li>
        </ul>
      </Section>

      <Section title="8. Alterações nos Termos">
        <p>Podemos atualizar estes termos periodicamente. Alterações relevantes serão comunicadas pelo aplicativo. O uso contínuo após as alterações implica aceitação dos novos termos.</p>
      </Section>

      <Section title="9. Contato">
        <p>Dúvidas sobre estes termos:</p>
        <p className="font-semibold text-foreground">suporte@mercadorural.app</p>
      </Section>
    </div>
  );
}