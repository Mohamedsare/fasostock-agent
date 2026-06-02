import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { LabsSimulator } from "@/components/labs/labs-simulator";
import { getAgentSettings } from "@/lib/data";
import { features } from "@/lib/env";
import { FlaskConical } from "lucide-react";

export const metadata = { title: "Labs IA" };

export default async function LabsPage() {
  const settings = await getAgentSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Labs IA"
        description="Simulez une conversation et observez en direct la réponse, le score et le statut de l'agent."
      >
        <Badge tone={features.openai ? "success" : "warning"} className="gap-1.5">
          <FlaskConical className="size-3.5" />
          {features.openai ? "LLM connecté" : "Mode local (sans clé LLM)"}
        </Badge>
      </PageHeader>

      <LabsSimulator defaultTone={settings.tone} defaultPrompt={settings.system_prompt} />
    </div>
  );
}
