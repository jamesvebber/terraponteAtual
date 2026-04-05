import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, BellOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PREFS_CONFIG = [
  { key: "receive_general", label: "Novidades gerais", desc: "Atualizações e novidades do TerraPonte" },
  { key: "receive_regional_offers", label: "Ofertas da região", desc: "Novos anúncios perto de você" },
  { key: "receive_new_stores", label: "Novas lojas", desc: "Quando lojas novas entram no app" },
  { key: "receive_announce_reminder", label: "Lembrete para anunciar", desc: "Dicas para vender mais" },
  { key: "receive_weekly_digest", label: "Resumo semanal", desc: "Novidades da semana reunidas" },
];

export default function EmailPreferences({ userEmail }) {
  const [pref, setPref] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.EmailPreference.filter({ user_email: userEmail }).then(([found]) => {
      if (found) setPref(found);
      else setPref({
        user_email: userEmail,
        receive_general: true,
        receive_regional_offers: true,
        receive_new_stores: true,
        receive_announce_reminder: true,
        receive_weekly_digest: true,
        unsubscribed: false,
      });
      setLoading(false);
    });
  }, [userEmail]);

  const toggle = (key) => {
    setPref(p => ({ ...p, [key]: !p[key] }));
  };

  const save = async () => {
    setSaving(true);
    if (pref.id) {
      await base44.entities.EmailPreference.update(pref.id, pref);
    } else {
      const created = await base44.entities.EmailPreference.create(pref);
      setPref(created);
    }
    setSaving(false);
    toast.success("Preferências salvas!");
  };

  const unsubscribeAll = async () => {
    const updated = { ...pref, unsubscribed: true };
    setSaving(true);
    if (pref.id) {
      await base44.entities.EmailPreference.update(pref.id, updated);
    } else {
      const created = await base44.entities.EmailPreference.create(updated);
      updated.id = created.id;
    }
    setPref(updated);
    setSaving(false);
    toast.success("Você cancelou o recebimento de todos os e-mails.");
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!pref) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="font-extrabold text-foreground text-base">E-mails e notificações</h3>
      </div>

      {pref.unsubscribed ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <BellOff className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-700">E-mails desativados</p>
            <button onClick={() => setPref(p => ({ ...p, unsubscribed: false }))} className="text-xs text-amber-600 underline">Reativar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {PREFS_CONFIG.map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border transition-colors select-none ${
                  pref[key] ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border"
                }`}
              >
                <div className="text-left">
                  <p className={`text-sm font-bold ${pref[key] ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${pref[key] ? "bg-primary border-primary" : "border-border"}`}>
                  {pref[key] && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="flex-1 h-10 rounded-xl font-bold text-sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>

          <button onClick={unsubscribeAll} className="w-full text-xs text-muted-foreground text-center underline select-none">
            Cancelar todos os e-mails
          </button>
        </>
      )}
    </div>
  );
}