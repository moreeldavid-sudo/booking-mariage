import "./globals.css";

export const metadata = {
  title: "Réservations – Mariage Vanessa & David",
  description: "Tipis & hébergements",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
