import type { Metadata } from "next";
import { Database } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { requireSuperAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: { default: "Console super-admin", template: "%s · Console AgentFS" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, demo } = await requireSuperAdmin();

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader name={user.name} email={user.email} demo={demo} />
        {demo && (
          <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs font-medium text-warning lg:px-6">
            <Database className="size-3.5" />
            Mode démo — données plateforme fictives. Connectez Supabase pour superviser vos vrais tenants.
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6">
            {children}
          </div>
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
