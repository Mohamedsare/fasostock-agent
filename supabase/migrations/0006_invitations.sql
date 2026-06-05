-- Team seats & invitations.
--
-- Adds an `invitations` table so an org owner can invite teammates by email.
-- Members belong to one org (profiles.org_id); an accepted invitation simply
-- links the invitee's profile to the inviting org. RLS keeps invitations
-- visible only to members of the owning org; the accept flow runs server-side
-- with the service role (the invitee is not yet a member, so RLS can't see it).
--
-- Apply in the Supabase SQL editor. Safe to re-run (idempotent guards).

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  token text not null unique,
  status text not null default 'pending', -- pending | accepted | revoked
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days')
);
create index if not exists idx_invitations_org on invitations(org_id);
create index if not exists idx_invitations_email on invitations(lower(email));

alter table invitations enable row level security;

-- Members of the org (or its owner) can view/manage its invitations.
drop policy if exists "inv_org" on invitations;
create policy "inv_org" on invitations for all to authenticated
  using (
    org_id = current_org_id()
    or org_id in (select id from organizations where owner_id = auth.uid())
  )
  with check (
    org_id = current_org_id()
    or org_id in (select id from organizations where owner_id = auth.uid())
  );
