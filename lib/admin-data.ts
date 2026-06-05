import "server-only";
import { isSupabaseConfigured, features } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, mapSessionStatus } from "@/lib/wasender";
import type { AgentConnectionStatus, LeadStatus } from "@/lib/types";

/**
 * Platform-wide (super-admin) data access.
 *
 * Every read here uses the SERVICE-ROLE client and therefore bypasses RLS — it
 * must only be reached after `requireSuperAdmin()` (see lib/admin.ts). Reads are
 * intentionally simple (fetch + aggregate in JS): the platform is early-stage,
 * so correctness and clarity beat micro-optimised SQL. Mock fallbacks keep the
 * console fully browsable without Supabase (CLAUDE.md §30).
 */

/** Estimated monthly price of an active tenant, in FCFA (XOF). Override via env. */
export const PLATFORM_PLAN_PRICE_XOF = Number(process.env.PLATFORM_PLAN_PRICE_XOF) || 25000;

export interface PlatformOrg {
  id: string;
  name: string;
  ownerEmail: string | null;
  members: number;
  agents: number;
  connectedAgents: number;
  conversations: number;
  qualified: number;
  converted: number;
  hasOwnOpenAIKey: boolean;
  createdAt: string;
  lastActivityAt: string | null;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  orgId: string | null;
  orgName: string | null;
  isOwner: boolean;
  createdAt: string;
}

export interface PlatformAgent {
  id: string;
  name: string;
  personaName: string;
  orgId: string;
  orgName: string;
  phone: string | null;
  connectionStatus: AgentConnectionStatus;
  aiEnabled: boolean;
  conversations: number;
  createdAt: string;
}

export interface PlatformTotals {
  orgs: number;
  users: number;
  agents: number;
  connectedAgents: number;
  contacts: number;
  conversations: number;
  messages: number;
  aiMessages: number;
  qualified: number;
  converted: number;
  pendingInvites: number;
  activeTenants: number;
  mrrXof: number;
}

export interface SeriesPoint {
  label: string;
  orgs: number;
  users: number;
}

export interface PlatformOverview {
  totals: PlatformTotals;
  growth: { newOrgs7d: number; newUsers7d: number; newConversations7d: number };
  signupSeries: SeriesPoint[];
  topOrgs: PlatformOrg[];
  recentUsers: PlatformUser[];
  agentBuckets: { label: string; value: number; color: string }[];
  integrations: IntegrationStatus[];
}

export interface IntegrationStatus {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

// ───────────────────────── helpers ─────────────────────────

const DAY = 86_400_000;
const since = (days: number) => Date.now() - days * DAY;

function countSince(dates: (string | null | undefined)[], days: number): number {
  const t = since(days);
  return dates.filter((d) => d && new Date(d).getTime() >= t).length;
}

/** Build an 8-week signup series from creation timestamps. */
function buildSeries(orgDates: string[], userDates: string[]): SeriesPoint[] {
  const weeks = 8;
  const out: SeriesPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = since((i + 1) * 7);
    const end = since(i * 7);
    const inWindow = (d: string) => {
      const t = new Date(d).getTime();
      return t >= start && t < end;
    };
    out.push({
      label: i === 0 ? "Cette sem." : `S-${i}`,
      orgs: orgDates.filter(inWindow).length,
      users: userDates.filter(inWindow).length,
    });
  }
  return out;
}

function integrationStatuses(): IntegrationStatus[] {
  return [
    {
      key: "supabase",
      label: "Supabase",
      ok: isSupabaseConfigured,
      detail: isSupabaseConfigured ? "Base & Auth connectées" : "Non configuré (mode démo)",
    },
    {
      key: "openai",
      label: "OpenAI",
      ok: features.openai,
      detail: features.openai ? "Clé plateforme active" : "Aucune clé plateforme",
    },
    {
      key: "wasender",
      label: "Wasender",
      ok: features.wasender,
      detail: features.wasender ? "API WhatsApp connectée" : "Clé API absente",
    },
    {
      key: "resend",
      label: "Resend",
      ok: features.resend,
      detail: features.resend ? "Emails transactionnels actifs" : "Email non configuré",
    },
  ];
}

const AGENT_BUCKET_COLORS = ["#16a34a", "#2563eb", "#f97316", "#6366f1"];

function agentBuckets(orgs: { agents: number }[]): { label: string; value: number; color: string }[] {
  const buckets = [
    { label: "Sans agent", test: (n: number) => n === 0 },
    { label: "1 agent", test: (n: number) => n === 1 },
    { label: "2–3 agents", test: (n: number) => n >= 2 && n <= 3 },
    { label: "4+ agents", test: (n: number) => n >= 4 },
  ];
  return buckets.map((b, i) => ({
    label: b.label,
    value: orgs.filter((o) => b.test(o.agents)).length,
    color: AGENT_BUCKET_COLORS[i],
  }));
}

// ───────────────────────── real (service-role) ─────────────────────────

interface RawAgent {
  id: string;
  org_id: string;
  name: string | null;
  agent_name: string | null;
  connection_status: string | null;
  wasender_session_ref: string | null;
  phone_number: string | null;
  ai_enabled: boolean | null;
  created_at: string;
  openai_api_key_enc?: string | null;
}

/** Resolve `p`, or `fallback` if it doesn't settle within `ms` ms. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

const LIVE_STATUS_TIMEOUT_MS = 4000;

/**
 * Query Wasender for the *live* connection status of each provisioned agent, so
 * the console reflects reality rather than the last-stored DB value. Agents that
 * were never provisioned (no session ref), or whose status call fails/times out,
 * are omitted — callers fall back to the stored status for those.
 */
async function resolveLiveStatuses(agents: RawAgent[]): Promise<Map<string, AgentConnectionStatus>> {
  const map = new Map<string, AgentConnectionStatus>();
  if (!features.wasender) return map;
  const checkable = agents.filter((a) => a.wasender_session_ref);
  if (checkable.length === 0) return map;

  const entries = await Promise.all(
    checkable.map(async (a) => {
      try {
        const res = await withTimeout(getSession(a.wasender_session_ref as string), LIVE_STATUS_TIMEOUT_MS, {
          ok: false as const,
        });
        if (!res.ok) return [a.id, null] as const;
        const raw = (res.data as { status?: string } | undefined)?.status;
        return [a.id, mapSessionStatus(raw)] as const;
      } catch {
        return [a.id, null] as const;
      }
    }),
  );
  for (const [id, status] of entries) if (status) map.set(id, status);
  return map;
}

async function loadPlatform() {
  const db = createAdminClient();

  const [orgsRes, agentsRes, profilesRes, convsRes] = await Promise.all([
    db.from("organizations").select("id, name, owner_id, openai_api_key_enc, created_at"),
    db
      .from("agents")
      .select(
        "id, org_id, name, agent_name, connection_status, wasender_session_ref, phone_number, ai_enabled, created_at",
      ),
    db.from("profiles").select("id, email, full_name, role, org_id, created_at"),
    db.from("conversations").select("id, agent_id, status, created_at, last_message_at"),
  ]);

  // Optional / large tables — tolerate failures and use head counts where heavy.
  const [msgCountRes, aiMsgCountRes, contactCountRes, invitesRes] = await Promise.all([
    db.from("messages").select("id", { count: "exact", head: true }),
    db.from("messages").select("id", { count: "exact", head: true }).eq("sender", "ai"),
    db.from("contacts").select("id", { count: "exact", head: true }),
    db.from("invitations").select("org_id, status").eq("status", "pending"),
  ]);

  const orgs = (orgsRes.data ?? []) as {
    id: string;
    name: string;
    owner_id: string | null;
    openai_api_key_enc: string | null;
    created_at: string;
  }[];
  const storedAgents = (agentsRes.data ?? []) as RawAgent[];
  // Override stored connection_status with the live Wasender status so every
  // admin surface (counts, orgs, revenue, agents) reflects reality.
  const liveStatuses = await resolveLiveStatuses(storedAgents);
  const agents = storedAgents.map((a) =>
    liveStatuses.has(a.id) ? { ...a, connection_status: liveStatuses.get(a.id)! } : a,
  );
  // Self-heal the DB: persist any status that drifted from the live value so the
  // tenant dashboards become accurate too. Best-effort — never blocks the render.
  const drifted = agents.filter((a) => {
    const stored = storedAgents.find((s) => s.id === a.id)?.connection_status;
    return liveStatuses.has(a.id) && a.connection_status !== stored;
  });
  if (drifted.length > 0) {
    await Promise.allSettled(
      drifted.map((a) =>
        db.from("agents").update({ connection_status: a.connection_status }).eq("id", a.id),
      ),
    );
  }
  const profiles = (profilesRes.data ?? []) as {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    org_id: string | null;
    created_at: string;
  }[];
  const convs = (convsRes.data ?? []) as {
    id: string;
    agent_id: string;
    status: LeadStatus;
    created_at: string;
    last_message_at: string;
  }[];

  return {
    orgs,
    agents,
    profiles,
    convs,
    messages: msgCountRes.count ?? 0,
    aiMessages: aiMsgCountRes.count ?? 0,
    contacts: contactCountRes.count ?? 0,
    pendingInvites: (invitesRes.data ?? []).length,
  };
}

function assemble(data: Awaited<ReturnType<typeof loadPlatform>>) {
  const { orgs, agents, profiles, convs } = data;

  const emailById = new Map(profiles.map((p) => [p.id, p.email]));
  const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));
  const ownerByOrg = new Map(orgs.map((o) => [o.id, o.owner_id]));

  const agentToOrg = new Map(agents.map((a) => [a.id, a.org_id]));
  const membersByOrg = new Map<string, number>();
  for (const p of profiles) {
    if (p.org_id) membersByOrg.set(p.org_id, (membersByOrg.get(p.org_id) ?? 0) + 1);
  }

  // Per-org conversation aggregates.
  const convAgg = new Map<
    string,
    { total: number; qualified: number; converted: number; lastAt: string | null }
  >();
  for (const c of convs) {
    const orgId = agentToOrg.get(c.agent_id);
    if (!orgId) continue;
    const cur = convAgg.get(orgId) ?? { total: 0, qualified: 0, converted: 0, lastAt: null };
    cur.total += 1;
    if (c.status === "prospect_qualifie" || c.status === "prospect_chaud") cur.qualified += 1;
    if (c.status === "client_converti") cur.converted += 1;
    if (!cur.lastAt || new Date(c.last_message_at) > new Date(cur.lastAt)) cur.lastAt = c.last_message_at;
    convAgg.set(orgId, cur);
  }

  const agentsByOrg = new Map<string, RawAgent[]>();
  for (const a of agents) {
    const list = agentsByOrg.get(a.org_id) ?? [];
    list.push(a);
    agentsByOrg.set(a.org_id, list);
  }

  const platformOrgs: PlatformOrg[] = orgs.map((o) => {
    const orgAgents = agentsByOrg.get(o.id) ?? [];
    const agg = convAgg.get(o.id);
    const ownerId = ownerByOrg.get(o.id);
    return {
      id: o.id,
      name: o.name,
      ownerEmail: ownerId ? emailById.get(ownerId) ?? null : null,
      members: membersByOrg.get(o.id) ?? 0,
      agents: orgAgents.length,
      connectedAgents: orgAgents.filter((a) => a.connection_status === "connected").length,
      conversations: agg?.total ?? 0,
      qualified: agg?.qualified ?? 0,
      converted: agg?.converted ?? 0,
      hasOwnOpenAIKey: Boolean(o.openai_api_key_enc),
      createdAt: o.created_at,
      lastActivityAt: agg?.lastAt ?? null,
    };
  });

  const platformUsers: PlatformUser[] = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    orgId: p.org_id,
    orgName: p.org_id ? orgNameById.get(p.org_id) ?? null : null,
    isOwner: p.org_id ? ownerByOrg.get(p.org_id) === p.id : false,
    createdAt: p.created_at,
  }));

  const platformAgents: PlatformAgent[] = agents.map((a) => ({
    id: a.id,
    name: a.name ?? "Agent",
    personaName: a.agent_name ?? "Assistant",
    orgId: a.org_id,
    orgName: orgNameById.get(a.org_id) ?? "—",
    phone: a.phone_number,
    connectionStatus: (a.connection_status as AgentConnectionStatus) ?? "disconnected",
    aiEnabled: a.ai_enabled ?? false,
    conversations: convAgg.get(a.org_id)?.total ?? 0,
    createdAt: a.created_at,
  }));

  const connectedAgents = platformAgents.filter((a) => a.connectionStatus === "connected").length;
  const activeTenants = platformOrgs.filter((o) => o.connectedAgents > 0).length;
  const qualified = platformOrgs.reduce((s, o) => s + o.qualified, 0);
  const converted = platformOrgs.reduce((s, o) => s + o.converted, 0);

  const totals: PlatformTotals = {
    orgs: orgs.length,
    users: profiles.length,
    agents: agents.length,
    connectedAgents,
    contacts: data.contacts,
    conversations: convs.length,
    messages: data.messages,
    aiMessages: data.aiMessages,
    qualified,
    converted,
    pendingInvites: data.pendingInvites,
    activeTenants,
    mrrXof: activeTenants * PLATFORM_PLAN_PRICE_XOF,
  };

  return { totals, platformOrgs, platformUsers, platformAgents };
}

// ───────────────────────── public API ─────────────────────────

export async function getPlatformOverview(): Promise<PlatformOverview> {
  if (!isSupabaseConfigured) return mockOverview();
  const raw = await loadPlatform();
  const { totals, platformOrgs, platformUsers } = assemble(raw);

  return {
    totals,
    growth: {
      newOrgs7d: countSince(raw.orgs.map((o) => o.created_at), 7),
      newUsers7d: countSince(raw.profiles.map((p) => p.created_at), 7),
      newConversations7d: countSince(raw.convs.map((c) => c.created_at), 7),
    },
    signupSeries: buildSeries(
      raw.orgs.map((o) => o.created_at),
      raw.profiles.map((p) => p.created_at),
    ),
    topOrgs: [...platformOrgs].sort((a, b) => b.conversations - a.conversations).slice(0, 6),
    recentUsers: [...platformUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6),
    agentBuckets: agentBuckets(platformOrgs),
    integrations: integrationStatuses(),
  };
}

export async function getPlatformOrgs(): Promise<PlatformOrg[]> {
  if (!isSupabaseConfigured) return mockOrgs();
  const { platformOrgs } = assemble(await loadPlatform());
  return [...platformOrgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPlatformUsers(): Promise<PlatformUser[]> {
  if (!isSupabaseConfigured) return mockUsers();
  const { platformUsers } = assemble(await loadPlatform());
  return [...platformUsers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPlatformAgents(): Promise<PlatformAgent[]> {
  if (!isSupabaseConfigured) return mockAgents();
  const { platformAgents } = assemble(await loadPlatform());
  return [...platformAgents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPlatformTotals(): Promise<PlatformTotals> {
  if (!isSupabaseConfigured) return mockOverview().totals;
  return assemble(await loadPlatform()).totals;
}

export function getIntegrationStatuses(): IntegrationStatus[] {
  return integrationStatuses();
}

// ───────────────────────── mock platform ─────────────────────────

const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

function mockOrgs(): PlatformOrg[] {
  return [
    { id: "o1", name: "FasoStock", ownerEmail: "mohamedsare078@gmail.com", members: 4, agents: 2, connectedAgents: 2, conversations: 412, qualified: 38, converted: 21, hasOwnOpenAIKey: true, createdAt: ago(120), lastActivityAt: ago(0.02) },
    { id: "o2", name: "Faso Beauté", ownerEmail: "awa@fasobeaute.bf", members: 2, agents: 1, connectedAgents: 1, conversations: 188, qualified: 22, converted: 9, hasOwnOpenAIKey: false, createdAt: ago(64), lastActivityAt: ago(0.1) },
    { id: "o3", name: "Sahel Distrib", ownerEmail: "issouf@saheldistrib.com", members: 3, agents: 3, connectedAgents: 2, conversations: 261, qualified: 31, converted: 14, hasOwnOpenAIKey: true, createdAt: ago(47), lastActivityAt: ago(0.4) },
    { id: "o4", name: "Pharma Plus", ownerEmail: "karim@pharmaplus.bf", members: 1, agents: 1, connectedAgents: 0, conversations: 54, qualified: 6, converted: 2, hasOwnOpenAIKey: false, createdAt: ago(21), lastActivityAt: ago(2) },
    { id: "o5", name: "Ouaga Auto", ownerEmail: "yacouba@ouagaauto.com", members: 2, agents: 1, connectedAgents: 1, conversations: 97, qualified: 11, converted: 4, hasOwnOpenAIKey: false, createdAt: ago(12), lastActivityAt: ago(0.6) },
    { id: "o6", name: "Banfora Resto Group", ownerEmail: "salif@banforaresto.bf", members: 1, agents: 0, connectedAgents: 0, conversations: 0, qualified: 0, converted: 0, hasOwnOpenAIKey: false, createdAt: ago(3), lastActivityAt: null },
  ];
}

function mockUsers(): PlatformUser[] {
  const orgs = mockOrgs();
  const name = (e: string) => e.split("@")[0].replace(/\W/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const rows: Omit<PlatformUser, "orgName">[] = [
    { id: "u1", email: "mohamedsare078@gmail.com", fullName: "Mohamed Saré", role: "admin", orgId: "o1", isOwner: true, createdAt: ago(120) },
    { id: "u2", email: "awa@fasobeaute.bf", fullName: "Awa Ouédraogo", role: "admin", orgId: "o2", isOwner: true, createdAt: ago(64) },
    { id: "u3", email: "agent@fasostock.bf", fullName: "Fatim Sawadogo", role: "agent", orgId: "o1", isOwner: false, createdAt: ago(58) },
    { id: "u4", email: "issouf@saheldistrib.com", fullName: "Issouf Traoré", role: "admin", orgId: "o3", isOwner: true, createdAt: ago(47) },
    { id: "u5", email: "karim@pharmaplus.bf", fullName: "Karim Zongo", role: "admin", orgId: "o4", isOwner: true, createdAt: ago(21) },
    { id: "u6", email: "yacouba@ouagaauto.com", fullName: "Yacouba Diallo", role: "admin", orgId: "o5", isOwner: true, createdAt: ago(12) },
    { id: "u7", email: "salif@banforaresto.bf", fullName: "Salif Kaboré", role: "admin", orgId: "o6", isOwner: true, createdAt: ago(3) },
    { id: "u8", email: "mariam@fasobeaute.bf", fullName: "Mariam Compaoré", role: "agent", orgId: "o2", isOwner: false, createdAt: ago(2) },
  ];
  return rows.map((r) => ({ ...r, fullName: r.fullName ?? name(r.email), orgName: orgs.find((o) => o.id === r.orgId)?.name ?? null }));
}

function mockAgents(): PlatformAgent[] {
  return [
    { id: "a1", name: "FasoStock", personaName: "Awa — Assistante FasoStock", orgId: "o1", orgName: "FasoStock", phone: "+226 70 11 22 33", connectionStatus: "connected", aiEnabled: true, conversations: 412, createdAt: ago(120) },
    { id: "a2", name: "Support FR", personaName: "Latifatou", orgId: "o1", orgName: "FasoStock", phone: "+226 75 00 00 11", connectionStatus: "connected", aiEnabled: true, conversations: 412, createdAt: ago(40) },
    { id: "a3", name: "Beauté Bot", personaName: "Salimata", orgId: "o2", orgName: "Faso Beauté", phone: "+226 75 44 55 66", connectionStatus: "connected", aiEnabled: true, conversations: 188, createdAt: ago(64) },
    { id: "a4", name: "Sahel 1", personaName: "Boukary", orgId: "o3", orgName: "Sahel Distrib", phone: "+226 78 99 00 11", connectionStatus: "connected", aiEnabled: true, conversations: 261, createdAt: ago(47) },
    { id: "a5", name: "Sahel 2", personaName: "Aminata", orgId: "o3", orgName: "Sahel Distrib", phone: "+226 76 22 33 44", connectionStatus: "error", aiEnabled: false, conversations: 261, createdAt: ago(30) },
    { id: "a6", name: "Pharma", personaName: "Assistant", orgId: "o4", orgName: "Pharma Plus", phone: null, connectionStatus: "disconnected", aiEnabled: true, conversations: 54, createdAt: ago(21) },
    { id: "a7", name: "Auto Bot", personaName: "Rasmané", orgId: "o5", orgName: "Ouaga Auto", phone: "+226 70 77 88 99", connectionStatus: "connecting", aiEnabled: true, conversations: 97, createdAt: ago(12) },
  ];
}

function mockOverview(): PlatformOverview {
  const orgs = mockOrgs();
  const agents = mockAgents();
  const users = mockUsers();
  const connectedAgents = agents.filter((a) => a.connectionStatus === "connected").length;
  const activeTenants = orgs.filter((o) => o.connectedAgents > 0).length;
  const conversations = orgs.reduce((s, o) => s + o.conversations, 0);
  const qualified = orgs.reduce((s, o) => s + o.qualified, 0);
  const converted = orgs.reduce((s, o) => s + o.converted, 0);

  const totals: PlatformTotals = {
    orgs: orgs.length,
    users: users.length,
    agents: agents.length,
    connectedAgents,
    contacts: 1287,
    conversations,
    messages: 9432,
    aiMessages: 7810,
    qualified,
    converted,
    pendingInvites: 3,
    activeTenants,
    mrrXof: activeTenants * PLATFORM_PLAN_PRICE_XOF,
  };

  const signupSeries: SeriesPoint[] = [
    { label: "S-7", orgs: 0, users: 1 },
    { label: "S-6", orgs: 1, users: 1 },
    { label: "S-5", orgs: 0, users: 2 },
    { label: "S-4", orgs: 1, users: 2 },
    { label: "S-3", orgs: 1, users: 1 },
    { label: "S-2", orgs: 1, users: 3 },
    { label: "S-1", orgs: 1, users: 2 },
    { label: "Cette sem.", orgs: 1, users: 2 },
  ];

  return {
    totals,
    growth: { newOrgs7d: 1, newUsers7d: 2, newConversations7d: 86 },
    signupSeries,
    topOrgs: [...orgs].sort((a, b) => b.conversations - a.conversations).slice(0, 6),
    recentUsers: [...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    agentBuckets: agentBuckets(orgs),
    integrations: integrationStatuses(),
  };
}
