import Link from "next/link";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/dashboard/user-menu";
import { AgentSwitcher, type SwitcherAgent } from "@/components/dashboard/agent-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

/** Top bar of the dashboard: mobile menu, agent switcher, AI status, user menu. */
export function Header({
  name,
  email,
  aiEnabled,
  agents = [],
  activeAgentId = null,
  isSuperAdmin = false,
}: {
  name: string;
  email: string;
  aiEnabled: boolean;
  agents?: SwitcherAgent[];
  activeAgentId?: string | null;
  isSuperAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4 lg:px-6">
      {/* Mobile brand mark (desktop shows it in the sidebar; menu lives in the bottom bar). */}
      <Link href="/dashboard" className="shrink-0 lg:hidden" aria-label="Accueil">
        <Logo withWordmark={false} />
      </Link>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
        <AgentSwitcher agents={agents} activeId={activeAgentId} />
        <Badge tone={aiEnabled ? "success" : "neutral"} className="gap-1.5">
          <span className={`size-1.5 rounded-full ${aiEnabled ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
          <span className="hidden sm:inline">{aiEnabled ? "IA active" : "IA en pause"}</span>
        </Badge>
        <ThemeToggle />
        <UserMenu name={name} email={email} isSuperAdmin={isSuperAdmin} />
      </div>
    </header>
  );
}
