import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  "Anúncio falso",
  "Produto indisponível",
  "Preço incorreto",
  "Contato não responde",
  "Conteúdo impróprio",
  "Spam",
  "Outro",
];

export default function ReportSheet({ open, onClose, targetType, targetId, targetTitle }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error("Selecione um motivo"); return; }
    setSubmitting(true);
    await base44.entities.Report.create({
      target_type: targetType,
      target_id: targetId,
      target_title: targetTitle,
      reason,
      details,
    });
    setSubmitting(false);
    setDone(true);
  };

  const handleClose = () => {
    setReason("");
    setDetails("");
    setDone(false);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            Denunciar {targetType === "listing" ? "anúncio" : "vendedor"}
          </DrawerTitle>
        </DrawerHeader>

        {done ? (
          <div className="px-4 py-8 flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
            <h3 className="font-bold text-foreground text-base mb-1">Denúncia enviada</h3>
            <p className="text-sm text-muted-foreground">Nossa equipe vai analisar em breve. Obrigado por contribuir com a segurança da plataforma.</p>
          </div>
        ) : (
          <div className="px-4 space-y-4 pb-2">
            <p className="text-sm text-muted-foreground">Selecione o motivo da denúncia:</p>
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border transition-colors select-none ${
                    reason === r
                      ? "bg-destructive/10 border-destructive text-destructive"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {reason === "Outro" && (
              <Textarea
                className="rounded-xl text-sm"
                placeholder="Descreva o problema (opcional)..."
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
            )}
          </div>
        )}

        <DrawerFooter>
          {done ? (
            <Button className="w-full rounded-xl" onClick={handleClose}>Fechar</Button>
          ) : (
            <>
              <Button
                className="w-full rounded-xl bg-destructive hover:bg-destructive/90"
                onClick={handleSubmit}
                disabled={submitting || !reason}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar denúncia"}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">Cancelar</Button>
              </DrawerClose>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}