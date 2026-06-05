import { Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { getPlatformUsers } from "@/lib/admin-data";

export const metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage() {
  const users = await getPlatformUsers();

  return (
    <div className="space-y-6">
      <PageHeader title="Utilisateurs" description={`${users.length} utilisateur(s) tous tenants confondus.`}>
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Users className="size-4" /> {users.filter((u) => u.isOwner).length} propriétaire(s)
        </span>
      </PageHeader>
      <UsersTable users={users} />
    </div>
  );
}
