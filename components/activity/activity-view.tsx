"use client";

import { useState } from "react";
import {
  Activity,
  MessageSquareText,
  Webhook,
  Bell,
  CheckCircle2,
  XCircle,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { AuditLogRow } from "@/lib/data";

export interface NotificationRow {
  id: string;
  trigger: string;
  to_email: string;
  subject: string;
  status: string;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

const ACTION_LABEL: Record<string, string> = {
  inbound_message: "Message reçu",
  webhook_raw: "Webhook reçu",
};

const TRIGGER_LABEL: Record<string, string> = {
  prospect_qualifie: "Prospect qualifié",
  prospect_chaud: "Prospect chaud",
  client_converti: "Client converti",
  humain_requis: "Reprise humaine",
  support_important: "Support important",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function actionIcon(action: string) {
  if (action === "inbound_message") return MessageSquareText;
  if (action === "webhook_raw") return Webhook;
  return Activity;
}

export function ActivityView({
  logs,
  notifications,
}: {
  logs: AuditLogRow[];
  notifications: NotificationRow[];
}) {
  const [tab, setTab] = useState<"events" | "alerts">("events");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        <Button
          variant={tab === "events" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("events")}
        >
          <Activity className="size-4" /> Événements
          <Badge tone="neutral" className="ml-1">{logs.length}</Badge>
        </Button>
        <Button
          variant={tab === "alerts" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("alerts")}
        >
          <Bell className="size-4" /> Alertes
          <Badge tone="neutral" className="ml-1">{notifications.length}</Badge>
        </Button>
      </div>

      {tab === "events" ? (
        logs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Aucun événement"
            description="Les messages entrants et webhooks de cet agent apparaîtront ici."
          />
        ) : (
          <div className="grid gap-2">
            {logs.map((log) => {
              const Icon = actionIcon(log.action);
              const phone =
                (log.metadata?.phone as string | undefined) ?? undefined;
              return (
                <Card key={log.id} className="flex items-center gap-3 p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                      <Badge tone="neutral" className="text-[10px]">{log.actor}</Badge>
                    </div>
                    {phone && (
                      <span className="truncate text-sm text-muted-foreground">{phone}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(log.created_at)}
                  </span>
                </Card>
              );
            })}
          </div>
        )
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune alerte"
          description="Les alertes envoyées au numéro de relais (prospect qualifié, reprise humaine…) s'afficheront ici."
        />
      ) : (
        <div className="grid gap-2">
          {notifications.map((n) => {
            const ok = n.status === "sent";
            return (
              <Card key={n.id} className="flex items-center gap-3 p-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full ${
                    ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {TRIGGER_LABEL[n.trigger] ?? n.trigger}
                    </span>
                    <Badge tone={ok ? "success" : "danger"}>{ok ? "Envoyée" : "Échec"}</Badge>
                  </div>
                  <span className="truncate text-sm text-muted-foreground">
                    Vers {n.to_email}
                    {n.error ? ` · ${n.error}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(n.created_at)}
                </span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
