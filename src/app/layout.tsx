import type { Metadata } from "next"; import type { ReactNode } from "react"; import "./globals.css";
export const metadata: Metadata = { title: "ViChat — Messagerie, Appels, IA & Événements", description: "ViChat : messagerie instantanée, appels vidéo, messages cryptés VIP, répondeur IA, silencieux intelligent et événements en direct." };
export default function RootLayout({ children }: { children: ReactNode }) { return (<html lang="fr"><body className="bg-[#EDEDED] text-zinc-900 antialiased">{children}</body></html>); }
