import LodgingList from "../components/LodgingList";

export default function Page() {
  return (
    <main className="container px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        Réservations Hébergements
      </h1>

      {/* Liste en temps réel depuis Firestore */}
      <LodgingList />
    </main>
  );
}
