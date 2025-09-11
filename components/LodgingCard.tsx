"use client";

import Image from "next/image";

export type Lodging = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string; // ex: "/tipi.jpg"
  totalUnits?: number;
  reservedUnits?: number;
  type?: "double_140" | "twin_90" | string;
};

type Props = {
  lodging: Lodging;
  onReserve?: (lodging: Lodging) => void;
  ctaLabel?: string;
};

const PRICE_PER_TIPI_TOTAL = 200; // CHF pour tout le séjour
const STAY_LABEL = "pour les 3 nuits (26–28 juin 2026)";

export default function LodgingCard({
  lodging,
  onReserve,
  ctaLabel = "Voir / Réserver",
}: Props) {
  const total = lodging.totalUnits ?? 0;
  const reserved = lodging.reservedUnits ?? 0;
  const remaining = Math.max(total - reserved, 0);
  const isFull = remaining <= 0;

  return (
    // 👉 On force la police des cartes en Inter (comme « avant »)
    <div className="font-[var(--font-inter)] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col">
      {/* Image */}
      <div className="relative h-56 w-full md:h-64">
        <Image
          src={lodging.imageUrl || "/tipi.jpg"}
          alt={lodging.name}
          fill
          className="object-cover"
          priority={false}
        />
      </div>

      {/* Contenu */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          {/* Titre — style Inter, lisible comme avant */}
          <h3 className="text-xl md:text-2xl font-semibold leading-snug tracking-tight text-slate-900">
            {lodging.name}
          </h3>

          {/* Disponibilités */}
          <span
            className={`text-sm md:text-base px-3 py-1 rounded-full whitespace-nowrap self-start ${
              remaining > 5
                ? "bg-emerald-50 text-emerald-700"
                : remaining > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-rose-50 text-rose-700"
            }`}
            title={`Disponibles: ${remaining}/${total}`}
          >
            {isFull ? "Complet" : `${remaining} dispo`}
          </span>
        </div>

        {/* Description */}
        {lodging.description && (
          <p className="text-sm md:text-base text-slate-700">
            {lodging.description}
          </p>
        )}

        {/* Prix (badge gris arrondi, comme avant) */}
        <div className="mt-1">
          <span className="inline-flex items-center gap-3 text-sm md:text-base">
            <span className="px-4 py-1 rounded-full bg-gray-100 text-gray-900 font-semibold">
              {PRICE_PER_TIPI_TOTAL} CHF
            </span>
            <span className="text-gray-600">par tipi {STAY_LABEL}</span>
          </span>
        </div>

        <div className="mt-1 text-xs md:text-sm text-gray-500">
          Prix identique pour lit 140 cm et 2×90 cm.
        </div>

        {/* Action */}
        {onReserve && (
          <button
            onClick={() => onReserve(lodging)}
            disabled={isFull}
            className={`mt-auto rounded-xl px-6 py-3 text-sm md:text-base text-white transition font-semibold ${
              !isFull
                ? "bg-black hover:bg-gray-800"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
