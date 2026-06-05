"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Crown, Trash2, Mail, ShieldAlert } from "lucide-react";
import { inviteMember, revokeInvitation, removeMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { Invitation, OrgMember } from "@/lib/types";

function initials(name: string | null, email: string): string {
  const base = (name?.trim() || email).trim();
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function TeamView({
  members,
  invitations,
  isOwner,
  currentUserId,
  invitationsUnavailable,
}: {
  members: OrgMember[];
  invitations: Invitation[];
  isOwner: boolean;
  currentUserId: string;
  invitationsUnavailable: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast[r.error ? "warning" : "success"](r.error ?? success);
        router.refresh();
      } else {
        toast.error(r.error ?? "Action échouée.");
      }
    });
  }

  function submitInvite() {
    const value = email.trim();
    if (!value) return;
    run(() => inviteMember(value), "Invitation envoyée.");
    setEmail("");
  }

  return (
    <div className="space-y-6">
      {invitationsUnavailable && (
        <Card className="flex items-start gap-3 border-amber-300/60 bg-amber-50/60 p-4 dark:bg-amber-950/20">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Migration requise</p>
            <p className="text-amber-800/80 dark:text-amber-200/70">
              Les invitations nécessitent la migration <code>0006_invitations.sql</code> (à appliquer
              dans Supabase). Les membres existants restent visibles ci-dessous.
            </p>
          </div>
        </Card>
      )}

      {/* Invite */}
      {isOwner && (
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="inviteEmail" className="text-sm font-medium">
                Inviter un membre
              </label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="collegue@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitInvite()}
                disabled={invitationsUnavailable}
              />
            </div>
            <Button disabled={pending || invitationsUnavailable || !email.trim()} onClick={submitInvite}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Inviter
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            La personne reçoit un email avec un lien. Elle rejoint votre espace en créant un compte
            avec cette adresse.
          </p>
        </Card>
      )}

      {/* Members */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Membres · {members.length}
        </h2>
        <div className="grid gap-2">
          {members.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {initials(m.full_name, m.email)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{m.full_name || m.email.split("@")[0]}</span>
                    {m.is_owner ? (
                      <Badge tone="success" className="gap-1">
                        <Crown className="size-3" /> Propriétaire
                      </Badge>
                    ) : (
                      <Badge tone="neutral">{m.role === "admin" ? "Admin" : "Membre"}</Badge>
                    )}
                    {m.id === currentUserId && <span className="text-xs text-muted-foreground">(vous)</span>}
                  </div>
                  <span className="truncate text-sm text-muted-foreground">{m.email}</span>
                </div>
              </div>
              {isOwner && !m.is_owner && m.id !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Retirer ${m.email} de l'organisation ?`)) {
                      run(() => removeMember(m.id), "Membre retiré.");
                    }
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Invitations en attente · {invitations.length}
          </h2>
          <div className="grid gap-2">
            {invitations.map((inv) => (
              <Card key={inv.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <div className="font-medium">{inv.email}</div>
                    <span className="text-xs text-muted-foreground">
                      Invité·e le {new Date(inv.created_at).toLocaleDateString("fr-FR")} · en attente
                    </span>
                  </div>
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => revokeInvitation(inv.id), "Invitation annulée.")}
                  >
                    Annuler
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isOwner && members.length <= 1 && (
        <EmptyState
          icon={UserPlus}
          title="Gestion de l'équipe"
          description="Seul le propriétaire de l'organisation peut inviter ou retirer des membres."
        />
      )}
    </div>
  );
}
