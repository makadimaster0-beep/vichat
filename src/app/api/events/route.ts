import { db } from "@/db"; import { events } from "@/db/schema"; import { EVENT_SEED } from "@/lib/data";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "vichat-admin-2026";

/** Initialisation unique : seules les éditions officielles sont écrites en base. */
async function ensureSeeded() {
  try {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(events);
    if (n === 0) await db.insert(events).values(EVENT_SEED.map(e => ({ ...e, createdBy: "admin", publishedBy: "admin" })));
  } catch (e) { throw new Error("Table `events` introuvable — exécutez sql/schema.sql"); }
}

/** Événements : lecture publique, provenant uniquement de la base. */
export async function GET() {
  try { await ensureSeeded(); const rows = await db.select().from(events).orderBy(desc(events.publishedAt)); return Response.json({ events: rows }); }
  catch (e:any) { return Response.json({ events: [], error: e?.message || "Base indisponible" }, { status: 503 }); }
}

/** CRÉATION : réservée à l'ADMIN ViChat (en-tête x-admin-key). */
export async function POST(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  if (!key || key !== ADMIN_KEY) {
    return Response.json({ error: "Accès refusé : la création d'événements est réservée à l'Admin ViChat (x-admin-key invalide)." }, { status: 401 });
  }
  const b = await req.json().catch(() => null);
  if (!b?.title?.trim() || !b?.description?.trim() || !b?.startsLabel?.trim()) {
    return Response.json({ error: "Titre, description et date/heure sont obligatoires." }, { status: 400 });
  }
  try {
    const [e] = await db.insert(events).values({
      title: b.title.trim(), description: b.description.trim(), category: b.category || "Communauté",
      startsLabel: b.startsLabel.trim(), location: b.location || "En ligne", organizer: "Admin ViChat",
      image: b.image || EVENT_SEED[0].image, isLive: !!b.isLive, attendees: 0, price: b.price || "Gratuit",
      createdBy: "admin", publishedBy: "admin",
    }).returning();
    return Response.json({ event: e });
  } catch (e:any) {
    return Response.json({ error: e?.message || "Échec de l'écriture en base" }, { status: 503 });
  }
}
