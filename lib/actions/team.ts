"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg, getCurrentOrgId } from "@/lib/agents";
import { getSessionUser } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { isSupabaseConfigured, serverEnv } from "@/lib/env";
import type { ActionResult } from "@/lib/actions/conversations";
import type { Invitation } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only the org owner may manage seats. Returns the org id when allowed. */
async function requireOwner(): Promise<{ orgId: string; orgName: string } | { error: string }> {
  const [org, user] = await Promise.all([getCurrentOrg(), getSessionUser()]);
  if (!org) return { error: "Aucune organisation." };
  if (org.owner_id !== user.id) return { error: "Seul le propriétaire peut gérer l'équipe." };
  return { orgId: org.id, orgName: org.name };
}

/** Invite a teammate by email. Creates a pending invitation and emails a link. */
export async function inviteMember(email: string, role = "member"): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: false, error: "Adresse email invalide." };

  const owner = await requireOwner();
  if ("error" in owner) return { ok: false, error: owner.error };

  const supabase = await createClient();

  // Already a member?
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", clean)
    .maybeSingle();
  if (existing) return { ok: false, error: "Cette personne fait déjà partie d'une organisation." };

  const token = `${randomUUID()}${randomUUID()}`.replace(/-/g, "");
  const { error } = await supabase.from("invitations").insert({
    org_id: owner.orgId,
    email: clean,
    role: role === "admin" ? "admin" : "member",
    token,
    invited_by: (await getSessionUser()).id,
  });
  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, error: "Table d'invitations absente — appliquez la migration 0006." };
    }
    return { ok: false, error: error.message };
  }

  // Best-effort email; the invitation row is the source of truth either way.
  const inviter = await getSessionUser();
  const joinUrl = `${serverEnv.appUrl.replace(/\/$/, "")}/join?token=${token}`;
  const sent = await sendInvitationEmail({
    to: clean,
    orgName: owner.orgName,
    inviterName: inviter.name,
    joinUrl,
  });

  revalidatePath("/dashboard/team");
  if (!sent.ok && sent.error !== "resend_not_configured") {
    return { ok: true, error: `Invitation créée, mais l'email n'a pas pu être envoyé (${sent.error}).` };
  }
  return { ok: true };
}

/** Revoke a pending invitation. */
export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const owner = await requireOwner();
  if ("error" in owner) return { ok: false, error: owner.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("org_id", owner.orgId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/team");
  return { ok: true };
}

/** Remove a member from the org (unlink their profile). Owner cannot be removed. */
export async function removeMember(userId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const owner = await requireOwner();
  if ("error" in owner) return { ok: false, error: owner.error };

  const me = await getSessionUser();
  if (userId === me.id) return { ok: false, error: "Vous ne pouvez pas vous retirer vous-même." };

  // Unlink via service role (owner can't update another user's profile under RLS),
  // but only for a profile that actually belongs to this org.
  const db = createAdminClient();
  const { data: target } = await db
    .from("profiles")
    .select("id, org_id")
    .eq("id", userId)
    .maybeSingle();
  if (!target || (target as { org_id?: string }).org_id !== owner.orgId) {
    return { ok: false, error: "Membre introuvable dans cette organisation." };
  }
  const { error } = await db.from("profiles").update({ org_id: null }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export interface JoinResult extends ActionResult {
  orgName?: string;
}

/**
 * Accept an invitation by its token for the currently logged-in user. Runs with
 * the service role because the invitee is not yet a member of the org (RLS would
 * hide the invitation from them).
 */
export async function joinByToken(token: string): Promise<JoinResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const user = await getSessionUser();
  if (user.id === "anon" || user.id === "dev") {
    return { ok: false, error: "Connectez-vous pour accepter l'invitation." };
  }
  const db = createAdminClient();
  const { data: inv } = await db
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  const invitation = inv as Invitation | null;
  if (!invitation || invitation.status !== "pending") {
    return { ok: false, error: "Invitation invalide ou déjà utilisée." };
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Invitation expirée." };
  }

  const ok = await applyInvitation(db, invitation, user.id);
  if (!ok) return { ok: false, error: "Impossible de rejoindre l'organisation." };

  const { data: org } = await db
    .from("organizations")
    .select("name")
    .eq("id", invitation.org_id)
    .maybeSingle();
  return { ok: true, orgName: (org as { name?: string } | null)?.name };
}

/**
 * Onboarding hook: if the current user's email has a pending invitation, join
 * that org instead of creating a new one. Returns true when an invite was
 * claimed. Service-role lookup (invitee can't see the invitation under RLS).
 */
export async function claimInviteForCurrentUser(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const user = await getSessionUser();
  if (!user.email || user.email === "—") return false;
  const db = createAdminClient();
  const { data: inv, error } = await db
    .from("invitations")
    .select("*")
    .eq("status", "pending")
    .ilike("email", user.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !inv) return false;
  const invitation = inv as Invitation;
  if (new Date(invitation.expires_at).getTime() < Date.now()) return false;
  return applyInvitation(db, invitation, user.id);
}

/** Link the user's profile to the org and mark the invitation accepted. */
async function applyInvitation(
  db: ReturnType<typeof createAdminClient>,
  invitation: Invitation,
  userId: string,
): Promise<boolean> {
  const { error: pErr } = await db
    .from("profiles")
    .update({ org_id: invitation.org_id, role: invitation.role })
    .eq("id", userId);
  if (pErr) return false;
  await db
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);
  return true;
}

function isMissingTable(error: { message?: string; code?: string }): boolean {
  const m = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    (m.includes("invitations") && (m.includes("does not exist") || m.includes("schema cache")))
  );
}

// Re-export for symmetry with other action modules.
export { getCurrentOrgId };
