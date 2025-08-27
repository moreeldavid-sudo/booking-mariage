// components/LodgingCard.tsx
import React from "react";

type Lodging = {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
  type: string;
  imageUrl?: string; // image optionnelle (URL Firestore) sinon on met /tipi.jpg
};

type Props = {
  lodging: Lodging;
  onReserve?: (lodging: Lodging) => void; // callback optionnel
};

export default function LodgingCard({ lodging, onReserve }: Props) {
  const available =
    Math.max(0, (lodging.totalUnits ?? 0) - (lodging.reservedUnits ?? 0));

  const img = lodging.imageUrl && lodging.imageUrl.trim() !== ""
    ? lodging.imageUrl
    : "/tipi.jpg"; // fallback vers ton image publique

  return (
    <div className="card overflow-hidden">
      <img
        src={img}
        alt={lodging.title}
        className="w-full h-44 object-cover"
        loading="lazy"
      />

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{lodging.title}</h3>
          <span
            className={`badge ${
              available > 0 ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {available > 0 ? `${available} dispo` : "Complet"}
          </span>
        </div>

        {lodging.note && (
          <p className="text-sm text-gray-600">{lodging.note}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-500">
            Capacité: {lodging.unitCapacity} pers • Total: {lodging.totalUnits}
          </p>

          <button
            className={`btn-primary px-3 py-1 ${
              available === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => available > 0 && onReserve?.(lodging)}
            disabled={available === 0}
          >
            Voir / Réserver
          </button>
        </div>
      </div>
    </div>
  );
}
