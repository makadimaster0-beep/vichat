import { db } from "@/db"; import { users, messageLog } from "@/db/schema"; import { eq, desc, sql } from "drizzle-orm"; import { ping, upsertProfile, insertMessage, maskedUrl, listMessages, SUPABASE_SQL } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/sync — état du lien avec la base Supabase (identités + messages) */
export async function GET() {
  const remote = await ping();
  let counts = { users: 0, messages: 0, mirrored: 0 };
  try {
    const [u] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
    const [m] = await db.select({ n: sql<number>`count(*)::int` }).from(messageLog);
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(messageLog).where(eq(messageLog.remote, true));
    counts = { users: u.n || 0, messages: m.n || 0, mirrored: r.n || 0 };
  } catch { /* DB indisponible */ }
  return Response.json({ ...remote, url: maskedUrl(), counts, sql: SUPABASE_SQL });
}

/** POST /api/sync — identités (profil) ou messages (clairs / cryptés) */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({ kind: "none" }));

  if (b.kind === "profile") {
    const profile = { id: b.id, name: b.name || "Utilisateur ViChat", email: b.email || "", handle: b.handle || "", bio: b.bio || "", city: b.city || "", role: b.role || "Particulier" };
    let remote = false; let detail = "";
    try {
      const r = await upsertProfile(profile);
      remote = r.ok; detail = r.ok ? "identité sauvegardée dans Supabase" : (typeof r.body === "string" ? r.body : JSON.stringify(r.body || {})).slice(0, 160);
    } catch (e: any) { detail = String(e?.message || e).slice(0, 160); }
    try {
      await db.insert(users).values({ name: profile.name, email: profile.email || `${profile.handle}@vichat.app`, phone: b.phone || "", handle: profile.handle, bio: profile.bio, city: profile.city, role: profile.role }).onConflictDoUpdate({ target: users.email, set: { name: profile.name, handle: profile.handle, bio: profile.bio, city: profile.city, role: profile.role } });
    } catch { /* réplique locale best effort */ }
    return Response.json({ status: remote ? "remote" : "local", detail, profile, url: maskedUrl() });
  }

  if (b.kind === "message") {
    const msg = { client_id: b.client_id, conversation: b.conversation, sender: b.sender, kind: b.kind_msg || "text", body: b.body || "", encrypted: !!b.encrypted, cipher: b.cipher || null };
    if (!msg.client_id || !msg.conversation) return Response.json({ status: "error", detail: "champs manquants" });
    let remote = false; let detail = "";
    try {
      const r = await insertMessage(msg);
      remote = r.ok; detail = r.ok ? "message enregistré en base" : (typeof r.body === "string" ? r.body : JSON.stringify(r.body || {})).slice(0, 160);
    } catch (e: any) { detail = String(e?.message || e).slice(0, 160); }
    let mirrored = false;
    try {
      await db.insert(messageLog).values({ clientId: msg.client_id, conversation: msg.conversation, sender: msg.sender, kind: msg.kind, body: msg.body, encrypted: msg.encrypted, cipher: msg.cipher, onDevice: b.onDevice || false, remote }).onConflictDoNothing();
      mirrored = true;
    } catch { /* pas de réplique */ }
    return Response.json({ status: remote ? "remote" : mirrored ? "local" : "error", detail, remote, url: maskedUrl() });
  }

  if (b.kind === "history") {
    let rows: any[] = [];
    try { rows = await db.select().from(messageLog).orderBy(desc(messageLog.id)).limit(60); } catch { rows = []; }
    let remoteRows: any[] = [];
    const r = await listMessages(b.conversation || "global", 60).catch(() => ({ ok: false, body: null }));
    if (r.ok && Array.isArray(r.body)) remoteRows = r.body;
    return Response.json({ local: rows, remote: remoteRows });
  }

  return Response.json({ status: "error", detail: "kind inconnu" }, { status: 400 });
}
