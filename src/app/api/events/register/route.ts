import { db } from "@/db"; import { registrations, notifications, events } from "@/db/schema"; import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Inscription à un événement créé par l'Admin : écrit inscription + 5 rappels en base. */
export async function POST(req: Request) {
  const { eventId, eventTitle, email } = await req.json().catch(() => ({} as any));
  if (!eventId || !email) return Response.json({ error: "Événement et email requis" }, { status: 400 });
  const reminders = [
    `Rappel J-7 : ${eventTitle} approche ! Préparez vos questions.`,
    `Rappel J-3 : Plus que 3 jours avant ${eventTitle}. Vérifiez votre connexion.`,
    `Rappel J-1 : Demain c'est ${eventTitle} ! On vous attend.`,
    `Rappel H-1 : ${eventTitle} commence dans 1 heure.`,
    `C'est parti ! ${eventTitle} est en direct maintenant.`,
  ];
  try {
    await db.insert(registrations).values({ eventId: Number(eventId), userEmail: String(email), reminders: 5 });
    await db.insert(notifications).values(reminders.map((r: string) => ({ title: eventTitle || "Événement", body: r, type: "event" })));
    await db.update(events).set({ attendees: sql`${events.attendees} + 1` }).where(eq(events.id, Number(eventId)));
  } catch (e: any) {
    return Response.json({ error: e?.message || "Tables absentes — exécutez sql/schema.sql" }, { status: 503 });
  }
  return Response.json({ ok: true, reminders: reminders.map((r, i) => ({ id: Date.now() + i, title: eventTitle, body: r, type: "event", time: ["J-7", "J-3", "J-1", "H-1", "Maintenant"][i] })) });
}
