// Devis multi-devises : EUR (base), Franc CFA (XOF/XAF, parité fixe BCEAO), Dollar US.
export type Currency = "EUR" | "XOF" | "USD";

// Parité fixe : 1 € = 655,957 F CFA (XOF/XAF adossés à l'euro). Dollar : taux indicatif.
export const RATES: Record<Currency, number> = { EUR: 1, XOF: 655.957, USD: 1.08 };
export const CURRENCY_META: Record<Currency, { label: string; short: string; symbol: string; name: string }> = {
  EUR: { label: "€ Euro", short: "€", symbol: "€", name: "Euro" },
  XOF: { label: "F CFA Franc", short: "F CFA", symbol: "F CFA", name: "Franc CFA (BCEAO)" },
  USD: { label: "$ Dollar", short: "$", symbol: "$", name: "Dollar US" },
};

export const convert = (eur: number, cur: Currency) => eur * RATES[cur];

export function money(eur: number, cur: Currency = "EUR", decimals?: number) {
  const v = convert(eur, cur);
  if (cur === "XOF") return `${Math.round(v).toLocaleString("fr-FR")} F CFA`;
  const d = decimals ?? (v >= 1000 ? 0 : 2);
  if (cur === "USD") return `$${v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} €`;
}

export const ALL_CURRENCIES: Currency[] = ["EUR", "XOF", "USD"];

/** Libellé d'unité d'un tarif pro (« /h », « /séance »…) */
export const priceSuffix = (price: string) => (price.includes("€") ? price.split("€").slice(1).join("€") : "");

export function devisNumber() {
  const d = new Date();
  return `DEV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
}

export function devisText(q: { num: string; date: string; pro: string; item: string; qty: number; unit: string; priceEUR: number; tva: number; remise: number; cur: Currency; client: string }) {
  const ht = q.qty * q.priceEUR;
  const remise = ht * (q.remise / 100);
  const net = ht - remise;
  const tva = net * (q.tva / 100);
  const ttc = net + tva;
  const c = CURRENCY_META[q.cur];
  const L: string[] = [];
  L.push(`DEVIS ${q.num}`);
  L.push(`Édité le ${q.date} • Validité 15 jours`);
  L.push(`Client : ${q.client}`);
  L.push(`Prestataire : ${q.pro} (pro vérifié ViChat)`);
  L.push(`------------------------------------------------`);
  L.push(`Objet : ${q.item}`);
  L.push(`Qté : ${q.qty} ${q.unit} × ${money(q.priceEUR, q.cur, 4)} = ${money(ht, q.cur)}`);
  if (q.remise) L.push(`Remise : -${q.remise}% = -${money(remise, q.cur)}`);
  L.push(`Total HT : ${money(net, q.cur)}`);
  L.push(`TVA ${q.tva}% : ${money(tva, q.cur)}`);
  L.push(`================================================`);
  L.push(`TOTAL TTC : ${money(ttc, q.cur)} (${c.name})`);
  L.push(`Équivalents : ${money(ttc, "EUR")} • ${money(ttc, "XOF")} • ${money(ttc, "USD")}`);
  L.push(`------------------------------------------------`);
  L.push(`Paiement sécurisé ViChat • Facture envoyée après validation.`);
  return L.join("\n");
}
