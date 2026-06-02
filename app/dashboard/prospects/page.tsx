import { PageHeader } from "@/components/dashboard/page-header";
import { ProspectGrid } from "@/components/prospects/prospect-grid";
import { getConversations } from "@/lib/data";
import type { LeadStatus } from "@/lib/types";

export const metadata = { title: "Prospects" };

const FILTERS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "nouveau", label: "Nouveau" },
  { value: "prospect_froid", label: "Froid" },
  { value: "prospect_tiede", label: "Tiède" },
  { value: "prospect_chaud", label: "Chaud" },
  { value: "prospect_qualifie", label: "Qualifié" },
  { value: "perdu", label: "Perdu" },
];

export default async function ProspectsPage() {
  const all = await getConversations();
  // Prospects = everything except pure support clients.
  const prospects = all.filter((c) => c.status !== "support_client");

  return (
    <div className="space-y-6">
      <PageHeader title="Prospects" description={`${prospects.length} prospect(s) suivis.`} />
      <ProspectGrid conversations={prospects} statusFilters={FILTERS} />
    </div>
  );
}
