// app/page.tsx
import LodgingList from "@/components/LodgingList";
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// --- Init Firebase client (lecture publique) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

// Fetch lodgings
async function getLodgings() {
  const { collection, getDocs } = await import("firebase/firestore");
  const snap = await getDocs(collection(db, "lodgings"));
  const items: any[] = [];
  snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));

  // Surcharges d’intitulés (au cas où Firestore n’est pas encore à jour)
  const overrides: Record<string, string> = {
    "tipis-lit140": "tente avec 1 lit de 140 (2 pers.)",
    "tipis-lits90": "tente avec 2 lits de 90 (2 pers.)",
  };

  return items
    .sort((a, b) => String(a.title || a.name || a.id).localeCompare(String(b.title || b.name || b.id)))
    .map((l) => ({
      id: l.id,
      name: overrides[l.id] || l.title || l.name || l.id,
      description:
        l.description ||
        (l.id === "tipis-lit140"
          ? "Tente en coton de 13 m² avec un lit haut de gamme de 140 cm."
          : l.id === "tipis-lits90"
          ? "Tente en coton de 13 m² avec deux lits haut de gamme de 90 cm."
          : ""),
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
      {/* FOND : Domaine.jpg + voile blanc */}
      <div className="absolute inset-0 -z-10">
        <div className="hero-bg h-full w-full" />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* En-tête */}
      <section className="px-4 pt-10 pb-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-[var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Réservation hébergements tente
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-700">
            Les tentes sont installées directement sur le{" "}
            <span className="font-medium text-slate-900">Domaine de Brés</span> (lieu du mariage).
          </p>

          <div className="mt-6 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>
      </section>

      {/* Liste centrée */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
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
