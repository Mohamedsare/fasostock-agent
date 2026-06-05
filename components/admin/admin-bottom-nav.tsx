"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, ShieldCheck } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { cn } from "@/lib/utils";

const PRIMARY = ADMIN_NAV_ITEMS.filter((i) => i.primary);

/** Fixed bottom tab bar for the super-admin console on phones (mobile-first). */
export function AdminBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {PRIMARY.map((t) => {
            const active = isActive(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-indigo-500" : "text-muted-foreground active:text-foreground",
                )}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-500" />}
                <t.icon className={cn("size-5 transition-transform", active && "scale-110")} />
                <span className="max-w-full truncate px-0.5">{t.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <Dialog.Trigger
            className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground active:text-foreground"
            aria-label="Plus de menus"
          >
            <Menu className="size-5" />
            Menu
          </Dialog.Trigger>
        </div>
      </nav>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-sidebar pb-[env(safe-area-inset-bottom)] shadow-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom lg:hidden">
          <Dialog.Title className="sr-only">Navigation plateforme</Dialog.Title>
          <div className="flex items-center justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-white/20" />
          </div>
          <div className="flex items-center gap-2.5 px-5 pt-3 text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-500 text-white">
              <ShieldCheck className="size-5" />
            </span>
            <span className="text-sm font-bold tracking-tight">
              Console <span className="text-indigo-400">super-admin</span>
            </span>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <AdminSidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
