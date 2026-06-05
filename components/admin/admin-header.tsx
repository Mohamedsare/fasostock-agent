import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

/** Top bar for the super-admin console. */
export function AdminHeader({
  name,
  email,
  demo,
}: {
  name: string;
  email: string;
  demo: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4 lg:px-6">
      {/* Mobile brand mark (desktop shows it in the sidebar). */}
      <Link href="/admin" className="shrink-0 lg:hidden" aria-label="Console">
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-500 text-white shadow-sm">
          <ShieldCheck className="size-5" />
        </span>
      </Link>

      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-sm font-semibold text-foreground sm:inline">Console super-admin</span>
        <Badge tone="info" className="gap-1.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-500">
          <ShieldCheck className="size-3.5" />
          Plateforme
        </Badge>
        {demo && (
          <Badge tone="warning" className="hidden sm:inline-flex">
            Mode démo
          </Badge>
        )}
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
        <ThemeToggle />
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
