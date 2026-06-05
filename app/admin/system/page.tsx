import {
  CheckCircle2,
  XCircle,
  ServerCog,
  Cpu,
  ShieldCheck,
  Globe,
  Mail,
  KeyRound,
  Lock,
  Webhook,
  Coins,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getIntegrationStatuses, PLATFORM_PLAN_PRICE_XOF } from "@/lib/admin-data";
import { serverEnv } from "@/lib/env";
import { formatXof } from "@/lib/utils";

export const metadata = { title: "Système" };

/** Read a non-throwing env getter; fall back to a placeholder on error. */
function safe(fn: () => string, fallback = "—"): string {
  try {
    return fn() || fallback;
  } catch {
    return fallback;
  }
}

export default async function AdminSystemPage() {
  const integrations = getIntegrationStatuses();

  const config: { icon: typeof Cpu; label: string; value: string }[] = [
    { icon: Cpu, label: "Modèle OpenAI", value: safe(() => serverEnv.openaiModel) },
    { icon: Globe, label: "URL de l'app", value: safe(() => serverEnv.appUrl) },
    { icon: Mail, label: "Expéditeur email", value: safe(() => serverEnv.resendFromEmail) },
    { icon: ShieldCheck, label: "Super-admin", value: safe(() => serverEnv.superAdminEmail) },
    { icon: Coins, label: "Prix / tenant actif", value: formatXof(PLATFORM_PLAN_PRICE_XOF) },
  ];

  const security: { icon: typeof Lock; label: string; ok: boolean; detail: string }[] = [
    {
      icon: KeyRound,
      label: "Service-role Supabase",
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: "Accès aux données plateforme",
    },
    {
      icon: Lock,
      label: "Chiffrement des secrets",
      ok: Boolean(process.env.APP_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: "Clés tenant chiffrées au repos",
    },
    {
      icon: Webhook,
      label: "Token compte Wasender",
      ok: Boolean(process.env.WASENDER_ACCOUNT_TOKEN || process.env.WASENDER_API_KEY),
      detail: "Gestion des sessions WhatsApp",
    },
  ];

  const healthy = integrations.filter((i) => i.ok).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Système" description="Santé des intégrations et configuration de la plateforme.">
        <Badge tone={healthy === integrations.length ? "success" : "warning"} className="gap-1.5">
          <ServerCog className="size-3.5" />
          {healthy}/{integrations.length} OK
        </Badge>
      </PageHeader>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Intégrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {integrations.map((i) => (
              <div key={i.key} className="flex items-center gap-3 rounded-xl border border-border p-3.5">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${i.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {i.ok ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{i.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{i.detail}</p>
                </div>
                <Badge tone={i.ok ? "success" : "danger"}>{i.ok ? "Actif" : "Inactif"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {config.map((c) => (
              <div key={c.label} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                <c.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <span className="ml-auto truncate text-right text-sm font-medium text-foreground">{c.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Sécurité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {security.map((s) => (
              <div key={s.label} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                <s.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.detail}</p>
                </div>
                <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${s.ok ? "bg-success/10 text-success" : "bg-warning/15 text-warning"}`}>
                  {s.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
