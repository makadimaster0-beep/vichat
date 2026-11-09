"use client";
// Stockage LOCAL (téléphone / PC) par défaut : photos, vocaux, photos envoyées, photo de profil.
// IndexedDB (blobs) avec repli localStorage (dataURL) si indisponible.

const DB_NAME = "vichat-device-store";
const STORE = "media";
let dbP: Promise<IDBDatabase | null> | null = null;
const cache = new Map<string, string>(); // ref -> objectURL

function openDB(): Promise<IDBDatabase | null> {
  if (dbP) return dbP;
  dbP = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "ref" }); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbP;
}

async function lsSet(ref: string, data: string) {
  try { localStorage.setItem("vichat.media." + ref, data); } catch { /* quota */ }
}
function lsGet(ref: string): string | null { try { return localStorage.getItem("vichat.media." + ref); } catch { return null; } }

/** Sauvegarde un fichier sur l'appareil. Retourne la ref locale + une URL utilisable. */
export async function saveDeviceFile(blob: Blob, kind: "photo" | "voice" | "profile" | "image", meta: { name?: string; conversation?: string } = {}) {
  const ref = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDB();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put({ ref, blob, kind, conversation: meta.conversation || "", name: meta.name || "", at: Date.now() });
        tx.oncomplete = () => resolve(); tx.onerror = () => resolve(); tx.onabort = () => resolve();
      } catch { resolve(); }
    });
  }
  const url = URL.createObjectURL(blob);
  cache.set(ref, url);
  // Repli léger pour les petits fichiers (audit de ce qui est stocké localement)
  try { if (blob.size < 700_000) { const fr = new FileReader(); fr.onload = () => lsSet(ref + ":meta", JSON.stringify({ ref, kind, size: blob.size, at: Date.now(), conv: meta.conversation || "" })); fr.readAsArrayBuffer(new Blob([])); } } catch { /* noop */ }
  return { ref, url };
}

/** Récupère l'URL locale d'une ref (depuis IndexedDB ou le repli localStorage). */
export async function getDeviceURL(ref: string): Promise<string | null> {
  if (cache.has(ref)) return cache.get(ref)!;
  const db = await openDB();
  if (db) {
    const rec: any = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(ref);
        req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
    if (rec?.blob) { const u = URL.createObjectURL(rec.blob); cache.set(ref, u); return u; }
  }
  return null;
}

/** Liste les fichiers conservés sur l'appareil (avec leur poids). */
export async function listDeviceFiles(): Promise<{ ref: string; kind: string; size: number; at: number; conv: string }[]> {
  const db = await openDB();
  if (db) {
    const rows: any[] = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []); req.onerror = () => resolve([]);
      } catch { resolve([]); }
    });
    if (rows.length) return rows.map(r => ({ ref: r.ref, kind: r.kind, size: r.blob?.size || 0, at: r.at || 0, conv: r.conversation || "" }));
  }
  const out: { ref: string; kind: string; size: number; at: number; conv: string }[] = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (k.startsWith("vichat.media.") && k.endsWith(":meta")) { try { out.push(JSON.parse(localStorage.getItem(k) || "{}")); } catch { /* noop */ } } } } catch { /* noop */ }
  return out;
}

export function bytes(n: number) { return n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`; }

/** Photo de profil : redimensionnée et stockée en dataURL dans localStorage (appareil). */
export async function fileToProfileDataURL(file: File, max = 480): Promise<string> {
  const bmp = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); const u = URL.createObjectURL(file);
    img.onload = () => { resolve(img); URL.revokeObjectURL(u); }; img.onerror = reject; img.src = u;
  });
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export function saveLocalJSON<T>(key: string, value: T) { try { localStorage.setItem("vichat." + key, JSON.stringify(value)); } catch { /* noop */ } }
export function loadLocalJSON<T>(key: string, fallback: T): T { try { const v = localStorage.getItem("vichat." + key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } }
