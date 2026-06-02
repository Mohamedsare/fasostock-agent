"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { agentSettingsSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/conversations";

/** Create or update the single agent_settings row. */
export async function saveAgentSettings(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const parsed = agentSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Champs invalides : " + JSON.stringify(parsed.error.flatten().fieldErrors) };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("agent_settings").select("id").limit(1).maybeSingle();

  const { error } = existing
    ? await supabase.from("agent_settings").update(parsed.data).eq("id", existing.id)
    : await supabase.from("agent_settings").insert(parsed.data);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Quick toggle for the global AI switch. */
export async function toggleGlobalAi(enabled: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("agent_settings").select("id").limit(1).maybeSingle();
  if (!existing) return { ok: false, error: "Configurez d'abord l'agent." };
  const { error } = await supabase.from("agent_settings").update({ ai_enabled: enabled }).eq("id", existing.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/agent");
  return { ok: true };
}
