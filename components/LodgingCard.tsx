"use client";
import Image from "next/image";

type Lodging = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  totalUnits?: number;
  reservedUnits?: number;
};

type Props = {
  lodging: Lodging;
  onReserve?: (lodging: Lodging) => void;
};

const PRICE_PER_TIPI_TOTAL = 200;
const STAY_LABEL = "pour les 3 nuits (26-28 juin 2026)";

export default function LodgingCard({ lodging, onReserve }: Props) {
  const total = lodging.totalUnits ?? 0;
  const reserved = lodging.reservedUnits ?? 0;
  const remaining = Math.max(total - reserved, 0);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <div className="relative h-48 w-full">
        <Image
          src={lodging.imageUrl || "/tipi.jpg"}
          alt={lodging.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{lodging.name}</h3>
        {lodging.description && (
          <p className="text-sm text-gray-600">{lodging.description}</p>
        )}

        <div className="text-sm">
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-900 font-medium">
            {PRICE_PER_TIPI_TOTAL} CHF
          </span>{" "}
          <span className="text-gray-600">par tipi {STAY_LABEL}</span>
        </div>

        <div className="text-xs text-gray-500">
          Disponibles : {remaining}/{total}
        </div>

        {onReserve && (
          <button
            onClick={() => onReserve(lodging)}
            disabled={remaining <= 0}
            className={`mt-2 w-full rounded-xl px-4 py-2 text-sm text-white ${
              remaining > 0 ? "bg-black hover:bg-gray-800" : "bg-gray-400"
            }`}
          >
            Voir / Réserver
          </button>
        )}
      </div>
    </div>
  );
}
