// app/page.tsx
import Hero from "../components/Hero";
import LodgingList from "../components/LodgingList";

export default function Page() {
  return (
    <main className="container mx-auto px-6 py-6 space-y-8">
      <Hero />

      {/* Section infos optionnelle */}
      <section id="infos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4">
          <h3 className="font-semibold mb-1">Lieu</h3>
          <p className="text-sm text-gray-600">
            Domaine du Bois – Accès fléché depuis la D12.
          </p>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-1">Arrivées</h3>
          <p className="text-sm text-gray-600">À partir de 15h – Parking gratuit.</p>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-1">Contact</h3>
          <p className="text-sm text-gray-600">vanessa&david · merci ♥</p>
        </div>
      </section>

      {/* La liste d’hébergements */}
      <LodgingList />
    </main>
  );
}
