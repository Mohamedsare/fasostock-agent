"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveAgentId } from "@/lib/agents";
import { isSupabaseConfigured } from "@/lib/env";
import { agentSettingsSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/conversations";

/** Update the active agent's persona/config. */
export async function saveAgentSettings(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const parsed = agentSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Champs invalides : " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }

  const agentId = await getActiveAgentId();
  if (!agentId) return { ok: false, error: "Aucun agent actif." };

  const supabase = await createClient();
  const { error } = await supabase.from("agents").update(parsed.data).eq("id", agentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Quick toggle for the active agent's AI switch. */
export async function toggleGlobalAi(enabled: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const agentId = await getActiveAgentId();
  if (!agentId) return { ok: false, error: "Aucun agent actif." };
  const supabase = await createClient();
  const { error } = await supabase.from("agents").update({ ai_enabled: enabled }).eq("id", agentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/agent");
  return { ok: true };
}
