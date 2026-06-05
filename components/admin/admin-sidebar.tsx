import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Desktop sidebar for the super-admin console — dark, fixed, indigo-accented. */
export function AdminSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Link
        href="/admin"
        className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5 text-white"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-500 text-white shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">
            Agent<span className="text-indigo-400">FS</span>
          </span>
          <span className="text-[11px] font-medium text-sidebar-muted">Console plateforme</span>
        </span>
      </Link>
      <ScrollArea className="flex-1">
        <AdminSidebarNav />
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl bg-indigo-500/10 p-3 text-xs text-sidebar-muted">
          <p className="font-medium text-sidebar-foreground">Super-administration</p>
          <p className="mt-0.5">Accès à tous les tenants de la plateforme.</p>
        </div>
      </div>
    </aside>
  );
}
