import type { Metadata } from "next";
import { Users2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { TeamView } from "@/components/team/team-view";
import { getTeamData } from "@/lib/team";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader title="Équipe" description="Invitez des collègues et gérez les accès." />
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Connectez Supabase pour gérer votre équipe.
        </div>
      </div>
    );
  }

  const team = await getTeamData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description="Invitez des collègues à votre espace et gérez leurs accès."
      >
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
          <Users2 className="size-4" /> {team.members.length} membre(s)
        </span>
      </PageHeader>
      <TeamView
        members={team.members}
        invitations={team.invitations}
        isOwner={team.isOwner}
        currentUserId={team.currentUserId}
        invitationsUnavailable={team.invitationsUnavailable}
      />
    </div>
  );
}
