// app/page.tsx
import LodgingList from "@/components/LodgingList";
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// --- Init Firebase client (safe côté serveur pour un simple fetch public) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

// Petit fetch de la collection 'lodgings'
async function getLodgings() {
  const { collection, getDocs } = await import("firebase/firestore");
  const snap = await getDocs(collection(db, "lodgings"));
  const items: any[] = [];
  snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
  // Trie par titre pour un ordre stable
  items.sort((a, b) => String(a.title || a.name).localeCompare(String(b.title || b.name)));
  return items.map((l) => ({
    id: l.id,
    name: l.title || l.name || l.id,
    description: l.description || "",
    imageUrl: l.imageUrl || "/tipi.jpg",
    totalUnits: l.totalUnits ?? 0,
    reservedUnits: l.reservedUnits ?? 0,
    type: l.type || "tipi",
  }));
}

export default async function Page() {
  const lodgings = await getLodgings();

  return (
    <main className="relative">
      {/* En-tête mariage */}
      <section className="px-4 pt-10 pb-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="font-[var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight
                       text-slate-900"
          >
            <span className="inline-block rounded-2xl px-3 py-1 bg-white/70 shadow-sm ring-1 ring-slate-200">
              Réservation hébergements <span className="italic">tente</span>
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Les tentes sont installées directement sur le{" "}
            <span className="font-medium text-slate-800">Domaine de Brés</span> (lieu du mariage).
          </p>

          <div className="mt-6 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>
      </section>

      {/* Liste des hébergements centrée */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Conteneur centré pour 2 cartes */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <LodgingList lodgings={lodgings} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
