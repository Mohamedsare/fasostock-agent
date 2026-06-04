"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { saveOpenAiKey } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

/** Org-level OpenAI key. The agents of this org use it (platform key as fallback). */
export function OpenAiKeyForm({ hasKey }: { hasKey: boolean }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [pending, start] = useTransition();

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold">Clé OpenAI de l&apos;entreprise</h3>
          <p className="text-sm text-muted-foreground">
            Utilisée par vos agents pour générer les réponses (repli sur la clé plateforme si vide).
          </p>
        </div>
      </div>

      {hasKey && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4" /> Une clé est configurée.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="password"
          placeholder="sk-..."
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <Button
          disabled={pending || !key.trim()}
          onClick={() =>
            start(async () => {
              const r = await saveOpenAiKey(key);
              if (r.ok) {
                toast.success("Clé OpenAI enregistrée.");
                setKey("");
                router.refresh();
              } else {
                toast.error(r.error ?? "Échec de l'enregistrement.");
              }
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          Enregistrer
        </Button>
      </div>
    </Card>
  );
}
