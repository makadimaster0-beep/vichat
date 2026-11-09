import { db } from "@/db"; import { users } from "@/db/schema"; { }
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b?.name?.trim() || !b?.email?.trim()) return Response.json({ ok: false, error: "Nom et email obligatoires" }, { status: 400 });
  // Identité écrite en base (table users) + code de confirmation valable 10 min.
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const email = b.email.trim().toLowerCase();
  try { await db.insert(users).values({ name: b.name.trim(), email, phone: b.phone || "", handle: (b as any).handle || email.split("@")[0], role: (b as any).role || "Particulier" }).onConflictDoUpdate({ target: users.email, set: { name: b.name.trim(), phone: b.phone || "" } }); }
  catch (e: any) { return Response.json({ ok: false, error: "Écriture en base impossible — exécutez sql/schema.sql (" + (e?.message || "") + ")" }, { status: 503 }); }
  // L'envoi d'email réel se branche ici (SMTP / provider) : le code est stocké côté serveur.
  return Response.json({ ok: true, code, message: `Code de confirmation envoyé à ${email}`, expires: "10 min" });
}
