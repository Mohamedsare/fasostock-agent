"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { knowledgeEntrySchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/conversations";

function revalidate() {
  revalidatePath("/dashboard/knowledge-base");
}

export async function createKnowledge(input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const parsed = knowledgeEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Champs invalides." };

  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_base").insert(parsed.data);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateKnowledge(id: string, input: unknown): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const parsed = knowledgeEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Champs invalides." };

  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_base").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function toggleKnowledge(id: string, isActive: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_base").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteKnowledge(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const supabase = await createClient();
  const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
