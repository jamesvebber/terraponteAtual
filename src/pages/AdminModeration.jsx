import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, EyeOff, CheckCircle2, Flag, ArrowLeft, RefreshCw } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("listings");

  useEffect(() => {
    if (!isLoadingAuth && user?.role !== "admin") navigate("/");
  }, [isLoadingAuth, user]);

  const load = async () => {
    setLoading(true);
    const [ls, rs] = await Promise.all([
      base44.entities.Listing.list("-created_date", 100),
      base44.entities.Report.filter({ status: "pending" }, "-created_date"),
    ]);
    setListings(ls);
    setReports(rs);
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
          <p className="text-xs text-muted-foreground">{listings.length} anúncios · {reports.length} denúncias pendentes</p>
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
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4 gap-1">
        {[
          { id: "listings", label: `Anúncios (${listings.length})` },
          { id: "reports", label: `Denúncias (${reports.length})` },
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
    </div>
  );
}