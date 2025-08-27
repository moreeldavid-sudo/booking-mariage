'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LodgingCard from './LodgingCard';
import type { Lodging } from '../lib/types';

export default function LodgingList(): JSX.Element {
  const [items, setItems] = useState<Lodging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'lodgings'));
        const data: Lodging[] = snap.docs.map((d) => {
          // on récupère les champs du doc et on ajoute l'id
          const doc = d.data() as Omit<Lodging, 'id'>;
          return { id: d.id, ...doc };
        });
        setItems(data);
      } catch (e: any) {
        setError(e?.message ?? 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;

 return (
  <section id="lodgings" className="container mx-auto p-6">
    <h2 className="text-2xl font-bold mb-6">Nos hébergements</h2>

    {loading ? (
      <p>Chargement…</p>
    ) : error ? (
      <p className="text-red-600">Erreur : {error}</p>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <LodgingCard
            key={item.id}
            lodging={item}
            onReserve={(l) => alert(`Réserver: ${l.title}`)}
          />
        ))}
      </div>
    )}
  </section>
);

