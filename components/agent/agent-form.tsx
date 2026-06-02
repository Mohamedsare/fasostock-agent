"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { saveAgentSettings } from "@/lib/actions/agent";
import type { AgentSettings } from "@/lib/types";

export function AgentForm({ settings }: { settings: AgentSettings }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState({
    agent_name: settings.agent_name,
    tone: settings.tone,
    language: settings.language,
    operating_mode: settings.operating_mode,
    welcome_message: settings.welcome_message,
    system_prompt: settings.system_prompt,
    qualification_rules: settings.qualification_rules,
    human_handoff_rules: settings.human_handoff_rules,
    qualified_threshold: settings.qualified_threshold,
    hot_threshold: settings.hot_threshold,
    ai_enabled: settings.ai_enabled,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function onSave() {
    startTransition(async () => {
      const res = await saveAgentSettings(form);
      if (res.ok) {
        toast.success("Configuration de l'agent enregistrée.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* État global */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Bot className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Agent IA actif</p>
              <p className="text-sm text-muted-foreground">
                {form.ai_enabled ? "L'IA répond automatiquement aux messages." : "L'IA est en pause — aucune réponse automatique."}
              </p>
            </div>
          </div>
          <Switch checked={form.ai_enabled} onCheckedChange={(v) => set("ai_enabled", v)} />
        </CardContent>
      </Card>

      {/* Identité */}
      <Card>
        <CardHeader>
          <CardTitle>Identité & ton</CardTitle>
          <CardDescription>Comment l'agent se présente et s'exprime.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de l'agent">
            <Input value={form.agent_name} onChange={(e) => set("agent_name", e.target.value)} />
          </Field>
          <Field label="Langue principale">
            <Input value={form.language} onChange={(e) => set("language", e.target.value)} placeholder="fr" />
          </Field>
          <Field label="Ton">
            <Select value={form.tone} onValueChange={(v) => set("tone", v as typeof form.tone)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professionnel">Professionnel</SelectItem>
                <SelectItem value="amical">Amical</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="chaleureux">Chaleureux</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mode de fonctionnement">
            <Select value={form.operating_mode} onValueChange={(v) => set("operating_mode", v as typeof form.operating_mode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="prospection">Prospection</SelectItem>
                <SelectItem value="hybride">Hybride</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Message d'accueil" className="sm:col-span-2">
            <Textarea value={form.welcome_message} onChange={(e) => set("welcome_message", e.target.value)} rows={2} />
          </Field>
        </CardContent>
      </Card>

      {/* Comportement */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt & règles</CardTitle>
          <CardDescription>Le cœur du comportement de l'agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Prompt système">
            <Textarea value={form.system_prompt} onChange={(e) => set("system_prompt", e.target.value)} rows={5} className="font-mono text-xs" />
          </Field>
          <Field label="Règles de qualification">
            <Textarea value={form.qualification_rules} onChange={(e) => set("qualification_rules", e.target.value)} rows={3} />
          </Field>
          <Field label="Règles de transfert humain">
            <Textarea value={form.human_handoff_rules} onChange={(e) => set("human_handoff_rules", e.target.value)} rows={3} />
          </Field>
        </CardContent>
      </Card>

      {/* Seuils */}
      <Card>
        <CardHeader>
          <CardTitle>Seuils de scoring</CardTitle>
          <CardDescription>À partir de quel score un prospect change de statut.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={`Seuil qualifié : ${form.qualified_threshold}`}>
            <input
              type="range" min={0} max={100} value={form.qualified_threshold}
              onChange={(e) => set("qualified_threshold", Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </Field>
          <Field label={`Seuil chaud : ${form.hot_threshold}`}>
            <input
              type="range" min={0} max={100} value={form.hot_threshold}
              onChange={(e) => set("hot_threshold", Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-border bg-background/90 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <Button onClick={onSave} disabled={pending} size="lg">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
