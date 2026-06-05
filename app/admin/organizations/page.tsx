import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrgTable } from "@/components/admin/org-table";
import { getPlatformOrgs } from "@/lib/admin-data";

export const metadata = { title: "Organisations" };

export default async function AdminOrganizationsPage() {
  const orgs = await getPlatformOrgs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        description={`${orgs.length} tenant(s) sur la plateforme.`}
      >
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Building2 className="size-4" /> {orgs.filter((o) => o.connectedAgents > 0).length} actif(s)
        </span>
      </PageHeader>
      <OrgTable orgs={orgs} />
    </div>
  );
}
