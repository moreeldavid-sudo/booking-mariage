import Image from "next/image";
import React from "react";

type Lodging = {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
  type: string;
};

type LodgingCardProps = {
  lodging: Lodging;
};

export default function LodgingCard({ lodging }: LodgingCardProps) {
  // Places encore disponibles (jamais < 0)
  const available = Math.max(lodging.totalUnits - lodging.reservedUnits, 0);

  return (
    <article className="card overflow-hidden">
      {/* Image */}
      <div className="relative w-full aspect-[4/3]">
        <Image
          src="/tipi.jpg"
          alt={lodging.title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{lodging.title}</h3>

        {lodging.note ? (
          <p className="text-sm text-gray-600">{lodging.note}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="badge bg-gray-100 text-gray-700">{lodging.type}</span>
          <span className="badge bg-emerald-100 text-emerald-700">
            {available} / {lodging.totalUnits} dispo
          </span>
          <span className="badge bg-indigo-100 text-indigo-700">
            {lodging.unitCapacity} pers/unité
          </span>
        </div>
      </div>

      <div className="p-4 pt-0">
        {/* TODO: remplace href par ta vraie page de réservation plus tard */}
        <a href="#" className="btn-primary w-full inline-flex justify-center">
          Voir / Réserver
        </a>
      </div>
    </article>
  );
}
