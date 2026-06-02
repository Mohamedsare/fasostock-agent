/**
 * Envoie UN message WhatsApp de test via Wasender, au format attendu (E.164).
 * Usage : npx tsx scripts/test-wasender.ts <numero>
 *   ex :  npx tsx scripts/test-wasender.ts 22670XXXXXXX   (ton propre numéro)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of file.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
}

const KEY = process.env.WASENDER_API_KEY ?? "";
const BASE = (process.env.WASENDER_BASE_URL || "https://wasenderapi.com/api").replace(/\/$/, "");
const arg = process.argv[2];

async function main() {
  if (!KEY) return console.error("❌ WASENDER_API_KEY manquant dans .env.local.");
  if (!arg) return console.error("Usage : npx tsx scripts/test-wasender.ts <numero>");

  const to = `+${arg.replace(/[^\d]/g, "")}`; // E.164
  console.log(`→ Envoi à ${to} via ${BASE}/send-message …`);

  const res = await fetch(`${BASE}/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ to, text: "Test FasoStock ✅ — l'agent peut bien envoyer des messages." }),
  });
  const text = await res.text();
  console.log(`HTTP ${res.status}: ${text}`);
  if (res.ok) console.log("\n✅ Envoyé ! Vérifie le WhatsApp du numéro.");
  else if (res.status === 429) console.log("\n⏳ Limite d'essai gratuit (1 msg/min). Réessaie dans 1 minute ou passe à un plan payant.");
}

main();
