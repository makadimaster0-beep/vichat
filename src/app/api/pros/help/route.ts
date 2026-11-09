import { db } from "@/db"; import { helpRequests } from "@/db/schema"; import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(helpRequests).orderBy(desc(helpRequests.id)).limit(50);
    return Response.json({ requests: rows });
  } catch (e: any) { return Response.json({ requests: [], error: e?.message || "Table `help_requests` introuvable — exécutez sql/schema.sql" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.subject?.trim() || !b?.description?.trim()) return Response.json({ error: "Titre et description obligatoires" }, { status: 400 });
  try {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(helpRequests);
    const ticket = `VC-AIDE-${String(1000 + n + Math.floor(Math.random() * 8999))}`;
    const [row] = await db.insert(helpRequests).values({
      ticket, category: b.category || "maison", proName: b.proName || null,
      subject: b.subject.trim(), description: b.description.trim(), urgency: b.urgency || "Normale",
      budget: b.budget || "", contact: b.contact || "", status: "En attente d'un pro",
    }).returning();
    return Response.json({ request: row });
  } catch (e: any) { return Response.json({ error: e?.message || "Échec d'écriture" }, { status: 503 }); }
}

export async function PATCH(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.id || !b?.status) return Response.json({ error: "id et status requis" }, { status: 400 });
  try { await db.update(helpRequests).set({ status: b.status }).where(sql`${helpRequests.id} = ${b.id}`); return Response.json({ ok: true }); }
  catch { return Response.json({ ok: false }, { status: 503 }); }
}
