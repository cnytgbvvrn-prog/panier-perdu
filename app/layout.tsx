import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const titres = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-titres",
  display: "swap",
});

const texte = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-texte",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1730",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://panier-perdu.vercel.app"),
  title: "Panier Perdu : récupérez vos paniers abandonnés",
  description:
    "29 €/mois pour relancer automatiquement les clients qui abandonnent leur panier. Shopify et WooCommerce, relances illimitées.",
  openGraph: {
    title: "Panier Perdu : récupérez vos paniers abandonnés",
    description:
      "29 €/mois pour relancer automatiquement les clients qui abandonnent leur panier.",
    siteName: "Panier Perdu",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${titres.variable} ${texte.variable}`}>
      <body>{children}</body>
    </html>
  );
}