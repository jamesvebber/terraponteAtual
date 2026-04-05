import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail, Send, Plus, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, BarChart2, FileText, Megaphone
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
  skipped: "bg-gray-100 text-gray-500",
  draft: "bg-amber-100 text-amber-700",
};

const TEMPLATE_PRESETS = {
  reactivation: { subject: "Tem novidade no TerraPonte", body_title: "Volte pro TerraPonte", body_text: "Novos anúncios, lojas e oportunidades podem estar te esperando no app.", cta_label: "Ver novidades", cta_url: "https://terraponte.app" },
  announce_call: { subject: "Anuncie no TerraPonte", body_title: "Tem algo para vender?", body_text: "Publique seus produtos, serviços ou oportunidades no TerraPonte e alcance mais gente da sua região.", cta_label: "Anunciar agora", cta_url: "https://terraponte.app/vender" },
  new_offer: { subject: "Nova oferta disponível", body_title: "Chegou novidade no app", body_text: "Encontramos novas ofertas e anúncios que podem te interessar.", cta_label: "Ver ofertas", cta_url: "https://terraponte.app/marketplace" },
  new_store: { subject: "Nova loja no TerraPonte", body_title: "Tem loja nova por aqui", body_text: "Uma nova loja entrou no TerraPonte. Confira os produtos e oportunidades.", cta_label: "Ver loja", cta_url: "https://terraponte.app/lojas" },
  weekly_digest: { subject: "Resumo da semana no TerraPonte", body_title: "Veja o que apareceu no app", body_text: "Novos anúncios, novas lojas e novas oportunidades reunidas para você.", cta_label: "Abrir resumo", cta_url: "https://terraponte.app" },
};

export default function AdminEmailPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sending, setSending] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);

  // New campaign form
  const [form, setForm] = useState({
    title: "", subject: "", template_type: "custom",
    body_title: "", body_text: "",
    cta_label: "Abrir no TerraPonte", cta_url: "https://terraponte.app",
    filter_region: "", filter_city: "",
  });
  const [savingCampaign, setSavingCampaign] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") { navigate("/"); return; }
    loadCampaigns();
  }, [user]);

  const loadCampaigns = async () => {
    const data = await base44.entities.EmailCampaign.list('-created_date', 50);
    setCampaigns(data);
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    const data = await base44.entities.EmailLog.list('-created_date', 100);
    setLogs(data);
    setLoadingLogs(false);
  };

  const applyPreset = (type) => {
    const preset = TEMPLATE_PRESETS[type];
    if (preset) setForm(f => ({ ...f, template_type: type, ...preset }));
  };

  const saveCampaign = async () => {
    if (!form.title || !form.subject || !form.body_title || !form.body_text) {
      toast.error("Preencha todos os campos obrigatórios."); return;
    }
    setSavingCampaign(true);
    await base44.entities.EmailCampaign.create({ ...form, status: "draft" });
    toast.success("Campanha salva!");
    setForm({ title: "", subject: "", template_type: "custom", body_title: "", body_text: "", cta_label: "Abrir no TerraPonte", cta_url: "https://terraponte.app", filter_region: "", filter_city: "" });
    setSavingCampaign(false);
    loadCampaigns();
  };

  const sendCampaign = async (id) => {
    setSending(id);
    const res = await base44.functions.invoke("sendCampaign", { campaign_id: id });
    setSending(null);
    if (res.data?.success) {
      toast.success(`Enviado para ${res.data.sent} destinatários!`);
    } else {
      toast.error("Erro ao enviar campanha.");
    }
    loadCampaigns();
  };

  const sendTestEmail = async () => {
    if (!testEmail) { toast.error("Digite um e-mail de destino."); return; }
    setTestSending(true);
    const res = await base44.functions.invoke("sendTransactionalEmail", {
      type: "welcome",
      to: testEmail,
      data: { name: "Teste" },
    });
    setTestSending(false);
    if (res.data?.success) toast.success("E-mail de teste enviado!");
    else toast.error("Falha ao enviar e-mail de teste.");
  };

  if (user?.role !== "admin") return null;

  const TABS = [
    { id: "campaigns", label: "Campanhas", icon: Megaphone },
    { id: "new", label: "Nova campanha", icon: Plus },
    { id: "logs", label: "Logs", icon: BarChart2 },
    { id: "test", label: "Teste", icon: Send },
  ];

  return (
    <div className="px-4 pt-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/admin")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Painel de E-mails</h1>
          <p className="text-xs text-muted-foreground">Campanhas, logs e configurações</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); if (id === "logs") loadLogs(); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors select-none ${tab === id ? "bg-background text-foreground shadow" : "text-muted-foreground"}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Campaigns list */}
      {tab === "campaigns" && (
        <div className="space-y-3">
          {campaigns.length === 0 && (
            <div className="text-center py-10 bg-card border border-border rounded-2xl">
              <Mail className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Nenhuma campanha criada ainda.</p>
              <Button className="mt-3 rounded-xl text-xs" onClick={() => setTab("new")}>Criar primeira campanha</Button>
            </div>
          )}
          {campaigns.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.subject}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[c.status] || ""}`}>{c.status}</span>
              </div>
              {c.status === "sent" && (
                <p className="text-xs text-muted-foreground mb-2">
                  ✅ {c.sent_count || 0} enviados · ❌ {c.error_count || 0} erros
                </p>
              )}
              {c.filter_region && <p className="text-xs text-muted-foreground mb-2">Filtro: {c.filter_region}{c.filter_city ? ` / ${c.filter_city}` : ""}</p>}
              {c.status === "draft" && (
                <Button size="sm" className="w-full rounded-xl h-9 font-bold gap-2 mt-1"
                  onClick={() => sendCampaign(c.id)} disabled={sending === c.id}>
                  {sending === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Disparar campanha</>}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New campaign form */}
      {tab === "new" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Usar modelo pronto</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TEMPLATE_PRESETS).map(([key, p]) => (
                <button key={key} onClick={() => applyPreset(key)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors select-none text-left ${form.template_type === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                  {p.body_title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: "title", label: "Nome da campanha *", placeholder: "Ex: Reativação abril" },
              { key: "subject", label: "Assunto do e-mail *", placeholder: "Ex: Tem novidade no TerraPonte" },
              { key: "body_title", label: "Título no e-mail *", placeholder: "Ex: Volte pro TerraPonte" },
              { key: "cta_label", label: "Texto do botão", placeholder: "Ver novidades" },
              { key: "cta_url", label: "URL do botão", placeholder: "https://terraponte.app" },
              { key: "filter_region", label: "Filtrar por estado (UF, opcional)", placeholder: "Ex: GO" },
              { key: "filter_city", label: "Filtrar por cidade (opcional)", placeholder: "Ex: Goiânia" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-sm font-bold mb-1 block">{label}</Label>
                <Input className="h-11 rounded-xl" placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            <div>
              <Label className="text-sm font-bold mb-1 block">Texto principal *</Label>
              <Textarea className="rounded-xl min-h-[80px]" placeholder="Mensagem principal do e-mail..."
                value={form.body_text} onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))} />
            </div>
          </div>

          <Button className="w-full h-12 rounded-xl font-bold gap-2" onClick={saveCampaign} disabled={savingCampaign}>
            {savingCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="h-4 w-4" /> Salvar campanha</>}
          </Button>
        </div>
      )}

      {/* Logs */}
      {tab === "logs" && (
        <div>
          {loadingLogs ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum log de envio.</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Total enviados", value: logs.filter(l => l.status === "sent").length, color: "text-green-600" },
                  { label: "Falhas", value: logs.filter(l => l.status === "failed").length, color: "text-red-600" },
                  { label: "Total registros", value: logs.length, color: "text-foreground" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                    <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
              {logs.map(log => (
                <div key={log.id} className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-center gap-3">
                  {log.status === "sent" ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{log.recipient_email}</p>
                    <p className="text-[10px] text-muted-foreground">{log.type} · {log.subject?.slice(0, 40)}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {log.created_date ? new Date(log.created_date).toLocaleDateString("pt-BR") : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test */}
      {tab === "test" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-800 mb-1">Envio de e-mail de teste</p>
            <p className="text-xs text-amber-700">Envia um e-mail de boas-vindas de teste para verificar se o envio está funcionando.</p>
          </div>
          <div>
            <Label className="text-sm font-bold mb-1 block">E-mail destino</Label>
            <Input className="h-11 rounded-xl" type="email" placeholder="seu@email.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          </div>
          <Button className="w-full h-12 rounded-xl font-bold gap-2" onClick={sendTestEmail} disabled={testSending}>
            {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar e-mail de teste</>}
          </Button>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">ℹ️ Sobre o envio</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Os e-mails são enviados via integração nativa do TerraPonte. Para usar domínio próprio <strong>(@terraponte.app)</strong>, configure o Resend com sua API key nas variáveis de ambiente do painel do Base44 (Settings → Environment Variables → <code className="bg-muted px-1 rounded">RESEND_API_KEY</code>).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}