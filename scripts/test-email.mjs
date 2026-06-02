/**
 * Diagnostic d'envoi d'email — autonome, hors authentification Next.
 *
 *   node scripts/test-email.mjs
 *
 * Lit .env.local, vérifie la config Resend et envoie un email de test à
 * ADMIN_EMAIL. Affiche l'id Resend en cas de succès, ou l'erreur exacte.
 */
import { readFileSync } from "node:fs";

function loadEnv(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "FasoStock <onboarding@resend.dev>";
const to = process.argv[2] || process.env.ADMIN_EMAIL;

console.log("RESEND_API_KEY   :", apiKey ? `défini (${apiKey.length} car.)` : "❌ MANQUANT / vide");
console.log("RESEND_FROM_EMAIL:", from);
console.log("ADMIN_EMAIL      :", to || "❌ MANQUANT");

if (!apiKey || !to) {
  console.error("\n🔴 Config incomplète. Renseignez RESEND_API_KEY et ADMIN_EMAIL dans .env.local.");
  process.exitCode = 1;
  process.exit();
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to,
    subject: "✅ Test d'envoi — FasoStock WhatsApp Agent",
    html: "<p>Cet email confirme que l'envoi via Resend fonctionne. 🎉</p>",
  }),
});

const body = await res.json().catch(() => ({}));

if (res.ok) {
  console.log(`\n✅ Email envoyé à ${to} — id Resend : ${body.id}`);
} else {
  console.error(`\n🔴 Échec (HTTP ${res.status}) :`, JSON.stringify(body));
  console.error(
    "\nCauses fréquentes :\n" +
      " • 401/403 : RESEND_API_KEY invalide.\n" +
      " • 'domain is not verified' : vérifiez le domaine de RESEND_FROM_EMAIL sur resend.com/domains,\n" +
      "   ou utilisez RESEND_FROM_EMAIL=\"FasoStock <onboarding@resend.dev>\" (envoie seulement au propriétaire du compte Resend).",
  );
  process.exitCode = 1;
}
