// app/page.tsx
import LodgingList from "../components/LodgingList";

export default function Page() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Réservations Hébergements</h1>
      <LodgingList />
    </main>
  );
}
