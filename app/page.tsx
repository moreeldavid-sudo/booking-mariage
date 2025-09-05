// app/page.tsx
import { getAdminDb } from "@/lib/firebaseAdmin";
import LodgingList from "@/components/LodgingList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getLodgings() {
  const db = getAdminDb();
  const snap = await db.collection("lodgings").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
  return docs;
}

export default async function Page() {
  let lodgings: any[] = [];
  try {
    lodgings = await getLodgings();
  } catch (e) {
    console.error("getLodgings error", e);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Réservations Hébergements</h1>

      <section className="container mx-auto">
        {lodgings.length > 0 ? (
          <LodgingList lodgings={lodgings} />
        ) : (
          <p className="text-gray-600">
            Chargement des hébergements... (si ça ne s’affiche pas, vérifier la
            configuration serveur)
          </p>
        )}
      </section>
    </main>
  );
}
