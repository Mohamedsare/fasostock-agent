"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppText } from "@/lib/wasender";
import { isSupabaseConfigured } from "@/lib/env";
import type { ActionResult } from "@/lib/actions/conversations";

function revalidate() {
  revalidatePath("/dashboard/follow-ups");
}

/** Cancel a scheduled follow-up. */
export async function cancelFollowUp(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const supabase = await createClient();
  const { error } = await supabase.from("follow_ups").update({ status: "cancelled" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

/** Send a scheduled follow-up now over WhatsApp. */
export async function sendFollowUpNow(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase non configuré." };
  const supabase = await createClient();

  const { data: fu } = await supabase
    .from("follow_ups")
    .select("*, contact:contacts(phone)")
    .eq("id", id)
    .maybeSingle();
  if (!fu) return { ok: false, error: "Relance introuvable." };

  const phone = (fu as { contact?: { phone?: string } }).contact?.phone;
  const message = (fu as { message?: string }).message;
  if (!phone || !message) return { ok: false, error: "Numéro ou message manquant." };

  const sent = await sendWhatsAppText(phone, message);
  await supabase
    .from("follow_ups")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  // Record the outbound message on the conversation too.
  await supabase.from("messages").insert({
    conversation_id: (fu as { conversation_id: string }).conversation_id,
    direction: "outbound",
    sender: "admin",
    content: message,
    wasender_id: sent.id ?? null,
  });

  revalidate();
  if (!sent.ok) return { ok: false, error: `Relance marquée envoyée mais WhatsApp a échoué : ${sent.error}` };
  return { ok: true };
}
