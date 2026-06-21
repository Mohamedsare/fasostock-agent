"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MessagesSquare, Bot, UserCog, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { ScoreBar } from "@/components/score-bar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn, contactLabel, getInitials, timeAgo } from "@/lib/utils";
import type { ConversationWithContact, LeadStatus } from "@/lib/types";

const FILTERS: { value: "all" | LeadStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "nouveau", label: "Nouveau" },
  { value: "prospect_chaud", label: "Chauds" },
  { value: "prospect_qualifie", label: "Qualifiés" },
  { value: "support_client", label: "Support" },
  { value: "humain_requis", label: "Humain requis" },
  { value: "client_converti", label: "Convertis" },
];

const PER_PAGE = 10;

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function ConversationList({ conversations }: { conversations: ConversationWithContact[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | LeadStatus>("all");
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return (
        c.contact.name?.toLowerCase().includes(q) ||
        c.contact.phone.includes(q) ||
        c.contact.business_type?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q)
      );
    });
  }, [conversations, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  // Reset to page 1 when filter/search changes
  React.useEffect(() => { setPage(1); }, [query, filter]);

  // Clamp page if total pages decreases
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const to = Math.min(safePage * PER_PAGE, filtered.length);

  const pageNumbers = getPageNumbers(safePage, totalPages);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, numéro, activité…"
          className="pl-9"
        />
      </div>

      {/* Status filter chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? conversations.length
              : conversations.filter((c) => c.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className={cn("text-xs", filter === f.value ? "opacity-80" : "opacity-60")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="Aucune conversation"
          description={query || filter !== "all" ? "Aucun résultat pour ces filtres." : "Les conversations WhatsApp apparaîtront ici dès qu'un contact écrit."}
        />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {paginated.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/conversations/${c.id}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted sm:p-4"
                >
                  <div className="relative">
                    <Avatar className="size-11">
                      <AvatarFallback>{getInitials(contactLabel(c.contact.name, c.contact.phone))}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-card",
                        c.mode === "ai" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
                      )}
                      title={c.mode === "ai" ? "IA active" : "Mode humain"}
                    >
                      {c.mode === "ai" ? <Bot className="size-2.5" /> : <UserCog className="size-2.5" />}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">
                        {contactLabel(c.contact.name, c.contact.phone)}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-muted-foreground">{c.last_message_preview ?? "—"}</p>
                      {c.unread_count > 0 && (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <ScoreBar score={c.score} className="hidden sm:flex" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-1">
              {/* Count */}
              <p className="shrink-0 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{from}–{to}</span>
                {" "}sur{" "}
                <span className="font-medium text-foreground">{filtered.length}</span>
              </p>

              {/* Pages */}
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={safePage === 1}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg border border-border bg-card text-sm transition-colors",
                    safePage === 1
                      ? "cursor-not-allowed opacity-40"
                      : "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                  )}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {/* Page numbers */}
                {pageNumbers.map((n, i) =>
                  n === "…" ? (
                    <span key={`ellipsis-${i}`} className="grid size-9 place-items-center text-sm text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={cn(
                        "grid size-9 place-items-center rounded-lg border text-sm font-medium transition-all",
                        n === safePage
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                      )}
                    >
                      {n}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={safePage === totalPages}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg border border-border bg-card text-sm transition-colors",
                    safePage === totalPages
                      ? "cursor-not-allowed opacity-40"
                      : "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                  )}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
