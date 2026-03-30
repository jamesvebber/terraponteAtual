import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { BadgeCheck, ShieldCheck, Shield, Clock, Loader2, Camera, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const BADGE_CONFIG = {
  nao_verificada: { label: "Não verificada", color: "bg-gray-100 text-gray-500", icon: Shield },
  em_analise: { label: "Em análise", color: "bg-blue-100 text-blue-700", icon: Clock },
  verificada: { label: "Loja verificada", color: "bg-green-100 text-green-700", icon: BadgeCheck },
  representante_oficial: { label: "Representante oficial", color: "bg-amber-100 text-amber-700", icon: ShieldCheck },
};

function FieldBlock({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export default function StoreVerificationBlock({ profile, onRefresh }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [form, setForm] = useState({
    responsible_name: profile?.responsible_name || "",
    cpf_cnpj: "",
    phone: profile?.whatsapp || "",
    city: profile?.city || "",
    state: profile?.region || "",
    notes: "",
  });

  const status = profile?.verification_status || "nao_verificada";
  const badge = BADGE_CONFIG[status] || BADGE_CONFIG.nao_verificada;
  const BadgeIcon = badge.icon;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.responsible_name.trim() || !form.cpf_cnpj.trim() || !form.phone.trim()) {
      toast.error("Preencha nome, CPF/CNPJ e telefone.");
      return;
    }
    setSubmitting(true);
    let document_image = null;
    if (docFile) {
      const res = await base44.integrations.Core.UploadFile({ file: docFile });
      document_image = res.file_url;
    }
    await base44.entities.StoreVerificationRequest.create({
      store_id: profile.id,
      owner_email: profile.owner_email,
      ...form,
      document_image,
    });
    // Update store status to em_analise — owner can update basic fields
    await base44.entities.SupplierProfile.update(profile.id, { verification_status: "em_analise" });
    setSubmitting(false);
    setDrawerOpen(false);
    toast.success("Solicitação enviada! Em breve nossa equipe vai revisar.");
    onRefresh?.();
  };

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Verificação da loja</p>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${badge.color}`}>
          <BadgeIcon className="h-4 w-4" />
          {badge.label}
        </div>

        {status === "nao_verificada" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verificar sua loja aumenta a confiança dos compradores e dá acesso ao selo <strong>Loja verificada</strong>.
            </p>
            <Button className="w-full h-10 rounded-xl font-bold gap-2 text-sm" onClick={() => setDrawerOpen(true)}>
              <ShieldCheck className="h-4 w-4" /> Solicitar verificação
            </Button>
          </div>
        )}

        {status === "em_analise" && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sua solicitação está sendo analisada pela nossa equipe. Você será notificado em breve.
          </p>
        )}

        {(status === "verificada" || status === "representante_oficial") && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Parabéns! Sua loja está verificada e exibe o selo de confiança para os compradores.
          </p>
        )}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Solicitar verificação
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 space-y-4 pb-2 max-h-[65vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preencha os dados abaixo. Nossa equipe vai verificar e aprovar em até 3 dias úteis.
            </p>

            <FieldBlock label="Nome do responsável *">
              <Input className="h-12 rounded-xl" placeholder="Nome completo" value={form.responsible_name} onChange={e => set("responsible_name", e.target.value)} />
            </FieldBlock>

            <FieldBlock label="CPF ou CNPJ *" hint="Somente números">
              <Input className="h-12 rounded-xl" placeholder="000.000.000-00 ou 00.000.000/0001-00" value={form.cpf_cnpj} onChange={e => set("cpf_cnpj", e.target.value)} />
            </FieldBlock>

            <FieldBlock label="Telefone / WhatsApp *">
              <Input className="h-12 rounded-xl" type="tel" placeholder="(62) 99999-9999" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </FieldBlock>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <FieldBlock label="Cidade *">
                  <Input className="h-12 rounded-xl" placeholder="Sua cidade" value={form.city} onChange={e => set("city", e.target.value)} />
                </FieldBlock>
              </div>
              <div>
                <FieldBlock label="UF">
                  <Input className="h-12 rounded-xl" placeholder="GO" maxLength={2} value={form.state} onChange={e => set("state", e.target.value.toUpperCase())} />
                </FieldBlock>
              </div>
            </div>

            <FieldBlock label="Documento (opcional)" hint="Foto do CNPJ, alvará ou qualquer comprovante comercial">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                  {docPreview
                    ? <>
                        <img src={docPreview} alt="doc" className="w-full h-full object-cover" />
                        <button type="button" onClick={e => { e.preventDefault(); setDocFile(null); setDocPreview(null); }}
                          className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </>
                    : <Camera className="h-6 w-6 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold text-primary">{docPreview ? "Trocar foto" : "Adicionar foto"}</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setDocFile(f); setDocPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            </FieldBlock>

            <FieldBlock label="Observações (opcional)" hint="Informações adicionais para a equipe de revisão">
              <Textarea className="rounded-xl text-sm min-h-[70px]" placeholder="Ex: Somos uma cooperativa com 15 anos de atuação..." value={form.notes} onChange={e => set("notes", e.target.value)} />
            </FieldBlock>
          </div>

          <DrawerFooter>
            <Button className="w-full rounded-xl font-bold gap-2" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              {submitting ? "Enviando..." : "Enviar solicitação"}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}