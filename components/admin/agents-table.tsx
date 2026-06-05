"use client";

import * as React from "react";
import { Search, Bot, Phone, Power } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConnectionBadge } from "@/components/admin/connection-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getInitials, timeAgo } from "@/lib/utils";
import type { PlatformAgent } from "@/lib/admin-data";
import type { AgentConnectionStatus } from "@/lib/types";

const STATUS_FILTERS: { value: "all" | AgentConnectionStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "connected", label: "Connectés" },
  { value: "disconnected", label: "Déconnectés" },
  { value: "error", label: "En erreur" },
];

export function AgentsTable({ agents }: { agents: PlatformAgent[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | AgentConnectionStatus>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      if (filter !== "all" && a.connectionStatus !== filter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.personaName.toLowerCase().includes(q) ||
        a.orgName.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
      );
    });
  }, [agents, query, filter]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un agent, une persona, un numéro…"
          className="h-9 pl-9"
        />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === "all" ? agents.length : agents.filter((a) => a.connectionStatus === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bot} title="Aucun agent" description="Aucun agent ne correspond à ces filtres." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Numéro</th>
                  <th className="px-4 py-2.5">IA</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5 text-right">Créé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-indigo-500/10 text-xs text-indigo-500">
                            {getInitials(a.personaName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{a.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{a.personaName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.orgName}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{a.phone ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {a.aiEnabled ? (
                        <Badge tone="success" className="gap-1"><Power className="size-3" /> Active</Badge>
                      ) : (
                        <Badge tone="neutral">En pause</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><ConnectionBadge status={a.connectionStatus} /></td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {timeAgo(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2.5 md:hidden">
            {filtered.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-indigo-500/10 text-indigo-500">{getInitials(a.personaName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">{a.name}</p>
                      <ConnectionBadge status={a.connectionStatus} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.personaName} · {a.orgName}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" /> {a.phone ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Power className="size-3.5" /> {a.aiEnabled ? "IA active" : "IA en pause"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
