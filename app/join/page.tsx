import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { joinByToken } from "@/lib/actions/team";

export const metadata: Metadata = { title: "Rejoindre une équipe" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!isSupabaseConfigured) redirect("/dashboard");

  if (!token) return <JoinShell title="Lien invalide" message="Ce lien d'invitation est incomplet." />;

  const user = await getSessionUser();
  const loggedIn = user.id !== "anon" && user.id !== "dev";

  // Not logged in → send them to sign up with the invited email; onboarding then
  // auto-joins the org by matching the email on their pending invitation.
  if (!loggedIn) {
    return (
      <JoinShell
        title="Vous êtes invité·e"
        message="Pour rejoindre l'équipe, créez un compte (ou connectez-vous) avec l'adresse email qui a reçu l'invitation."
      >
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/signup">Créer un compte</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/login?redirect=${encodeURIComponent(`/join?token=${token}`)}`}>
              J&apos;ai déjà un compte
            </Link>
          </Button>
        </div>
      </JoinShell>
    );
  }

  // Logged in → accept the invitation now.
  const result = await joinByToken(token);
  if (result.ok) redirect("/dashboard");

  return (
    <JoinShell title="Invitation non valide" message={result.error ?? "Cette invitation ne peut pas être acceptée."}>
      <Button asChild variant="outline" className="w-full">
        <Link href="/dashboard">Aller au tableau de bord</Link>
      </Button>
    </JoinShell>
  );
}

function JoinShell({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 mb-6 max-w-sm text-sm text-muted-foreground">{message}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
