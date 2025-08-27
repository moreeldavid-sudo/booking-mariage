// app/page.tsx
import { adminDb } from '@/lib/firebaseAdmin';
import LodgingList from '@/components/LodgingList';
import Image from 'next/image';

export const revalidate = 0; // données live (tu peux mettre 30 si tu veux un léger cache)

async function getLodgings() {
  const snap = await adminDb.collection('lodgings').get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  // option : tri par id pour un ordre stable
  docs.sort((a: any, b: any) => (a.id > b.id ? 1 : -1));
  return docs;
}

export default async function Page() {
  const lodgings = await getLodgings();

  return (
    <main className="main-shell py-8">
      {/* Hero minimal */}
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
        <LodgingList lodgings={lodgings} />
      </section>
    </main>
  );
}
