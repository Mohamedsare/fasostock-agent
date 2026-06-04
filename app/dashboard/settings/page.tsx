import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsView } from "@/components/settings/settings-view";
import { OpenAiKeyForm } from "@/components/settings/openai-key-form";
import { getSessionUser } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/agents";
import { features, isSupabaseConfigured, publicEnv } from "@/lib/env";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  const appUrl = publicEnv.appUrl.replace(/\/$/, "");
  const org = isSupabaseConfigured ? await getCurrentOrg() : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Profil, intégrations et configuration des connexions." />
      {isSupabaseConfigured && <OpenAiKeyForm hasKey={Boolean(org?.openai_api_key_enc)} />}
      <SettingsView
        user={{ name: user.name, email: user.email }}
        integrations={{
          supabase: isSupabaseConfigured,
          wasender: features.wasender,
          openai: features.openai,
          resend: features.resend,
        }}
        webhookUrl={`${appUrl}/api/webhooks/wasender`}
        appUrl={appUrl}
      />
    </div>
  );
}
