"use client";

import * as React from "react";
import { Search, Building2, KeyRound, ArrowUpDown, Users2, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn, formatNumber, getInitials, timeAgo } from "@/lib/utils";
import type { PlatformOrg } from "@/lib/admin-data";

type SortKey = "recent" | "conversations" | "agents";

export function OrgTable({ orgs }: { orgs: PlatformOrg[] }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("recent");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return orgs
      .filter(
        (o) =>
          !q ||
          o.name.toLowerCase().includes(q) ||
          o.ownerEmail?.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sort === "conversations") return b.conversations - a.conversations;
        if (sort === "agents") return b.agents - a.agents;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orgs, query, sort]);

  const cycleSort = () =>
    setSort((s) => (s === "recent" ? "conversations" : s === "conversations" ? "agents" : "recent"));
  const sortLabel = sort === "recent" ? "Récence" : sort === "conversations" ? "Conversations" : "Agents";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une organisation ou un propriétaire…"
            className="h-9 pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={cycleSort} className="shrink-0">
          <ArrowUpDown className="size-4" />
          {sortLabel}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune organisation" description="Aucun tenant ne correspond à cette recherche." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Membres</th>
                  <th className="px-4 py-2.5">Agents</th>
                  <th className="px-4 py-2.5">Conversations</th>
                  <th className="px-4 py-2.5">Qualifiés</th>
                  <th className="px-4 py-2.5">Convertis</th>
                  <th className="px-4 py-2.5">Clé IA</th>
                  <th className="px-4 py-2.5 text-right">Créée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-indigo-500/10 text-xs text-indigo-500">
                            {getInitials(o.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{o.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{o.ownerEmail ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{o.members}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{o.agents}</span>
                        {o.connectedAgents > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <span className="size-1.5 rounded-full bg-success" />
                            {o.connectedAgents}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{formatNumber(o.conversations)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{o.qualified}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{o.converted}</td>
                    <td className="px-4 py-2.5">
                      {o.hasOwnOpenAIKey ? (
                        <Badge tone="primary" className="gap-1"><KeyRound className="size-3" /> Propre</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Plateforme</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {timeAgo(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2.5 md:hidden">
            {filtered.map((o) => (
              <li key={o.id} className="rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-indigo-500/10 text-indigo-500">{getInitials(o.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">{o.name}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{o.ownerEmail ?? "—"}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <Stat icon={Users2} label="Membres" value={o.members} />
                  <Stat icon={Bot} label="Agents" value={o.agents} accent={o.connectedAgents > 0} />
                  <Stat label="Conv." value={formatNumber(o.conversations)} />
                  <Stat label="Convertis" value={o.converted} />
                </div>
                {o.hasOwnOpenAIKey && (
                  <div className="mt-2.5">
                    <Badge tone="primary" className="gap-1"><KeyRound className="size-3" /> Clé OpenAI propre</Badge>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: typeof Users2;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-1.5 py-2">
      <p className={cn("text-base font-bold tabular-nums", accent ? "text-success" : "text-foreground")}>{value}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
    </div>
  );
}
