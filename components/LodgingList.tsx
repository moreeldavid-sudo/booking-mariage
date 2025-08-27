"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import LodgingCard from "./LodgingCard";

type Lodging = {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
  type: string;
};

export default function LodgingList() {
  const [items, setItems] = useState<Lodging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "lodgings"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Lodging, "id">),
        }));
        setItems(data);
      } catch (e: any) {
        setError(e?.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <LodgingCard key={item.id} lodging={item} />
      ))}
    </div>
  );
}
