// components/LodgingList.tsx
"use client";
import LodgingCard from "./LodgingCard";

export default function LodgingList({ lodgings }: { lodgings: any[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 justify-items-center">
      {lodgings.map((l) => (
        <div key={l.id} className="w-full max-w-md h-full">
          <LodgingCard lodging={l} />
        </div>
      ))}
    </div>
  );
}
