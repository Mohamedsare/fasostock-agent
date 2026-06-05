"use client";

import * as React from "react";
import { Search, Users, Crown, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getInitials, timeAgo } from "@/lib/utils";
import type { PlatformUser } from "@/lib/admin-data";

export function UsersTable({ users }: { users: PlatformUser[] }) {
  const [query, setQuery] = React.useState("");
  const [onlyOwners, setOnlyOwners] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (onlyOwners && !u.isOwner) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.orgName?.toLowerCase().includes(q)
      );
    });
  }, [users, query, onlyOwners]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom, email ou organisation…"
            className="h-9 pl-9"
          />
        </div>
        <button
          onClick={() => setOnlyOwners((v) => !v)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            onlyOwners
              ? "border-indigo-500 bg-indigo-500 text-white"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Crown className="size-4" /> Propriétaires
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun utilisateur ne correspond à cette recherche." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Utilisateur</th>
                  <th className="px-4 py-2.5">Organisation</th>
                  <th className="px-4 py-2.5">Rôle</th>
                  <th className="px-4 py-2.5 text-right">Inscrit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{getInitials(u.fullName ?? u.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{u.fullName ?? u.email.split("@")[0]}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{u.orgName ?? "—"}</td>
                    <td className="px-4 py-2.5"><RoleBadge user={u} /></td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {timeAgo(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
            {filtered.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-3">
                <Avatar className="size-10">
                  <AvatarFallback>{getInitials(u.fullName ?? u.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-foreground">{u.fullName ?? u.email.split("@")[0]}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(u.createdAt)}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <RoleBadge user={u} />
                    <span className="truncate text-xs text-muted-foreground">{u.orgName ?? "—"}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function RoleBadge({ user }: { user: PlatformUser }) {
  if (user.isOwner) {
    return (
      <Badge tone="primary" className="gap-1">
        <Crown className="size-3" /> Propriétaire
      </Badge>
    );
  }
  if (user.role === "admin") {
    return (
      <Badge tone="info" className="gap-1">
        <Shield className="size-3" /> Admin
      </Badge>
    );
  }
  return <Badge tone="neutral">Membre</Badge>;
}
