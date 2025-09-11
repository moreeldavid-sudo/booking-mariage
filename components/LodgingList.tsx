// components/LodgingList.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import LodgingCard from "./LodgingCard";
import ReserveModal from "./ReserveModal";

type Lodging = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  totalUnits?: number;
  reservedUnits?: number;
  type?: string;
};

export default function LodgingList() {
  const [lodgings, setLodgings] = useState<Lodging[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Lodging | null>(null);

  useEffect(() => {
    const q = query(collection(db, "lodgings"), orderBy("title"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.title || data.name || d.id,
          description: data.description || "",
          imageUrl: data.imageUrl || "/tipi.jpg",
          totalUnits: data.totalUnits ?? 0,
          reservedUnits: data.reservedUnits ?? 0,
          type: data.type || "tipi",
        } as Lodging;
      });
      setLodgings(items);
    });
    return () => unsub();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 justify-items-center">
        {lodgings.map((l) => (
          <div key={l.id} className="w-full max-w-md h-full">
            <LodgingCard
              lodging={l as any}
              onReserve={(lodging) => {
                setSelected(lodging as any);
                setOpen(true);
              }}
              ctaLabel="Voir / Réserver"
            />
          </div>
        ))}
      </div>

      {open && !!selected && (
        <ReserveModal
          lodging={selected as any}
          onClose={() => {
            setOpen(false);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
