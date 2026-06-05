import Link from "next/link";
import {
  Building2,
  Users,
  Bot,
  MessagesSquare,
  Sparkles,
  Trophy,
  Wallet,
  Wifi,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Crown,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { GrowthChart } from "@/components/admin/growth-chart";
import { StatusChart } from "@/components/dashboard/status-chart";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlatformOverview, PLATFORM_PLAN_PRICE_XOF } from "@/lib/admin-data";
import { formatCompact, formatNumber, formatXof, getInitials, timeAgo } from "@/lib/utils";

export const metadata = { title: "Vue d'ensemble" };

export default async function AdminOverviewPage() {
  const data = await getPlatformOverview();
  const t = data.totals;
  const aiShare = t.messages > 0 ? Math.round((t.aiMessages / t.messages) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vue d'ensemble"
        description="Supervision de toute la plateforme AgentFS — tenants, utilisateurs, agents et activité."
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          index={0}
          label="Organisations"
          value={t.orgs}
          icon={Building2}
          tone="indigo"
          delta={{ value: `+${data.growth.newOrgs7d} / 7j`, positive: data.growth.newOrgs7d > 0 }}
        />
        <KpiCard
          index={1}
          label="Utilisateurs"
          value={t.users}
          icon={Users}
          tone="primary"
          delta={{ value: `+${data.growth.newUsers7d} / 7j`, positive: data.growth.newUsers7d > 0 }}
        />
        <KpiCard
          index={2}
          label="Agents connectés"
          value={`${t.connectedAgents}/${t.agents}`}
          icon={Bot}
          tone="success"
          hint={`${t.activeTenants} tenant(s) actif(s)`}
        />
        <KpiCard
          index={3}
          label="Conversations"
          value={t.conversations}
          icon={MessagesSquare}
          tone="info"
          delta={{ value: `+${data.growth.newConversations7d} / 7j`, positive: data.growth.newConversations7d > 0 }}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard index={0} label="Messages traités" value={formatCompact(t.messages)} icon={MessagesSquare} tone="neutral" hint={`${aiShare}% par l'IA`} />
        <KpiCard index={1} label="Prospects qualifiés" value={t.qualified} icon={Sparkles} tone="accent" />
        <KpiCard index={2} label="Clients convertis" value={t.converted} icon={Trophy} tone="primary" />
        <KpiCard index={3} label="MRR estimé" value={formatXof(t.mrrXof)} icon={Wallet} tone="success" hint={`${formatNumber(PLATFORM_PLAN_PRICE_XOF)} FCFA / tenant actif`} />
      </div>

      {/* Growth + distribution */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Croissance</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Nouvelles organisations et utilisateurs (8 semaines).</p>
            </div>
            <div className="hidden items-center gap-3 text-xs sm:flex">
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-indigo-500" /> Orgs</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Users</span>
            </div>
          </CardHeader>
          <CardContent>
            <GrowthChart data={data.signupSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenants par taille</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Répartition selon le nombre d'agents.</p>
          </CardHeader>
          <CardContent>
            {data.agentBuckets.every((b) => b.value === 0) ? (
              <EmptyState icon={Bot} title="Pas encore de données" />
            ) : (
              <StatusChart data={data.agentBuckets} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top orgs + recent signups */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Top organisations</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/organizations">
                Tout voir <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-2">
            {data.topOrgs.length === 0 ? (
              <EmptyState icon={Building2} title="Aucune organisation" />
            ) : (
              <ul className="divide-y divide-border">
                {data.topOrgs.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-indigo-500/10 text-indigo-500">{getInitials(o.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{o.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.members} membre(s) · {o.agents} agent(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-foreground">{formatNumber(o.conversations)}</p>
                      <p className="text-[11px] text-muted-foreground">conversations</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Derniers inscrits</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users">
                Voir <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-lg p-2">
                <Avatar className="size-9">
                  <AvatarFallback>{getInitials(u.fullName ?? u.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{u.fullName ?? u.email.split("@")[0]}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.orgName ?? "—"}</p>
                </div>
                {u.isOwner ? (
                  <Badge tone="primary" className="gap-1"><Crown className="size-3" /></Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Integrations health */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>État des intégrations</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/system">
              Système <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.integrations.map((i) => (
              <div key={i.key} className="flex items-center gap-2.5 rounded-xl border border-border p-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${i.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {i.ok ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-medium text-foreground">
                    <Wifi className="size-3 text-muted-foreground" /> {i.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{i.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
