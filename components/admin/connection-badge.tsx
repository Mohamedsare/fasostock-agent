import { Badge } from "@/components/ui/badge";
import type { AgentConnectionStatus } from "@/lib/types";
import type { BadgeTone } from "@/lib/constants";

const META: Record<AgentConnectionStatus, { label: string; tone: BadgeTone; dot: string }> = {
  connected: { label: "Connecté", tone: "success", dot: "bg-success" },
  connecting: { label: "Connexion…", tone: "warning", dot: "bg-warning animate-pulse" },
  disconnected: { label: "Déconnecté", tone: "neutral", dot: "bg-muted-foreground" },
  error: { label: "Erreur", tone: "danger", dot: "bg-destructive" },
};

/** Coloured pill for a WhatsApp agent's connection state. */
export function ConnectionBadge({ status }: { status: AgentConnectionStatus }) {
  const m = META[status] ?? META.disconnected;
  return (
    <Badge tone={m.tone} className="gap-1.5">
      <span className={`size-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </Badge>
  );
}
