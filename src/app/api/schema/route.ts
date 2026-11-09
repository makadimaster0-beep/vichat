import { readFile } from "fs/promises"; import path from "path";
export const dynamic = "force-dynamic";
/** Retourne le schéma SQL complet (sql/schema.sql) : à coller dans Supabase SQL Editor / psql. */
export async function GET() {
  try {
    const file = await readFile(path.join(process.cwd(), "sql", "schema.sql"), "utf8");
    return Response.json({ ok: true, sql: file, lines: file.split("\n").length });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "sql/schema.sql introuvable" }, { status: 404 });
  }
}
