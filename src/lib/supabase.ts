// Client Supabase (PostgREST) — utilisé uniquement côté serveur.
// Stocke : identités, messages, messages cryptés.
// Les médias (photos, vocaux, photos envoyées) restent SUR L'APPAREIL (src/lib/media.ts).
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fvjskabeprnijzrcoutn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_B8YsMvQvanU_Bfp1IVuo0Q_gly5fy0A";

export type SyncStatus = "remote" | "local" | "error" | "idle";

/** SQL à coller une seule fois dans le SQL Editor Supabase — identités + messages (les médias restent sur l'appareil). */
export const SUPABASE_SQL = `-- ViChat • base Supabase (identités + messages uniquement)
create table if not exists public.vichat_profiles (
  id          text primary key,
  name        text not null,
  email       text,
  handle      text unique,
  bio         text,
  city        text,
  role        text default 'Particulier',
  updated_at  timestamptz default now()
);

create table if not exists public.vichat_messages (
  id            bigint generated always as identity primary key,
  client_id     text unique not null,
  conversation  text not null,
  sender        text not null,
  kind          text default 'text',
  body          text,
  encrypted     boolean default false,
  cipher        text,
  on_device     boolean default false,
  created_at    timestamptz default now()
);

alter table public.vichat_profiles enable row level security;
alter table public.vichat_messages enable row level security;
drop policy if exists "vi_profil" on public.vichat_profiles;
drop policy if exists "vi_msg"    on public.vichat_messages;
create policy "vi_profil" on public.vichat_profiles for all using (true) with check (true);
create policy "vi_msg"    on public.vichat_messages for all using (true) with check (true);
grant all on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ⚠️ Les photos, photos envoyées et vocaux ne sont PAS en base :
--    ils restent sur le téléphone / PC (IndexedDB).`;

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export function maskedUrl() {
  try { const u = new URL(SUPABASE_URL); return `${u.protocol}//${u.hostname.slice(0, 10)}••••`; } catch { return "supabase"; }
}

/** Appel PostgREST générique */
export async function rest(path: string, init: RequestInit = {}) {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`;
  const res = await fetch(url, { ...init, headers: headers((init.headers as Record<string, string>) || {}) });
  const text = await res.text();
  let body: any = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

/** Diagnostique l'état de la base : identités + messages */
export async function ping(): Promise<{ ok: boolean; status: SyncStatus; detail: string; tables: { profiles: boolean; messages: boolean } }> {
  const p = await rest("vichat_profiles?select=id&limit=1").catch(() => ({ ok: false, status: 0, body: null as any }));
  const m = await rest("vichat_messages?select=id&limit=1").catch(() => ({ ok: false, status: 0, body: null as any }));
  const detail = (r: any) => r.ok ? "table accessible" : (JSON.stringify(r.body || {}).includes("PGRST205") || (typeof r.body === "string" && r.body.includes("Could not find the table")) ? "Tables à créer (voir le SQL fourni)" : (typeof r.body === "string" ? r.body.slice(0, 140) : JSON.stringify(r.body || {}).slice(0, 140)));
  const both = p.ok && m.ok;
  return {
    ok: both,
    status: both ? "remote" : (p.status === 0 && m.status === 0 ? "error" : "local"),
    detail: both ? "Connecté à Supabase" : (p.ok || m.ok ? "Partiel" : detail(p.body || m.body)),
    tables: { profiles: !!p.ok, messages: !!m.ok },
  };
}

/** Enregistre une identité de profil */
export async function upsertProfile(profile: { id: string; name: string; email: string; handle: string; bio: string; city: string; role: string }) {
  return rest("vichat_profiles?on_conflict=id", {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ ...profile, updated_at: new Date().toISOString() }),
  });
}

/** Enregistre un message (clair ou crypté — le texte crypté ne quitte jamais le client déchiffrable) */
export async function insertMessage(msg: { client_id: string; conversation: string; sender: string; kind: string; body: string; encrypted: boolean; cipher: string | null }) {
  return rest("vichat_messages", {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify([{ ...msg, created_at: new Date().toISOString() }]),
  });
}

/** Historique distant (lecture) */
export async function listMessages(conversation: string, limit = 50) {
  return rest(`vichat_messages?conversation=eq.${encodeURIComponent(conversation)}&order=created_at.desc&limit=${limit}`);
}
