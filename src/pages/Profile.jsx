import { useState } from "react";
import { base44 } from "@/api/base44Client";
import EmailPreferences from "../components/EmailPreferences";
import LocationCapture from "../components/LocationCapture";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User, LogOut, Trash2, ChevronRight, Moon, Sun, Shield, HelpCircle,
  Pencil, X, Check, FileText, Store, Package, CreditCard, MessageSquare,
  Crown, Star, Zap, Phone, Camera, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/* ── small reusable pieces ────────────────────────────────────── */
function SettingsRow({ icon: Icon, label, sublabel, onClick, danger = false, rightEl = undefined }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors select-none active:bg-muted/60 ${danger ? "text-destructive" : "text-foreground"}`}
    >
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-destructive/10" : "bg-muted"}`}>
        <Icon className={`h-4 w-4 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{sublabel}</p>}
      </div>
      {rightEl ?? (!danger && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />)}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      {title && <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">{title}</p>}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

/* ── guest screen ─────────────────────────────────────────────── */
function GuestScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <User className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-extrabold text-foreground mb-2">Bem-vindo ao TerraPonte</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Crie uma conta ou entre para anunciar produtos, conectar com compradores e acessar todas as funcionalidades do TerraPonte.
      </p>
      <Button
        className="w-full max-w-xs h-12 rounded-xl font-bold text-base mb-3"
        onClick={() => base44.auth.redirectToLogin(window.location.href)}
      >
        Entrar / Criar conta
      </Button>
      <p className="text-xs text-muted-foreground">
        Você pode navegar pelo Marketplace sem conta.
      </p>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────── */
export default function Profile() {
  const { user, isAuthenticated, isLoadingAuth, sellerProfile, checkAppState } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(sellerProfile?.whatsapp || "");
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const navigate = useNavigate();

  const isLojista = sellerProfile?.seller_type === "Loja";

  const handleToggleLojista = async () => {
    setSavingType(true);
    const newType = isLojista ? "Produtor" : "Loja";
    if (sellerProfile) {
      await base44.entities.SellerProfile.update(sellerProfile.id, { seller_type: newType });
    } else {
      await base44.entities.SellerProfile.create({
        owner_email: user.email,
        seller_name: user.full_name || user.email,
        seller_type: newType,
      });
    }
    setSavingType(false);
    checkAppState();
    toast.success(newType === "Loja" ? "Perfil atualizado para Lojista! Acesse 'Minha Loja' para configurar." : "Perfil atualizado para Produtor.");
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <GuestScreen />;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (sellerProfile) {
      await base44.entities.SellerProfile.update(sellerProfile.id, { photo_url: file_url });
    } else {
      await base44.entities.SellerProfile.create({
        owner_email: user.email,
        seller_name: user.full_name || user.email,
        seller_type: "Produtor",
        photo_url: file_url,
      });
    }
    setSavingPhoto(false);
    checkAppState();
    toast.success("Foto atualizada!");
  };

  const handleSaveName = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: name });
    setSaving(false);
    setEditing(false);
    toast.success("Nome atualizado!");
  };

  const handleSavePhone = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um número válido com DDD.");
      return;
    }
    setSavingPhone(true);
    if (sellerProfile) {
      await base44.entities.SellerProfile.update(sellerProfile.id, { whatsapp: phone });
    } else {
      await base44.entities.SellerProfile.create({
        owner_email: user.email,
        seller_name: user.full_name || user.email,
        seller_type: "Produtor",
        whatsapp: phone,
      });
    }
    setSavingPhone(false);
    setEditingPhone(false);
    checkAppState();
    toast.success("WhatsApp salvo! Será pré-preenchido nos seus anúncios.");
  };

  const toggleDark = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle("dark", next);
    setDarkMode(next);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    base44.auth.logout();
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Minha Conta</h1>
          <p className="text-xs text-muted-foreground font-medium">Minha conta no TerraPonte</p>
        </div>
      </div>

      {/* User card */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5 flex items-center gap-3">
        <label className="relative h-14 w-14 rounded-full shrink-0 cursor-pointer group">
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          {sellerProfile?.photo_url ? (
            <img src={sellerProfile.photo_url} alt="Foto" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-extrabold text-primary">
                {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {savingPhoto ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
          </div>
        </label>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex gap-2 items-center">
              <Input
                className="h-9 rounded-xl text-sm flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 select-none"
              >
                <Check className="h-4 w-4 text-primary-foreground" />
              </button>
              <button
                onClick={() => { setEditing(false); setName(user?.full_name || ""); }}
                className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0 select-none"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">{user?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="ml-2 h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 select-none"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tipo de perfil — Lojista toggle */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isLojista ? "bg-primary/10" : "bg-muted"}`}>
              <Store className={`h-4 w-4 ${isLojista ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Sou Lojista / Fornecedor</p>
              <p className="text-xs text-muted-foreground leading-snug">
                {isLojista
                  ? "Acesse 'Minha Loja' para gerenciar produtos e clientes próximos"
                  : "Ative para acessar funcionalidades de loja e planos Business"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleLojista}
            disabled={savingType}
            className={`h-7 w-13 rounded-full transition-colors relative shrink-0 ml-2 ${isLojista ? "bg-primary" : "bg-muted"} ${savingType ? "opacity-50" : ""}`}
            style={{ minWidth: 52 }}
          >
            <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${isLojista ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {isLojista && (
          <button
            onClick={() => navigate("/minha-loja")}
            className="mt-3 w-full h-9 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-1.5 select-none"
          >
            <Store className="h-3.5 w-3.5" /> Gerenciar Minha Loja
          </button>
        )}
      </div>

      {/* Location capture */}
      <LocationCapture sellerProfile={sellerProfile} user={user} onSaved={checkAppState} />

      {/* WhatsApp card */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-600" />
            <p className="text-sm font-bold text-foreground">WhatsApp para anúncios</p>
          </div>
          {!editingPhone && (
            <button
              onClick={() => { setEditingPhone(true); setPhone(sellerProfile?.whatsapp || ""); }}
              className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center select-none"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        {editingPhone ? (
          <div className="flex gap-2 items-center mt-2">
            <Input
              className="h-9 rounded-xl text-sm flex-1"
              type="tel"
              inputMode="tel"
              placeholder="(62) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleSavePhone}
              disabled={savingPhone}
              className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 select-none"
            >
              <Check className="h-4 w-4 text-primary-foreground" />
            </button>
            <button
              onClick={() => setEditingPhone(false)}
              className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0 select-none"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-0.5">
            {sellerProfile?.whatsapp
              ? <span className="font-semibold text-green-700">{sellerProfile.whatsapp}</span>
              : <span className="italic">Não informado — será pedido ao publicar</span>}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
          Esse número será pré-preenchido automaticamente ao criar anúncios.
        </p>
      </div>

      {/* Plan Info Card */}
      {sellerProfile?.plan_type && sellerProfile.plan_type !== 'bronze' ? (
        <div className={`rounded-2xl p-4 mb-5 flex items-center gap-3 ${
          sellerProfile.plan_type === 'ouro' ? 'bg-amber-50 border border-amber-200' :
          sellerProfile.plan_type === 'prata' ? 'bg-blue-50 border border-blue-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
            sellerProfile.plan_type === 'ouro' ? 'bg-amber-200' :
            sellerProfile.plan_type === 'prata' ? 'bg-blue-200' :
            'bg-green-200'
          }`}>
            {sellerProfile.plan_type === 'ouro' ? <Crown className="h-6 w-6 text-amber-700" /> :
             sellerProfile.plan_type === 'prata' ? <Star className="h-6 w-6 text-blue-700" /> :
             <Zap className="h-6 w-6 text-green-700" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold ${
              sellerProfile.plan_type === 'ouro' ? 'text-amber-800' :
              sellerProfile.plan_type === 'prata' ? 'text-blue-800' :
              'text-green-800'
            }`}>
              Plano {sellerProfile.plan_type.toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              Válido até {sellerProfile.plan_expiry ? new Date(sellerProfile.plan_expiry).toLocaleDateString('pt-BR') : 'indefinido'}
            </p>
          </div>
          <button
            onClick={() => navigate("/planos")}
            className={`h-8 px-3 rounded-lg text-xs font-bold shrink-0 ${
              sellerProfile.plan_type === 'ouro' ? 'bg-amber-600 text-white hover:bg-amber-700' :
              sellerProfile.plan_type === 'prata' ? 'bg-blue-600 text-white hover:bg-blue-700' :
              'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Upgrade
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3 bg-gray-50 border border-gray-200">
          <div className="h-12 w-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
            <Shield className="h-6 w-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800">Plano Bronze</p>
            <p className="text-xs text-muted-foreground">1 anúncio ativo, funcionalidades básicas</p>
          </div>
          <button
            onClick={() => navigate("/planos")}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 shrink-0"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Aparência */}
      <Section title="Aparência">
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors select-none active:bg-muted/60"
        >
          <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
            {darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Tema</p>
            <p className="text-xs text-muted-foreground">{darkMode ? "Modo escuro ativo" : "Modo claro ativo"}</p>
          </div>
          <div className={`h-6 w-11 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"} relative shrink-0`}>
            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-1"}`} />
          </div>
        </button>
      </Section>

      {/* My Listings */}
      <Section title="Assinatura e Planos">
        <SettingsRow icon={CreditCard} label="Gerenciar Plano" sublabel="Veja seu plano atual e faturas" onClick={() => navigate("/planos")} />
      </Section>

      <Section title="Meus anúncios">
        <SettingsRow icon={Package} label="Meus anúncios" sublabel="Edite, pause ou exclua seus anúncios" onClick={() => navigate("/meus-anuncios")} />
      </Section>

      <Section title="Vendedor">
        <SettingsRow icon={Store} label="Perfil de vendedor" sublabel="Configure como os compradores te veem" onClick={() => navigate("/edit-seller-profile")} />
        <SettingsRow icon={Store} label="Minha loja de insumos" sublabel="Gerencie produtos, entregas e frete" onClick={() => navigate("/minha-loja")} />
      </Section>

      <Section title="Administração">
        <SettingsRow icon={MessageSquare} label="Fila de WhatsApp" sublabel="Acompanhe os disparos de marketing" onClick={() => navigate("/admin/fila")} />
      </Section>

      {/* Suporte */}
      <Section title="Suporte e privacidade">
        <SettingsRow icon={Shield} label="Política de privacidade" sublabel="Como seus dados são tratados" onClick={() => navigate("/privacy")} />
        <SettingsRow icon={FileText} label="Termos de uso" sublabel="Regras de uso do Mercado Rural" onClick={() => navigate("/terms")} />
        <SettingsRow
          icon={HelpCircle}
          label="Suporte"
          sublabel="Dúvidas? Fale com a gente"
          onClick={() => navigate("/support")}
        />
      </Section>

      {/* E-mail preferences */}
      <div className="mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">E-mails</p>
        <EmailPreferences userEmail={user?.email} />
      </div>

      {/* Conta */}
      <Section title="Conta">
        <SettingsRow icon={LogOut} label="Sair" sublabel="Deslogar do TerraPonte" onClick={() => base44.auth.logout()} />
      </Section>

      {/* Zona de perigo */}
      <Section title="Zona de perigo">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div>
              <SettingsRow
                icon={Trash2}
                label="Excluir conta"
                sublabel="Remove permanentemente sua conta e dados pessoais"
                onClick={() => {}}
                danger
                rightEl={null}
              />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Sua conta e dados pessoais serão excluídos permanentemente. Anúncios publicados podem ser removidos.
                Esta ação não pode ser desfeita. Dados exigidos por lei podem ser retidos pelo período obrigatório.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Sim, excluir conta"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>

      <div className="h-4" />
    </div>
  );
}