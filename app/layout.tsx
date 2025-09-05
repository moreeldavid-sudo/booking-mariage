// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";

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
      <body>
        <header className="p-4">
          <Image
            src="/Domaine.jpg"
            alt="Logo Domaine"
            width={150}
            height={80}
            priority
          />
        </header>
        {children}
      </body>
    </html>
  );
}
