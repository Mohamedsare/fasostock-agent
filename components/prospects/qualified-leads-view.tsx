"use client";

import { ProspectGrid } from "@/components/prospects/prospect-grid";
import { LeadActions } from "@/components/prospects/lead-actions";
import type { ConversationWithContact, LeadStatus } from "@/lib/types";

const FILTERS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "prospect_chaud", label: "Chauds" },
  { value: "prospect_qualifie", label: "Qualifiés" },
];

export function QualifiedLeadsView({ conversations }: { conversations: ConversationWithContact[] }) {
  return (
    <ProspectGrid
      conversations={conversations}
      statusFilters={FILTERS}
      emptyTitle="Aucun prospect qualifié"
      emptyDescription="Les prospects atteignant le seuil de qualification apparaîtront ici."
      renderActions={(c) => <LeadActions conversation={c} />}
    />
  );
}
