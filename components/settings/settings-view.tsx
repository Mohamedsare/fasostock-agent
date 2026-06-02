"use client";

import * as React from "react";
import { Check, Copy, Database, MessageCircle, Bot, Mail, CircleCheck, CircleAlert, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

export interface IntegrationStatus {
  supabase: boolean;
  wasender: boolean;
  openai: boolean;
  resend: boolean;
}

export function SettingsView({
  user,
  integrations,
  webhookUrl,
  appUrl,
}: {
  user: { name: string; email: string };
  integrations: IntegrationStatus;
  webhookUrl: string;
  appUrl: string;
}) {
  return (
    <div className="space-y-6">
      {/* Profil */}
      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-14 border border-border">
            <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge tone="primary"><User className="size-3.5" /> Admin</Badge>
        </CardContent>
      </Card>

      {/* Intégrations */}
      <div>
        <h2 className="mb-3 font-semibold text-foreground">Intégrations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <IntegrationCard icon={Database} name="Supabase" desc="Base de données, auth, realtime" ok={integrations.supabase} />
          <IntegrationCard icon={MessageCircle} name="Wasender (WhatsApp)" desc="Réception & envoi des messages" ok={integrations.wasender} />
          <IntegrationCard icon={Bot} name="OpenAI" desc="Génération des réponses IA" ok={integrations.openai} />
          <IntegrationCard icon={Mail} name="Resend" desc="Emails d'alerte à l'admin" ok={integrations.resend} />
        </div>
      </div>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook WhatsApp</CardTitle>
          <CardDescription>
            À coller dans Wasender → Webhooks. Ajoutez <code className="rounded bg-muted px-1">?secret=VOTRE_SECRET</code> à la fin
            (identique à <code className="rounded bg-muted px-1">WASENDER_WEBHOOK_SECRET</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CopyField value={webhookUrl} />
          {appUrl.includes("localhost") && (
            <p className="mt-2 text-xs text-warning">
              ⚠️ URL locale : définissez <code>APP_URL</code> / <code>NEXT_PUBLIC_APP_URL</code> sur votre domaine de production.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Apparence */}
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="font-semibold text-foreground">Apparence</p>
            <p className="text-sm text-muted-foreground">Basculer entre le thème clair et sombre.</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  name,
  desc,
  ok,
}: {
  icon: typeof Database;
  name: string;
  desc: string;
  ok: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
        {ok ? (
          <Badge tone="success"><CircleCheck className="size-3.5" /> Connecté</Badge>
        ) : (
          <Badge tone="warning"><CircleAlert className="size-3.5" /> À configurer</Badge>
        )}
      </div>
    </Card>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copié !");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible.");
    }
  }
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-sm">{value}</code>
      <Button size="icon" variant="outline" onClick={copy} aria-label="Copier">
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}
