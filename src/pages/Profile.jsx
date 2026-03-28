import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User, LogOut, Trash2, ChevronRight, Moon, Sun, Shield, HelpCircle,
  Pencil, X, Check, FileText, Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/* ── small reusable pieces ────────────────────────────────────── */
function SettingsRow({ icon: Icon, label, sublabel, onClick, danger, rightEl }) {
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
      <h2 className="text-xl font-extrabold text-foreground mb-2">Bem-vindo ao Mercado Rural</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        Crie uma conta ou entre para anunciar produtos, gerenciar seus anúncios e acessar todas as funcionalidades.
      </p>
      <Button
        className="w-full max-w-xs h-12 rounded-xl font-bold text-base mb-3"
        onClick={() => base44.auth.redirectToLogin(window.location.href)}
      >
        Entrar / Criar conta
      </Button>
      <p className="text-xs text-muted-foreground">
        Você pode navegar pelo marketplace sem conta.
      </p>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────── */
export default function Profile() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const navigate = useNavigate();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <GuestScreen />;

  const handleSaveName = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: name });
    setSaving(false);
    setEditing(false);
    toast.success("Perfil atualizado!");
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
          <p className="text-xs text-muted-foreground font-medium">Perfil e configurações</p>
        </div>
      </div>

      {/* User card */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5 flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-2xl font-extrabold text-primary">
            {user?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
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

      {/* Seller profile */}
      <Section title="Vendedor">
        <SettingsRow icon={Store} label="Perfil de vendedor" sublabel="Configure como os compradores te veem" onClick={() => navigate("/edit-seller-profile")} />
      </Section>

      {/* Suporte */}
      <Section title="Suporte e legal">
        <SettingsRow icon={Shield} label="Política de privacidade" sublabel="Como seus dados são tratados" onClick={() => {}} />
        <SettingsRow icon={FileText} label="Termos de uso" sublabel="Regras de uso do Mercado Rural" onClick={() => {}} />
        <SettingsRow icon={HelpCircle} label="Suporte" sublabel="Dúvidas ou problemas? Fale conosco" onClick={() => {}} />
      </Section>

      {/* Conta */}
      <Section title="Conta">
        <SettingsRow icon={LogOut} label="Sair" onClick={() => base44.auth.logout()} />
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