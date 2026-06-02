import { PageHeader } from "@/components/dashboard/page-header";
import { QualifiedLeadsView } from "@/components/prospects/qualified-leads-view";
import { getConversations } from "@/lib/data";

export const metadata = { title: "Clients qualifiés" };

export default async function QualifiedLeadsPage() {
  const all = await getConversations();
  const leads = all.filter(
    (c) => c.status === "prospect_qualifie" || c.status === "prospect_chaud",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients qualifiés"
        description={`${leads.length} prospect(s) prêt(s) à convertir.`}
      />
      <QualifiedLeadsView conversations={leads} />
    </div>
  );
}
