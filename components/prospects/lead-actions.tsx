"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, MoreVertical, Trophy, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { updateConversationStatus } from "@/lib/actions/conversations";
import type { ConversationWithContact, LeadStatus } from "@/lib/types";

export function LeadActions({ conversation }: { conversation: ConversationWithContact }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const setStatus = (status: LeadStatus, msg: string) =>
    startTransition(async () => {
      const res = await updateConversationStatus(conversation.id, status);
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec.");
      }
    });

  return (
    <div className="flex items-center gap-1">
      <Button asChild size="sm" variant="ghost">
        <Link href={`/dashboard/conversations/${conversation.id}`}>
          <MessageSquare className="size-4" /> Ouvrir
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Actions" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setStatus("client_converti", "Marqué converti 🎉")}>
            <Trophy /> Marquer converti
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setStatus("perdu", "Marqué perdu.")}
            className="text-destructive focus:text-destructive"
          >
            <XCircle className="!text-destructive" /> Marquer perdu
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
