import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActivityView } from "@/components/activity/activity-view";
import { getAuditLogs, getLeadNotifications, usingMockData } from "@/lib/data";

export const metadata: Metadata = { title: "Journal" };

export default async function ActivityPage() {
  const [logs, notifications] = await Promise.all([getAuditLogs(), getLeadNotifications()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'activité"
        description="Événements entrants et alertes envoyées pour l'agent actif."
      />
      {usingMockData ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Connectez Supabase pour voir le journal d&apos;activité en temps réel.
        </div>
      ) : (
        <ActivityView logs={logs} notifications={notifications} />
      )}
    </div>
  );
}
