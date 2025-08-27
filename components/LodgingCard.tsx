'use client';
import Image from 'next/image';
import { useState } from 'react';
import ReservationModal from './ReservationModal';

export type LodgingCardProps = {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity?: number;
};

export default function LodgingCard(props: LodgingCardProps) {
  const { id, title, note, totalUnits, reservedUnits, unitCapacity } = props;
  const [currentReserved, setCurrentReserved] = useState(reservedUnits);
  const [open, setOpen] = useState(false);

  const remaining = Math.max(0, totalUnits - currentReserved);

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src="/tipi.jpg"
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {note && <p className="mt-1 text-sm text-gray-600">{note}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
          <span>Capacité/unité: {unitCapacity ?? '—'}</span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
            Disponibles: <strong className="ml-1">{remaining}</strong>
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1">
            Réservés: <strong className="ml-1">{currentReserved}</strong>
          </span>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
          >
            Voir / Réserver
          </button>
        </div>
      </div>

      {open && (
        <ReservationModal
          lodgingId={id}
          onClose={() => setOpen(false)}
          onSuccess={(newReserved) => setCurrentReserved(newReserved)}
        />
      )}
    </div>
  );
}
