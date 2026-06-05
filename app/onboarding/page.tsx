import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentOrgId } from "@/lib/agents";
import { claimInviteForCurrentUser } from "@/lib/actions/team";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  // Already onboarded → straight to the dashboard.
  if (isSupabaseConfigured) {
    const orgId = await getCurrentOrgId();
    if (orgId) redirect("/dashboard");
    // Invited teammate? Join the inviting org instead of creating a new one.
    const joined = await claimInviteForCurrentUser();
    if (joined) redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Configurons votre espace</h1>
          <p className="text-sm text-muted-foreground">
            Créez votre entreprise et votre premier agent. Vous connecterez WhatsApp juste après.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
