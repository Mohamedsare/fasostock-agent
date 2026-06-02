import type { NextRequest } from "next/server";
import { z } from "zod";
import { sendWhatsAppText } from "@/lib/wasender";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";

const bodySchema = z.object({
  to: z.string().min(6, "Numéro invalide"),
  text: z.string().min(1, "Message vide"),
  conversationId: z.string().uuid().optional(),
});

/**
 * POST /api/wasender/send — send a manual WhatsApp message as the admin.
 * Requires an authenticated session; optionally records the message on a
 * conversation and switches it to human mode.
 */
export async function POST(req: NextRequest) {
  // Require a logged-in admin (unless Supabase auth isn't configured in dev).
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Requête invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { to, text, conversationId } = parsed.data;
  const sent = await sendWhatsAppText(to, text);

  if (conversationId && isSupabaseConfigured) {
    const db = createAdminClient();
    await db.from("messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      sender: "admin",
      content: text,
      wasender_id: sent.id ?? null,
    });
    await db
      .from("conversations")
      .update({
        mode: "human",
        ai_enabled: false,
        last_message_at: new Date().toISOString(),
        last_message_preview: text.slice(0, 160),
      })
      .eq("id", conversationId);
  }

  if (!sent.ok) {
    return Response.json({ ok: false, error: sent.error }, { status: 502 });
  }
  return Response.json({ ok: true, id: sent.id });
}
