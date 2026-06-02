/**
 * Test local du webhook Wasender, de bout en bout, puis NETTOYAGE.
 * Envoie un faux message entrant au serveur local, affiche ce que fait l'agent,
 * montre les lignes créées en base, puis supprime le contact de test.
 *
 * Prérequis : `npm run dev` doit tourner (http://localhost:3000).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of file.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
}

const TEST_PHONE = "22600000000"; // numéro fictif de test
const SECRET = process.env.WASENDER_WEBHOOK_SECRET ?? "";
const BASE = (process.env.WEBHOOK_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const URL = `${BASE}/api/webhooks/wasender${SECRET ? `?secret=${SECRET}` : ""}`;

const payload = {
  event: "messages.upsert",
  data: {
    messages: {
      key: { remoteJid: `${TEST_PHONE}@s.whatsapp.net`, fromMe: false, id: `TEST_${Date.now()}` },
      pushName: "Client Test",
      message: {
        conversation:
          "Bonjour, je vends des cosmétiques à Ouaga, j'ai plus de 200 références et je perds des ventes à cause des ruptures. C'est combien votre application et je peux voir une démo ?",
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
    },
  },
};

async function main() {
  console.log("→ POST", URL.replace(SECRET, "***"));
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    console.error("\n❌ Serveur injoignable. Lance d'abord `npm run dev` dans un autre terminal.\n");
    process.exit(1);
  }

  const json = await res.json();
  console.log("\n── Réponse du webhook ──");
  console.log(JSON.stringify(json, null, 2));

  // Inspection en base
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: contact } = await db.from("contacts").select("*").eq("phone", TEST_PHONE).maybeSingle();
  if (contact) {
    const { data: conv } = await db.from("conversations").select("*").eq("contact_id", contact.id).maybeSingle();
    const { data: msgs } = await db
      .from("messages")
      .select("direction, sender, content")
      .eq("conversation_id", conv?.id)
      .order("created_at");

    console.log("\n── Conversation créée ──");
    console.log(`Statut: ${conv?.status} · Score: ${conv?.score} · Intent: ${conv?.intent}`);
    console.log(`Résumé: ${conv?.summary}`);
    console.log("\n── Messages ──");
    for (const m of msgs ?? []) console.log(`[${m.sender}] ${m.content}`);

    // Nettoyage (cascade : conversation, messages, qualifications…)
    await db.from("contacts").delete().eq("id", contact.id);
    console.log("\n🧹 Données de test supprimées.");
  } else {
    console.log("\n(Aucun contact de test trouvé — vérifie les logs du serveur.)");
  }
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
