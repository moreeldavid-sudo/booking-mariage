// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Réservations Hébergements",
  description: "Plateforme de réservation pour le mariage",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="relative min-h-screen">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 -z-10"
          style={{ backgroundImage: "url('/Domaine.jpg')" }}
        />
        
        {/* Contenu du site */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
