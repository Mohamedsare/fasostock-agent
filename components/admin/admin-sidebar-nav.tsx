"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

/** Navigation links for the super-admin console (desktop sidebar + mobile sheet). */
export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
        Plateforme
      </span>
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-500/15 text-white"
                : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400" />
            )}
            <item.icon
              className={cn(
                "size-[18px] shrink-0",
                active ? "text-indigo-400" : "text-sidebar-muted group-hover:text-white",
              )}
            />
            {item.label}
          </Link>
        );
      })}

      <div className="my-3 h-px bg-sidebar-border" />
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="size-[18px] shrink-0 text-sidebar-muted" />
        Retour à mon espace
      </Link>
    </nav>
  );
}
