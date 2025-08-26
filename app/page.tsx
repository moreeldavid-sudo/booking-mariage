"use client";

import { useEffect, useState } from "react";

type Lodging = {
  id: string;
  title: string;
  note: string;
  totalUnits: number;
  reservedUnits: number;
};

export default function HomePage() {
  const [lodgings, setLodgings] = useState<Lodging[]>([]);

  useEffect(() => {
    // 🔗 Pour l’instant on met du fictif (tu brancheras Firestore après)
    setLodgings([
      { id: "tipis-lit140", title: "Tipi lit 140 (2 pers.)", note: "Lit double 140 cm", totalUnits: 20, reservedUnits: 0 },
      { id: "tipis-lits90", title: "Tipi lits 90 (2 pers.)", note: "Deux lits simples 90 cm", totalUnits: 20, reservedUnits: 0 },
    ]);
  }, []);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Réservations Hébergements</h1>
      <div className="grid gap-4">
        {lodgings.map((lodging) => {
          const available = lodging.totalUnits - lodging.reservedUnits;
          return (
            <div key={lodging.id} className="border rounded-xl p-4 shadow">
              <h2 className="text-lg font-semibold">{lodging.title}</h2>
              <p className="text-sm text-gray-600">{lodging.note}</p>
              <p className="mt-2">
                <strong>{available}</strong> / {lodging.totalUnits} disponibles
              </p>
              <button
                disabled={available === 0}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
              >
                Réserver
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
