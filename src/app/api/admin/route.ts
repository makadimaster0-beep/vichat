import { db } from "@/db"; import { events } from "@/db/schema"; import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "vichat-admin-2026";

/** Vérifie la clé Admin puis affiche l'état des tables (aucune écriture). */
export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({ key: "" }));
  if (!key || key !== ADMIN_KEY) return Response.json({ ok: false, error: "Clé Admin incorrecte." }, { status: 401 });
  let counts = { events: 0, help: 0 };
  try {
    const [e] = await db.select({ n: sql<number>`count(*)::int` }).from(events);
    counts.events = e.n || 0;
  } catch { /* table absente */ }
  return Response.json({ ok: true, role: "admin", counts, message: "Espace Admin débloqué — création d'événements autorisée." });
}

export async function GET() {
  return Response.json({ role: "admin", requiredHeader: "x-admin-key", note: "La création d'événements exige x-admin-key (ADMIN_API_KEY)." });
}
