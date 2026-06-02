/**
 * Crée (ou met à jour) l'utilisateur admin FasoStock dans Supabase Auth.
 *
 * Le trigger `handle_new_user()` (migration 0001) crée automatiquement la ligne
 * correspondante dans `profiles`. L'email est confirmé d'office → connexion
 * immédiate sur /login.
 *
 * Usage :
 *   npm run create-admin -- <email> <motDePasse> ["Nom Complet"]
 *   # ou sans arguments : utilise ADMIN_EMAIL + mot de passe par défaut
 *
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY doit être la VRAIE clé service_role
 * (Supabase → Project Settings → API), pas la clé anon.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// ── Charge .env.local sans dépendance externe ────────────────
function loadEnvLocal() {
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // pas de .env.local : on se rabat sur l'environnement courant
  }
}

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) fail("NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local.");
  if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.");

  // Garde-fou : refuse une clé qui n'est pas une clé service_role.
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split(".")[1], "base64").toString());
    if (payload.role !== "service_role") {
      fail(
        `La clé SUPABASE_SERVICE_ROLE_KEY a le rôle "${payload.role}", pas "service_role".\n` +
          "   Récupérez la vraie clé service_role dans Supabase → Project Settings → API.",
      );
    }
  } catch {
    fail("SUPABASE_SERVICE_ROLE_KEY ne ressemble pas à un JWT valide.");
  }

  const [, , argEmail, argPassword, ...argName] = process.argv;
  const email = argEmail || process.env.ADMIN_EMAIL;
  const password = argPassword || "FasoStock2026!";
  const fullName = argName.join(" ") || "Admin FasoStock";

  if (!email) {
    fail('Email requis. Exemple : npm run create-admin -- admin@fasostock.com "MonMotDePasse" "Mohamed Saré"');
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\n→ Création de l'admin : ${email} …`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const exists = /already|registered|exist/i.test(error.message);
    if (!exists) fail(`Échec de création : ${error.message}`);

    // L'utilisateur existe déjà → on met à jour son mot de passe.
    console.log("ℹ️  L'utilisateur existe déjà — mise à jour du mot de passe…");
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) fail(`Impossible de lister les utilisateurs : ${listError.message}`);

    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) fail("Utilisateur introuvable malgré le conflit signalé.");

    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (updateError) fail(`Échec de mise à jour : ${updateError.message}`);

    console.log("\n✅ Mot de passe de l'admin mis à jour.");
  } else {
    console.log("\n✅ Admin créé.");
    console.log(`   id : ${data.user?.id}`);
  }

  console.log("\nConnexion :");
  console.log(`   Email        : ${email}`);
  console.log(`   Mot de passe : ${password}`);
  console.log("   Page         : /login\n");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
