import { LifeBuoy, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProspectGrid } from "@/components/prospects/prospect-grid";
import { Card, CardContent } from "@/components/ui/card";
import { getConversations } from "@/lib/data";
import { SUPPORT_CATEGORY_META } from "@/lib/constants";
import type { LeadStatus, SupportCategory } from "@/lib/types";

export const metadata = { title: "Support client" };

const FILTERS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "support_client", label: "Support" },
  { value: "humain_requis", label: "Humain requis" },
];

export default async function SupportPage() {
  const all = await getConversations();
  const support = all.filter(
    (c) => c.status === "support_client" || c.status === "humain_requis",
  );
  const urgent = support.filter((c) => c.status === "humain_requis").length;

  // Count by support category.
  const byCategory = support.reduce<Record<string, number>>((acc, c) => {
    if (c.support_category) acc[c.support_category] = (acc[c.support_category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support client"
        description={`${support.length} demande(s) · ${urgent} urgente(s)`}
      />

      {urgent > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              {urgent} conversation(s) nécessitent une reprise humaine immédiate.
            </p>
          </CardContent>
        </Card>
      )}

      {Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(Object.entries(byCategory) as [SupportCategory, number][]).map(([cat, n]) => (
            <Card key={cat} className="p-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-4 text-info" />
                <span className="text-2xl font-bold tabular-nums">{n}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{SUPPORT_CATEGORY_META[cat]}</p>
            </Card>
          ))}
        </div>
      )}

      <ProspectGrid
        conversations={support}
        statusFilters={FILTERS}
        emptyTitle="Aucune demande de support"
        emptyDescription="Les clients existants qui sollicitent de l'aide apparaîtront ici."
      />
    </div>
  );
}
