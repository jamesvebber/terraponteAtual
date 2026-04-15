import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Loader2, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminQueue() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dispatches, setDispatches] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchQueue();
  }, [isAuthenticated, user]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      // For now, list all dispatches (in a real app, you might filter by permissions)
      const results = await base44.entities.WhatsAppDispatch.list();
      setDispatches(results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error("Error fetching queue:", error);
      toast.error("Erro ao carregar fila de disparos.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/profile");
    return null;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'enviado':
        return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Enviado</Badge>;
      case 'falhou':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="px-4 pt-5 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Fila de WhatsApp <MessageSquare className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Controle de automação regional</p>
        </div>
      </div>

      <div className="space-y-4">
        {dispatches.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Nenhum disparo na fila ainda.</p>
          </div>
        ) : (
          dispatches.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl border bg-card hover:border-primary/30 transition-all shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground leading-tight">{item.listing_title}</h3>
                  <p className="text-[10px] text-muted-foreground">ID: {item.listing_id}</p>
                </div>
                {getStatusBadge(item.status)}
              </div>
              
              <div className="flex flex-col gap-2 border-t pt-3 border-border/50 mt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider">Região Alvo</span>
                  <span className="text-foreground font-bold">{item.target_region}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider">Agendado para</span>
                  <span className="text-foreground font-bold">
                    {new Date(item.scheduled_date).toLocaleDateString('pt-BR')} {new Date(item.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5"
                  onClick={() => navigate(`/marketplace/${item.listing_id}`)}
                >
                  <ExternalLink className="h-3 w-3" /> Ver Anúncio
                </Button>
                {item.status === 'falhou' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-9 rounded-xl text-xs font-bold"
                    onClick={() => toast.info("Tentando re-enviar...")}
                  >
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground font-medium mt-8 px-6">
        Os disparos são processados a cada 30 minutos por nossos bots regionais no WhatsApp.
      </p>
    </div>
  );
}
