"use client";
import { useState } from "react";
import LodgingCard from "./LodgingCard";
import ReserveModal from "./ReserveModal";

export default function LodgingList({ lodgings }: { lodgings: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);

  function onReserve(l: any) {
    setSelected(l);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lodgings.map((l) => (
          <LodgingCard key={l.id} lodging={l} onReserve={onReserve} />
        ))}
      </div>

      {selected && (
        <ReserveModal
          lodging={{ id: selected.id, name: selected.name, type: selected.type }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
