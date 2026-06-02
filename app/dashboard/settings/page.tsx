import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsView } from "@/components/settings/settings-view";
import { getSessionUser } from "@/lib/auth";
import { features, isSupabaseConfigured, publicEnv } from "@/lib/env";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  const appUrl = publicEnv.appUrl.replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Profil, intégrations et configuration des connexions." />
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
