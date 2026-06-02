"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KNOWLEDGE_CATEGORY_META } from "@/lib/constants";
import {
  createKnowledge,
  deleteKnowledge,
  toggleKnowledge,
  updateKnowledge,
} from "@/lib/actions/knowledge";
import type { KnowledgeBaseEntry, KnowledgeCategory } from "@/lib/types";

const CATEGORIES = Object.entries(KNOWLEDGE_CATEGORY_META) as [KnowledgeCategory, string][];

type Draft = { title: string; content: string; category: KnowledgeCategory; is_active: boolean };
const EMPTY: Draft = { title: "", content: "", category: "presentation", is_active: true };

export function KnowledgeManager({ entries }: { entries: KnowledgeBaseEntry[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [filter, setFilter] = React.useState<"all" | KnowledgeCategory>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<KnowledgeBaseEntry | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setDialogOpen(true);
  }
  function openEdit(e: KnowledgeBaseEntry) {
    setEditing(e);
    setDraft({ title: e.title, content: e.content, category: e.category, is_active: e.is_active });
    setDialogOpen(true);
  }

  function save() {
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("Titre et contenu requis.");
      return;
    }
    startTransition(async () => {
      const res = editing ? await updateKnowledge(editing.id, draft) : await createKnowledge(draft);
      if (res.ok) {
        toast.success(editing ? "Information mise à jour." : "Information ajoutée.");
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec.");
      }
    });
  }

  function toggle(e: KnowledgeBaseEntry) {
    startTransition(async () => {
      const res = await toggleKnowledge(e.id, !e.is_active);
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Échec.");
    });
  }

  function remove(e: KnowledgeBaseEntry) {
    if (!confirm(`Supprimer « ${e.title} » ?`)) return;
    startTransition(async () => {
      const res = await deleteKnowledge(e.id);
      if (res.ok) {
        toast.success("Information supprimée.");
        router.refresh();
      } else toast.error(res.error ?? "Échec.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            Toutes <span className="opacity-70">{entries.length}</span>
          </Chip>
          {CATEGORIES.map(([key, label]) => {
            const n = entries.filter((e) => e.category === key).length;
            if (n === 0) return null;
            return (
              <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
                {label} <span className="opacity-70">{n}</span>
              </Chip>
            );
          })}
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="size-4" /> <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Base de connaissance vide"
          description="Ajoutez des informations que l'IA utilisera pour répondre (présentation, prix, FAQ…)."
          action={<Button onClick={openCreate}><Plus className="size-4" /> Ajouter une information</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((e) => (
            <Card key={e.id} className={cn("p-4", !e.is_active && "opacity-60")}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <Badge tone="primary">{KNOWLEDGE_CATEGORY_META[e.category]}</Badge>
                <Switch checked={e.is_active} onCheckedChange={() => toggle(e)} aria-label="Activer" />
              </div>
              <p className="font-semibold text-foreground">{e.title}</p>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{e.content}</p>
              <div className="mt-3 flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(e)} aria-label="Modifier">
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(e)} aria-label="Supprimer" className="text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'information" : "Nouvelle information"}</DialogTitle>
            <DialogDescription>L'agent IA s'appuiera sur ce contenu pour répondre.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Titre</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex. Tarifs de l'abonnement" />
            </div>
            <div>
              <Label className="mb-1.5 block">Catégorie</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as KnowledgeCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Contenu</Label>
              <Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} rows={5} placeholder="Information factuelle, claire et concise…" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
              Active (utilisée par l'IA)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
