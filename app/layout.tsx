// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // tu peux ajouter 300 ou 800 si tu veux
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Réservation d’hébergements en tentes — Mariage Vanessa & David",
  description: "Réservation des tentes pour le mariage – Domaine de Brés",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${cormorant.variable} bg-gradient-to-br from-slate-50 to-white text-slate-900 antialiased`}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
