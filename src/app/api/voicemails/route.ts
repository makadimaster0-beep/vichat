import { db } from "@/db"; import { voicemails } from "@/db/schema"; import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Boîte IA : uniquement les enregistrements réellement écrits en base (aucun seed de démo). */
export async function GET() {
  try { const rows = await db.select().from(voicemails).orderBy(desc(voicemails.id)); return Response.json({ voicemails: rows }); }
  catch (e: any) { return Response.json({ voicemails: [], error: e?.message || "Table `voicemails` introuvable — exécutez sql/schema.sql" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.fromName || !b?.transcript) return Response.json({ error: "Expéditeur et transcription requis" }, { status: 400 });
  try {
    const [v] = await db.insert(voicemails).values({ fromName: b.fromName, transcript: b.transcript, duration: b.duration || "0:35" }).returning();
    return Response.json({ voicemail: v });
  } catch (e: any) { return Response.json({ error: e?.message || "Échec d'écriture" }, { status: 503 }); }
}

export async function PATCH(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.id) return Response.json({ error: "id requis" }, { status: 400 });
  try { await db.update(voicemails).set({ listened: true }).where(eq(voicemails.id, Number(b.id))); return Response.json({ ok: true }); }
  catch { return Response.json({ ok: false }, { status: 503 }); }
}
