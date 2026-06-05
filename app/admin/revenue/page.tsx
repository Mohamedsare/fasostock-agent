import { Wallet, TrendingUp, Building2, Coins, Info, Trophy } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPlatformOrgs, PLATFORM_PLAN_PRICE_XOF } from "@/lib/admin-data";
import { formatNumber, formatXof, getInitials } from "@/lib/utils";

export const metadata = { title: "Revenus" };

export default async function AdminRevenuePage() {
  const orgs = await getPlatformOrgs();
  const paying = orgs.filter((o) => o.connectedAgents > 0);
  const mrr = paying.length * PLATFORM_PLAN_PRICE_XOF;
  const arr = mrr * 12;
  const potential = orgs.length * PLATFORM_PLAN_PRICE_XOF;
  const arpa = paying.length > 0 ? mrr / paying.length : 0;
  const conversionRate = orgs.length > 0 ? Math.round((paying.length / orgs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenus"
        description="Estimation des revenus récurrents de la plateforme."
      />

      {/* Estimation disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/5 p-3.5 text-sm text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <p>
          Estimation basée sur <b>{formatXof(PLATFORM_PLAN_PRICE_XOF)}/mois</b> par tenant actif (au moins un agent
          WhatsApp connecté). Branchez votre facturation pour des montants réels.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="MRR estimé" value={formatXof(mrr)} icon={Wallet} tone="success" hint="Revenu mensuel récurrent" />
        <KpiCard index={1} label="ARR estimé" value={formatXof(arr)} icon={TrendingUp} tone="indigo" hint="Sur 12 mois" />
        <KpiCard index={2} label="Tenants payants" value={`${paying.length}/${orgs.length}`} icon={Building2} tone="primary" hint={`${conversionRate}% activés`} />
        <KpiCard index={3} label="ARPA" value={formatXof(arpa)} icon={Coins} tone="accent" hint="Revenu moyen / tenant" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Paying tenants */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenants payants</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Contribution de chaque tenant actif au MRR.</p>
          </CardHeader>
          <CardContent className="px-2">
            {paying.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucun tenant payant" description="Aucune organisation n'a encore d'agent connecté." />
            ) : (
              <ul className="divide-y divide-border">
                {paying.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-indigo-500/10 text-indigo-500">{getInitials(o.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{o.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.connectedAgents} agent(s) connecté(s) · {o.members} membre(s)
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-success">
                      {formatXof(PLATFORM_PLAN_PRICE_XOF)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Potential / summary */}
        <Card>
          <CardHeader>
            <CardTitle>Potentiel</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Si tous les tenants devenaient actifs.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-primary/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MRR potentiel</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{formatXof(potential)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNumber(orgs.length)} tenant(s) × {formatXof(PLATFORM_PLAN_PRICE_XOF)}</p>
            </div>
            <div className="space-y-2.5 text-sm">
              <Row label="Tenants actifs" value={`${paying.length}/${orgs.length}`} />
              <Row label="Taux d'activation" value={`${conversionRate}%`} />
              <Row
                label="Manque à gagner"
                value={formatXof(potential - mrr)}
                badge={<Badge tone="warning" className="gap-1"><Trophy className="size-3" /> à activer</Badge>}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-medium tabular-nums text-foreground">
        {badge}
        {value}
      </span>
    </div>
  );
}
