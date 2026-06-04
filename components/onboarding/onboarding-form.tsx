"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Rocket } from "lucide-react";
import { completeOnboarding, type OnboardingState } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
      Créer mon espace
    </Button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useActionState<OnboardingState, FormData>(completeOnboarding, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgName">Nom de votre entreprise</Label>
        <Input id="orgName" name="orgName" placeholder="Ex : Ma Boutique SARL" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agentName">Nom de votre agent</Label>
        <Input id="agentName" name="agentName" placeholder="Ex : Assistant Ventes" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="openaiKey">Clé OpenAI (optionnel)</Label>
        <Input id="openaiKey" name="openaiKey" type="password" placeholder="sk-..." autoComplete="off" />
        <p className="text-xs text-muted-foreground">
          Laissez vide pour utiliser la clé de la plateforme. Vous pourrez l&apos;ajouter plus tard.
        </p>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
