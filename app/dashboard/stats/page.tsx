import { TrendingUp, Users, Flame, Trophy, MapPin, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusChart, type StatusDatum } from "@/components/dashboard/status-chart";
import { Funnel } from "@/components/stats/funnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getConversations, getDashboardStats } from "@/lib/data";
import { LEAD_STATUS_META } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types";

export const metadata = { title: "Statistiques" };

const CHART_COLORS: Partial<Record<LeadStatus, string>> = {
  nouveau: "#94a3b8",
  prospect_froid: "#60a5fa",
  prospect_tiede: "#f59e0b",
  prospect_chaud: "#f97316",
  prospect_qualifie: "#16a34a",
  client_converti: "#0ea5e9",
  support_client: "#6366f1",
};

function topCounts(values: (string | null)[], n: number) {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v?.trim();
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default async function StatsPage() {
  const [stats, conversations] = await Promise.all([getDashboardStats(), getConversations()]);

  const count = (s: LeadStatus) => conversations.filter((c) => c.status === s).length;

  const funnel = [
    { label: "Tous les contacts", value: conversations.length, color: "#94a3b8" },
    { label: "Tièdes et +", value: conversations.filter((c) => ["prospect_tiede", "prospect_chaud", "prospect_qualifie", "client_converti"].includes(c.status)).length, color: "#f59e0b" },
    { label: "Chauds / qualifiés", value: count("prospect_chaud") + count("prospect_qualifie"), color: "#16a34a" },
    { label: "Convertis", value: count("client_converti"), color: "#0ea5e9" },
  ];

  const statusData: StatusDatum[] = (Object.keys(CHART_COLORS) as LeadStatus[])
    .map((s) => ({ label: LEAD_STATUS_META[s].label, value: count(s), color: CHART_COLORS[s]! }))
    .filter((d) => d.value > 0);

  const topCities = topCounts(conversations.map((c) => c.contact.city), 5);
  const topActivities = topCounts(conversations.map((c) => c.contact.business_type), 5);
  const avgScore = conversations.length
    ? Math.round(conversations.reduce((s, c) => s + c.score, 0) / conversations.length)
    : 0;

  const empty = conversations.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Statistiques" description="Performance de votre prospection et de l'agent IA." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Taux de conversion" value={formatPercent(stats.conversionRate)} icon={TrendingUp} tone="success" />
        <StatCard index={1} label="Score moyen" value={`${avgScore}/100`} icon={Flame} tone="accent" />
        <StatCard index={2} label="Prospects qualifiés" value={stats.qualifiedProspects + stats.hotProspects} icon={Users} tone="primary" />
        <StatCard index={3} label="Clients convertis" value={stats.convertedClients} icon={Trophy} tone="info" />
      </div>

      {empty ? (
        <EmptyState icon={TrendingUp} title="Pas encore de données" description="Les statistiques s'afficheront dès les premières conversations." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Entonnoir de conversion</CardTitle></CardHeader>
            <CardContent><Funnel stages={funnel} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Répartition par statut</CardTitle></CardHeader>
            <CardContent>
              {statusData.length ? <StatusChart data={statusData} /> : <p className="text-sm text-muted-foreground">—</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <CardTitle>Top villes</CardTitle>
            </CardHeader>
            <CardContent>
              <RankList items={topCities} total={conversations.length} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Briefcase className="size-4 text-muted-foreground" />
              <CardTitle>Top activités</CardTitle>
            </CardHeader>
            <CardContent>
              <RankList items={topActivities} total={conversations.length} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function RankList({ items, total }: { items: [string, number][]; total: number }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée.</p>;
  return (
    <ul className="space-y-3">
      {items.map(([label, n]) => (
        <li key={label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium text-foreground">{label}</span>
            <span className="tabular-nums text-muted-foreground">{n}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
