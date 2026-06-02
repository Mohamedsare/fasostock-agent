import { PageHeader } from "@/components/dashboard/page-header";
import { AgentForm } from "@/components/agent/agent-form";
import { getAgentSettings } from "@/lib/data";

export const metadata = { title: "Agent IA" };

export default async function AgentPage() {
  const settings = await getAgentSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent IA"
        description="Configurez le comportement, le ton et les règles de votre assistant WhatsApp."
      />
      <AgentForm settings={settings} />
    </div>
  );
}
