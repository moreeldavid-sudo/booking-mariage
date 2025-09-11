// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"], // ajustable
});

export const metadata: Metadata = {
  title: "Réservation hébergements — Mariage",
  description: "Réservation des tentes pour le mariage – Domaine de Brés",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${cormorant.variable} bg-gradient-to-br from-slate-50 to-white text-slate-900 antialiased`}
      >
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
