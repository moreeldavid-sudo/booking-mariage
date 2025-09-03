// app/page.tsx
import { getAdminDb } from '@/lib/firebaseAdmin';
import LodgingList from '@/components/LodgingList';
import Image from 'next/image';

export const runtime = 'nodejs';       // ← force Node runtime
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLodgings() {
  const db = getAdminDb();
  const snap = await db.collection('lodgings').get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  docs.sort((a: any, b: any) => (a.id > b.id ? 1 : -1));
  return docs;
}

export default async function Page() {
  let lodgings: any[] = [];
  try {
    lodgings = await getLodgings();
  } catch (e) {
    console.error('getLodgings error:', e);
  }

  return (
    <main className="main-shell py-8">
      {/* Hero */}
      <div className="relative mb-8 h-44 w-full overflow-hidden rounded-2xl ring-1 ring-black/5">
        <Image
          src="/domaine.jpg"
          alt="Domaine"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent" />
        <div className="absolute bottom-3 left-4 text-2xl font-semibold">
          Réservations Hébergements
        </div>
      </div>

      {/* Liste */}
      <section className="container mx-auto p-6">
        {lodgings.length > 0 ? (
          <LodgingList lodgings={lodgings} />
        ) : (
          <p className="text-gray-600">
            Chargement des hébergements… (si ça ne s’affiche pas, vérifier la configuration serveur)
          </p>
        )}
      </section>
    </main>
  );
}
