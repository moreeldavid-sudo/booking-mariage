// components/LodgingCard.tsx
'use client';

import type { Lodging } from '../lib/types';

export interface LodgingCardProps {
  lodging: Lodging;
}

export default function LodgingCard({ lodging }: LodgingCardProps) {
  return (
    <article className="card p-4">
      <h3 className="font-semibold">{lodging.title}</h3>
      <p className="text-sm text-gray-600 capitalize">{lodging.type}</p>

      <p className="mt-2 text-sm">
        Capacité: {lodging.unitCapacity} pers./unité — {lodging.totalUnits} unités
      </p>

      {typeof lodging.reservedUnits === 'number' && (
        <p className="mt-1 text-xs">
          Réservées: {lodging.reservedUnits}
        </p>
      )}

      {lodging.note && <p className="mt-2 text-xs">{lodging.note}</p>}
    </article>
  );
}
