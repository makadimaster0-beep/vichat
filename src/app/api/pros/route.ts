import { db } from "@/db"; import { pros } from "@/db/schema"; import { PRO_SEED } from "@/lib/data";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function ensureSeeded() {
  try {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(pros);
    if (n === 0) await db.insert(pros).values(PRO_SEED);
  } catch { throw new Error("Table `pros` introuvable — exécutez sql/schema.sql"); }
}

/** Annuaire Pros : 100 % issu de la base (aucune donnée de démonstration). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const cat = url.searchParams.get("category") || "tous";
  const online = url.searchParams.get("online") === "1";
  try {
    await ensureSeeded();
    let list: any[] = await db.select().from(pros);
    if (cat !== "tous") list = list.filter(p => p.category === cat);
    if (online) list = list.filter(p => p.online);
    if (q) list = list.filter(p => [p.name, p.role, p.company, p.specialty, p.category, p.location].join(" ").toLowerCase().includes(q));
    return Response.json({ pros: list, total: list.length });
  } catch (e: any) {
    return Response.json({ pros: [], error: e?.message || "Base indisponible" }, { status: 503 });
  }
}
