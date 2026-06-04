"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, Loader2, Plus, QrCode, RefreshCw, Trash2, CheckCircle2, Circle } from "lucide-react";
import {
  createAgent,
  deleteAgent,
  connectAgentWhatsApp,
  refreshAgentConnection,
  setActiveAgent,
} from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface ManagedAgent {
  id: string;
  name: string;
  phone_number: string | null;
  connection_status: string;
  wasender_session_id: string | null;
}

function statusBadge(status: string) {
  if (status === "connected") return <Badge tone="success" className="gap-1"><CheckCircle2 className="size-3" /> Connecté</Badge>;
  if (status === "connecting") return <Badge tone="warning" className="gap-1"><Circle className="size-3" /> En attente du QR</Badge>;
  return <Badge tone="neutral" className="gap-1"><Circle className="size-3" /> Non connecté</Badge>;
}

export function AgentsManager({
  agents,
  activeId,
}: {
  agents: ManagedAgent[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [qrAgent, setQrAgent] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (success) toast.success(success);
        router.refresh();
      } else {
        toast.error(r.error ?? "Action échouée.");
      }
    });
  }

  function openConnect(agentId: string) {
    start(async () => {
      const r = await connectAgentWhatsApp(agentId);
      if (!r.ok) {
        toast.error(r.error ?? "Connexion échouée.");
        return;
      }
      setQrAgent(agentId);
      setQr(r.qr ?? null);
      router.refresh();
    });
  }

  function checkStatus(agentId: string) {
    start(async () => {
      const r = await refreshAgentConnection(agentId);
      if (!r.ok) {
        toast.error(r.error ?? "Vérification échouée.");
        return;
      }
      if (r.status === "connected") {
        toast.success("Numéro connecté ✅");
        setQrAgent(null);
        setQr(null);
      } else {
        toast.message("Pas encore connecté — scannez le QR puis réessayez.");
      }
      router.refresh();
    });
  }

  const qrSrc = qr
    ? qr.startsWith("data:")
      ? qr
      : `data:image/png;base64,${qr}`
    : null;

  return (
    <div className="space-y-6">
      {/* Create */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="agentName" className="text-sm font-medium">Nouvel agent</label>
            <Input
              id="agentName"
              placeholder="Ex : Ventes, Support…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            disabled={pending || !name.trim()}
            onClick={() => run(() => createAgent(name), "Agent créé.")}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Créer
          </Button>
        </div>
      </Card>

      {/* List */}
      {agents.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Aucun agent. Créez-en un pour commencer.
        </Card>
      ) : (
        <div className="grid gap-3">
          {agents.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.name}</span>
                    {a.id === activeId && <Badge tone="success">Actif</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {statusBadge(a.connection_status)}
                    {a.phone_number && <span>· {a.phone_number}</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {a.id !== activeId && (
                  <Button variant="outline" size="sm" disabled={pending}
                    onClick={() => run(() => setActiveAgent(a.id), "Agent actif changé.")}>
                    Rendre actif
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled={pending} onClick={() => openConnect(a.id)}>
                  <QrCode className="size-4" />
                  {a.connection_status === "connected" ? "Reconnecter" : "Connecter WhatsApp"}
                </Button>
                <Button variant="ghost" size="sm" disabled={pending}
                  onClick={() => {
                    if (confirm(`Supprimer l'agent « ${a.name} » et toutes ses données ?`)) {
                      run(() => deleteAgent(a.id), "Agent supprimé.");
                    }
                  }}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* QR dialog */}
      <Dialog open={qrAgent !== null} onOpenChange={(o) => { if (!o) { setQrAgent(null); setQr(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connecter le numéro WhatsApp</DialogTitle>
            <DialogDescription>
              Ouvrez WhatsApp → Appareils connectés → Connecter un appareil, puis scannez ce QR code.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR code WhatsApp" className="size-56 rounded-lg border border-border bg-white p-2" />
            ) : (
              <div className="flex size-56 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                QR indisponible — cliquez sur Vérifier.
              </div>
            )}
            <Button className="w-full" disabled={pending} onClick={() => qrAgent && checkStatus(qrAgent)}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              J&apos;ai scanné — Vérifier la connexion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
