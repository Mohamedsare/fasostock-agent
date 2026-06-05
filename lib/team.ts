import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getCurrentOrgId } from "@/lib/agents";
import { getSessionUser } from "@/lib/auth";
import type { Invitation, OrgMember } from "@/lib/types";

/**
 * Team / membership reads. A member is a profile whose org_id points at the org;
 * the owner is organizations.owner_id. Invitations live in their own table
 * (migration 0006) — queried defensively so the page still renders if the
 * migration hasn't been applied yet.
 */

export interface TeamData {
  members: OrgMember[];
  invitations: Invitation[];
  /** The current viewer's user id + whether they own the org (can manage seats). */
  currentUserId: string;
  isOwner: boolean;
  /** True when the invitations table is missing (migration 0006 not applied). */
  invitationsUnavailable: boolean;
}

export async function getTeamData(): Promise<TeamData> {
  const [org, user] = await Promise.all([getCurrentOrg(), getSessionUser()]);
  const ownerId = org?.owner_id ?? null;
  const isOwner = Boolean(ownerId && ownerId === user.id);

  const supabase = await createClient();

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: true });

  const members: OrgMember[] = (
    (profileRows as Omit<OrgMember, "is_owner">[] | null) ?? []
  ).map((p) => ({ ...p, is_owner: p.id === ownerId }));

  // Invitations table may not exist yet — degrade gracefully.
  let invitations: Invitation[] = [];
  let invitationsUnavailable = false;
  const { data: invRows, error: invErr } = await supabase
    .from("invitations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (invErr) {
    invitationsUnavailable = isMissingTable(invErr);
  } else {
    invitations = (invRows as Invitation[]) ?? [];
  }

  return {
    members,
    invitations,
    currentUserId: user.id,
    isOwner,
    invitationsUnavailable,
  };
}

/** True when a Postgres error means "relation invitations does not exist". */
function isMissingTable(error: { message?: string; code?: string }): boolean {
  const m = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    (m.includes("invitations") && (m.includes("does not exist") || m.includes("schema cache")))
  );
}

/** Convenience: the current org's id (re-exported for actions). */
export { getCurrentOrgId };
