"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Users, ArrowUpDown, MessageSquare, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ScoreBar } from "@/components/score-bar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn, contactLabel, getInitials, timeAgo } from "@/lib/utils";
import type { ConversationWithContact, LeadStatus } from "@/lib/types";

type SortKey = "score" | "recent";

export function ProspectGrid({
  conversations,
  statusFilters,
  emptyTitle = "Aucun prospect",
  emptyDescription = "Les prospects apparaîtront ici dès qu'un contact écrit sur WhatsApp.",
  renderActions,
}: {
  conversations: ConversationWithContact[];
  statusFilters?: { value: "all" | LeadStatus; label: string }[];
  emptyTitle?: string;
  emptyDescription?: string;
  renderActions?: (c: ConversationWithContact) => React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | LeadStatus>("all");
  const [sort, setSort] = React.useState<SortKey>("score");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => {
        if (filter !== "all" && c.status !== filter) return false;
        if (!q) return true;
        return (
          c.contact.name?.toLowerCase().includes(q) ||
          c.contact.phone.includes(q) ||
          c.contact.business_type?.toLowerCase().includes(q) ||
          c.contact.city?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        sort === "score"
          ? b.score - a.score
          : new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
      );
  }, [conversations, query, filter, sort]);

  const actions = (c: ConversationWithContact) =>
    renderActions ? (
      renderActions(c)
    ) : (
      <Button asChild size="sm" variant="ghost">
        <Link href={`/dashboard/conversations/${c.id}`}>
          <MessageSquare className="size-4" /> Ouvrir
        </Link>
      </Button>
    );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="h-9 pl-9" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSort((s) => (s === "score" ? "recent" : "score"))}
          className="shrink-0"
        >
          <ArrowUpDown className="size-4" />
          {sort === "score" ? "Score" : "Récence"}
        </Button>
      </div>

      {statusFilters && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {statusFilters.map((f) => {
            const count =
              f.value === "all" ? conversations.length : conversations.filter((c) => c.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
                <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Prospect</th>
                  <th className="px-4 py-2.5">Activité</th>
                  <th className="px-4 py-2.5">Ville</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5">Dernière</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/conversations/${c.id}`} className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(contactLabel(c.contact.name, c.contact.phone))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {contactLabel(c.contact.name, c.contact.phone)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{c.contact.phone}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-2.5 text-muted-foreground">{c.contact.business_type ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.contact.city ?? "—"}</td>
                    <td className="px-4 py-2.5"><ScoreBar score={c.score} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</td>
                    <td className="px-4 py-2.5 text-right">{actions(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: compact rows */}
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-3">
                <Link href={`/dashboard/conversations/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {getInitials(contactLabel(c.contact.name, c.contact.phone))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-foreground">
                        {contactLabel(c.contact.name, c.contact.phone)}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.contact.business_type, c.contact.city].filter(Boolean).join(" · ") || c.contact.phone}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <ScoreBar score={c.score} />
                    </div>
                  </div>
                </Link>
                {renderActions ? renderActions(c) : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
