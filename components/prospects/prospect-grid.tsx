"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Users, Phone, Briefcase, MapPin, ArrowUpDown, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSort((s) => (s === "score" ? "recent" : "score"))}
          className="shrink-0"
        >
          <ArrowUpDown className="size-4" />
          {sort === "score" ? "Trié par score" : "Trié par récence"}
        </Button>
      </div>

      {statusFilters && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {statusFilters.map((f) => {
            const count =
              f.value === "all" ? conversations.length : conversations.filter((c) => c.status === f.value).length;
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
                <span className="text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>{getInitials(contactLabel(c.contact.name, c.contact.phone))}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {contactLabel(c.contact.name, c.contact.phone)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <Row icon={Phone} value={c.contact.phone} />
                <Row icon={Briefcase} value={c.contact.business_type ?? "—"} />
                <Row icon={MapPin} value={c.contact.city ?? "—"} />
              </div>

              {c.next_action && (
                <p className="line-clamp-2 rounded-lg bg-muted/50 p-2 text-xs text-foreground">
                  → {c.next_action}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <ScoreBar score={c.score} />
                {renderActions ? (
                  renderActions(c)
                ) : (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/conversations/${c.id}`}>
                      <MessageSquare className="size-4" /> Ouvrir
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}
