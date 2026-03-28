import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-foreground mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPolicy() {
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
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Política de Privacidade</h1>
          <p className="text-xs text-muted-foreground">Atualizado em março de 2026</p>
        </div>
      </div>

      <Section title="1. Quais dados coletamos">
        <p>O TerraPonte coleta apenas as informações necessárias para o funcionamento da plataforma:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Nome e e-mail</strong> — fornecidos no cadastro, usados para identificação e comunicação.</li>
          <li><strong>Número de WhatsApp</strong> — fornecido voluntariamente para que compradores entrem em contato com você diretamente.</li>
          <li><strong>Cidade e estado</strong> — usados para contextualizar anúncios por região e facilitar a busca de compradores próximos.</li>
          <li><strong>Fotos e imagens de produtos</strong> — enviadas para ilustrar os anúncios publicados.</li>
          <li><strong>Dados do perfil de vendedor</strong> — nome, tipo, bio e foto, configurados voluntariamente.</li>
        </ul>
      </Section>

      <Section title="2. Como os dados são coletados">
        <p>Os dados são coletados diretamente de você quando:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Você cria uma conta ou faz login no aplicativo.</li>
          <li>Você publica um anúncio no Marketplace.</li>
          <li>Você configura um perfil de vendedor.</li>
          <li>Você envia uma denúncia de conteúdo.</li>
        </ul>
      </Section>

      <Section title="3. Como usamos os dados">
        <p>Seus dados são usados exclusivamente para:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Exibir seus anúncios para outros usuários do aplicativo.</li>
          <li>Permitir que compradores entrem em contato com você via WhatsApp.</li>
          <li>Personalizar sua experiência e manter sua conta ativa.</li>
          <li>Moderar conteúdo impróprio e responder a denúncias.</li>
        </ul>
        <p>Não utilizamos seus dados para fins de publicidade de terceiros ou análise comercial.</p>
      </Section>

      <Section title="4. Compartilhamento com terceiros">
        <p>O TerraPonte <strong>não vende</strong> seus dados pessoais. Os dados podem ser acessados por:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Base44</strong> — plataforma de infraestrutura técnica que hospeda o aplicativo e o banco de dados.</li>
          <li><strong>Equipe de moderação</strong> — administradores do aplicativo que revisam denúncias e anúncios reportados.</li>
        </ul>
        <p>O WhatsApp exibido em anúncios é público para todos os usuários do aplicativo por opção do próprio vendedor.</p>
      </Section>

      <Section title="5. Exclusão de conta">
        <p>Você pode solicitar a exclusão da sua conta a qualquer momento em <strong>Configurações → Zona de perigo → Excluir conta</strong>.</p>
        <p>Após a exclusão, seus dados pessoais serão removidos. Anúncios publicados podem ser mantidos de forma anonimizada por até 30 dias para fins de segurança e moderação, conforme exigências legais aplicáveis.</p>
      </Section>

      <Section title="6. Seus direitos">
        <p>Você tem direito de acessar, corrigir ou solicitar a exclusão de seus dados a qualquer momento, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
      </Section>

      <Section title="7. Contato">
        <p>Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato:</p>
        <p className="font-semibold text-foreground">suporte@terraponte.app</p>
      </Section>
    </div>
  );
}