import { PageHeader } from "@/components/dashboard/page-header";
import { KnowledgeManager } from "@/components/knowledge/knowledge-manager";
import { getKnowledge } from "@/lib/data";

export const metadata = { title: "Base de connaissance" };

export default async function KnowledgeBasePage() {
  const entries = await getKnowledge();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de connaissance"
        description="Les informations que l'agent IA utilise pour répondre avec précision."
      />
      <KnowledgeManager entries={entries} />
    </div>
  );
}
