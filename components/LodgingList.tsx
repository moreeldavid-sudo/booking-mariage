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

function SkeletonCard() {
  return (
    <div className="w-full max-w-md h-full animate-pulse">
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col">
        {/* Image placeholder */}
        <div className="relative h-48 w-full bg-gray-200" />
        <div className="p-4 flex-1 flex flex-col justify-between">
          {/* Title */}
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          {/* Description */}
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
          {/* Button */}
          <div className="mt-auto">
            <div className="h-10 bg-gray-200 rounded-lg w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LodgingList() {
  const [lodgings, setLodgings] = useState<Lodging[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 justify-items-center">
        {loading
          ? [1, 2].map((i) => <SkeletonCard key={i} />)
          : lodgings.map((l) => (
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
