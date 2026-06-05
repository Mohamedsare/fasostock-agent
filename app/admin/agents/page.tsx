import { Wifi } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AgentsTable } from "@/components/admin/agents-table";
import { getPlatformAgents } from "@/lib/admin-data";

export const metadata = { title: "Agents WhatsApp" };

export default async function AdminAgentsPage() {
  const agents = await getPlatformAgents();
  const connected = agents.filter((a) => a.connectionStatus === "connected").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents WhatsApp"
        description={`${agents.length} agent(s) configuré(s) sur la plateforme.`}
      >
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Wifi className="size-4 text-success" /> {connected} connecté(s)
        </span>
      </PageHeader>
      <AgentsTable agents={agents} />
    </div>
  );
}
