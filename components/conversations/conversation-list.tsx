"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MessagesSquare, Bot, UserCog } from "lucide-react";
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

export function ConversationList({ conversations }: { conversations: ConversationWithContact[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | LeadStatus>("all");

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

      {/* Status filter chips (scrollable on mobile) */}
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
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((c) => (
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
      )}
    </div>
  );
}
