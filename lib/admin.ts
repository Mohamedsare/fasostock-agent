import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, serverEnv } from "@/lib/env";
import { getSessionUser, type SessionUser } from "@/lib/auth";

/**
 * Platform super-admin (SaaS owner) access control.
 *
 * The super-admin is the single email in SUPER_ADMIN_EMAIL — the person who
 * owns the AgentFS platform and may inspect *every* tenant. This is distinct
 * from a per-tenant admin (org owner), who only ever sees their own org via RLS.
 *
 * The `/admin` console reads aggregated data with the service-role client, so
 * access MUST be gated here.
 */

/** Case-insensitive match against the configured super-admin email. */
export function emailIsSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  try {
    return email.trim().toLowerCase() === serverEnv.superAdminEmail.trim().toLowerCase();
  } catch {
    return false;
  }
}

export interface AdminSession {
  user: SessionUser;
  /** True when Supabase isn't configured — the console renders mock data. */
  demo: boolean;
}

/** Resolve whether the current viewer may use the super-admin console. */
export async function getAdminAccess(): Promise<{ user: SessionUser; allowed: boolean; demo: boolean }> {
  const user = await getSessionUser();
  // In demo mode (no Supabase) we let the console render with mock data so it is
  // viewable during development (CLAUDE.md §30).
  const demo = !isSupabaseConfigured;
  const allowed = demo || emailIsSuperAdmin(user.email);
  return { user, allowed, demo };
}

/** Guard for super-admin server components: redirect non-owners away. */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const { user, allowed, demo } = await getAdminAccess();
  if (!allowed) redirect("/dashboard");
  return { user, demo };
}
