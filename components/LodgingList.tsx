// components/LodgingList.tsx
"use client";

import { useState } from "react";
import LodgingCard from "./LodgingCard";
import ReserveModal from "./ReserveModal";

export default function LodgingList({ lodgings }: { lodgings: any[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 justify-items-center">
        {lodgings.map((l) => (
          <div key={l.id} className="w-full max-w-md h-full">
            <LodgingCard
              lodging={l}
              onReserve={(lodging) => {
                setSelected(lodging);
                setOpen(true);
              }}
              ctaLabel="Voir / Réserver"
            />
          </div>
        ))}
      </div>

      {open && selected && (
        <ReserveModal
          lodging={selected}
          onClose={() => {
            setOpen(false);
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
