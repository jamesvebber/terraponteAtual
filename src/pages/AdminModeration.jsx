import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, EyeOff, CheckCircle2, Flag, ArrowLeft, RefreshCw, ShieldCheck, Store, X } from "lucide-react";
import { formatCNPJ } from "../utils/validators";
import { toast } from "sonner";

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  sold: "bg-gray-100 text-gray-500",
  pending_review: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-600",
  archived: "bg-gray-100 text-gray-400",
  reported: "bg-orange-100 text-orange-600",
};

export default function AdminModeration() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("listings");
  const [rejectReason, setRejectReason] = useState({});

  useEffect(() => {
    if (!isLoadingAuth && user?.role !== "admin") navigate("/");
  }, [isLoadingAuth, user]);

  const load = async () => {
    setLoading(true);
    const [ls, rs, vrs, stores] = await Promise.all([
      base44.entities.Listing.list("-created_date", 100),
      base44.entities.Report.filter({ status: "pending" }, "-created_date"),
      base44.entities.StoreVerificationRequest.filter({ status: "pendente" }, "-created_date"),
      base44.entities.SupplierProfile.filter({ verification_status: "nao_verificada" }, "-created_date", 50),
    ]);
    setListings(ls);
    setReports(rs);
    setVerificationRequests(vrs);
    setPendingStores(stores.filter(s => !s.is_suspended));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await base44.entities.Listing.update(id, { status });
    toast.success("Status atualizado.");
  };

  const deleteListing = async (id) => {
    setListings(prev => prev.filter(l => l.id !== id));
    await base44.entities.Listing.delete(id);
    toast.success("Anúncio removido.");
  };

  const dismissReport = async (id) => {
    setReports(prev => prev.filter(r => r.id !== id));
    await base44.entities.Report.update(id, { status: "dismissed" });
    toast.success("Denúncia arquivada.");
  };

  const resolveReport = async (report) => {
    await setStatus(report.target_id, "rejected");
    setReports(prev => prev.filter(r => r.id !== report.id));
    await base44.entities.Report.update(report.id, { status: "reviewed" });
    toast.success("Anúncio rejeitado e denúncia resolvida.");
  };

  const approveVerification = async (req, level = "verificada") => {
    await base44.entities.SupplierProfile.update(req.store_id, {
      verification_status: level,
      verified_at: new Date().toISOString(),
      verified_by: user.email,
    });
    await base44.entities.StoreVerificationRequest.update(req.id, {
      status: "aprovado",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.email,
    });
    setVerificationRequests(prev => prev.filter(r => r.id !== req.id));
    toast.success(`Loja aprovada como "${level === "representante_oficial" ? "Representante oficial" : "Loja verificada"}".`);
  };

  const rejectVerification = async (req) => {
    const reason = rejectReason[req.id] || "";
    await base44.entities.SupplierProfile.update(req.store_id, { verification_status: "nao_verificada", rejection_reason: reason });
    await base44.entities.StoreVerificationRequest.update(req.id, {
      status: "rejeitado",
      review_notes: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.email,
    });
    setVerificationRequests(prev => prev.filter(r => r.id !== req.id));
    toast.success("Solicitação rejeitada.");
  };

  const approveStore = async (store) => {
    await base44.entities.SupplierProfile.update(store.id, {
      verification_status: "verificada",
      verified_at: new Date().toISOString(),
      verified_by: user.email,
    });
    setPendingStores(prev => prev.filter(s => s.id !== store.id));
    toast.success(`Loja "${store.store_name}" verificada!`);
  };

  const suspendStore = async (store) => {
    const reason = rejectReason[store.id] || "";
    await base44.entities.SupplierProfile.update(store.id, { is_suspended: true, rejection_reason: reason });
    setPendingStores(prev => prev.filter(s => s.id !== store.id));
    toast.success("Loja suspensa.");
  };

  if (isLoadingAuth || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (user?.role !== "admin") return null;

  const pendingReview = listings.filter(l => l.status === "pending_review");
  const allActive = listings.filter(l => l.status === "active");
  const reported = listings.filter(l => l.report_count > 0);

  return (
    <div className="px-4 pt-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate("/")} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">Moderação</h1>
          <p className="text-xs text-muted-foreground">{listings.length} anúncios · {reports.length} denúncias · {verificationRequests.length} verificações</p>
        </div>
        <button onClick={load} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Ativos", value: allActive.length, color: "text-green-600" },
          { label: "Em revisão", value: pendingReview.length, color: "text-blue-600" },
          { label: "Denúncias", value: reports.length, color: "text-orange-600" },
          { label: "Verificações", value: verificationRequests.length, color: "text-purple-600" },
        { label: "Lojas novas", value: pendingStores.length, color: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4 gap-1 flex-wrap">
        {[
          { id: "listings", label: `Anúncios (${listings.length})` },
          { id: "reports", label: `Denúncias (${reports.length})` },
          { id: "verification", label: `Verificações (${verificationRequests.length})` },
          { id: "stores", label: `Lojas (${pendingStores.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all select-none ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {tab === "listings" && (
        <div className="space-y-3">
          {listings.map(l => (
            <div key={l.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm leading-tight truncate">{l.title}</h3>
                  <p className="text-xs text-muted-foreground">{l.seller_name} · {l.city}</p>
                  {l.report_count > 0 && (
                    <p className="text-xs text-orange-600 font-bold mt-0.5">⚠️ {l.report_count} denúncia{l.report_count !== 1 ? "s" : ""}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[l.status] || "bg-muted text-muted-foreground"}`}>
                  {l.status}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {l.status !== "active" && (
                  <button onClick={() => setStatus(l.id, "active")} className="h-8 px-3 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center gap-1 select-none">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ativar
                  </button>
                )}
                {l.status === "active" && (
                  <button onClick={() => setStatus(l.id, "paused")} className="h-8 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center gap-1 select-none">
                    <EyeOff className="h-3.5 w-3.5" /> Pausar
                  </button>
                )}
                <button onClick={() => setStatus(l.id, "rejected")} className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1 select-none">
                  <Flag className="h-3.5 w-3.5" /> Rejeitar
                </button>
                <button onClick={() => deleteListing(l.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center select-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports tab */}
      {tab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm font-bold text-foreground">Nenhuma denúncia pendente</p>
            </div>
          )}
          {reports.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-orange-600 mb-1">🚩 {r.reason}</p>
              <p className="text-sm font-bold text-foreground mb-0.5">{r.target_title || r.target_id}</p>
              {r.details && <p className="text-xs text-muted-foreground mb-2">{r.details}</p>}
              <p className="text-[10px] text-muted-foreground mb-3">
                Tipo: {r.target_type} · {new Date(r.created_date).toLocaleDateString("pt-BR")}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs" onClick={() => dismissReport(r.id)}>
                  Arquivar
                </Button>
                <Button size="sm" className="flex-1 rounded-xl text-xs bg-red-600 hover:bg-red-700" onClick={() => resolveReport(r)}>
                  Remover anúncio
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stores tab */}
      {tab === "stores" && (
        <div className="space-y-3">
          {pendingStores.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm font-bold text-foreground">Nenhuma loja nova pendente</p>
            </div>
          )}
          {pendingStores.map(store => (
            <div key={store.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                {store.logo_url
                  ? <img src={store.logo_url} alt={store.store_name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                  : <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Store className="h-6 w-6 text-primary" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{store.store_name}</p>
                  <p className="text-xs text-muted-foreground">{store.supplier_type} · {[store.city, store.region].filter(Boolean).join(", ")}</p>
                  {store.responsible_name && <p className="text-xs text-muted-foreground">Resp: {store.responsible_name}</p>}
                  {store.whatsapp && <p className="text-xs text-muted-foreground">📱 {store.whatsapp}</p>}
                  {store.cnpj && <p className="text-xs font-mono text-muted-foreground">CNPJ: {formatCNPJ(store.cnpj)}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(store.created_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <input
                className="w-full h-9 px-3 rounded-xl border border-border bg-muted/40 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Motivo da reprovação (se suspender)"
                value={rejectReason[store.id] || ""}
                onChange={e => setRejectReason(p => ({ ...p, [store.id]: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 rounded-xl text-xs bg-green-600 hover:bg-green-700 gap-1" onClick={() => approveStore(store)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verificar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs text-red-600 border-red-200" onClick={() => suspendStore(store)}>
                  <X className="h-3.5 w-3.5" /> Suspender
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification tab */}
      {tab === "verification" && (
        <div className="space-y-3">
          {verificationRequests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm font-bold text-foreground">Nenhuma solicitação pendente</p>
            </div>
          )}
          {verificationRequests.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Loja ID: {req.store_id}</p>
                  <p className="text-xs text-muted-foreground">{req.responsible_name} · {req.cpf_cnpj && formatCNPJ(req.cpf_cnpj)}</p>
                  <p className="text-xs text-muted-foreground">{req.phone} · {[req.city, req.state].filter(Boolean).join(", ")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(req.created_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              {req.notes && <p className="text-xs text-muted-foreground italic">"{req.notes}"</p>}
              {req.document_image && (
                <a href={req.document_image} target="_blank" rel="noopener noreferrer">
                  <img src={req.document_image} alt="Documento" className="w-full max-h-40 object-contain rounded-xl bg-muted" />
                </a>
              )}
              <input
                className="w-full h-9 px-3 rounded-xl border border-border bg-muted/40 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-2"
                placeholder="Motivo da reprovação (se rejeitar)"
                value={rejectReason[req.id] || ""}
                onChange={e => setRejectReason(p => ({ ...p, [req.id]: e.target.value }))}
              />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" className="rounded-xl text-xs bg-green-600 hover:bg-green-700 gap-1" onClick={() => approveVerification(req, "verificada")}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Aprovar
                </Button>
                <Button size="sm" className="rounded-xl text-xs bg-amber-600 hover:bg-amber-700 gap-1" onClick={() => approveVerification(req, "representante_oficial")}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Rep. Oficial
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 border-red-200" onClick={() => rejectVerification(req)}>
                  Rejeitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}