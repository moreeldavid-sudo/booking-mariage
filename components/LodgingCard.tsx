"use client";

import React from "react";

interface LodgingCardProps {
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
}

export default function LodgingCard({
  title,
  note,
  totalUnits,
  reservedUnits,
  unitCapacity,
}: LodgingCardProps) {
  const available = totalUnits - reservedUnits;
  const isFull = available <= 0;

  return (
    <div
      className={`border rounded-xl shadow-md p-4 ${
        isFull ? "bg-gray-200 opacity-70" : "bg-white"
      }`}
    >
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      {note && <p className="text-sm text-gray-600 mb-2">{note}</p>}
      <p className="text-sm">
        Capacité : <strong>{unitCapacity}</strong> pers.
      </p>
      <p className="text-sm">
        Places disponibles :{" "}
        <strong className={isFull ? "text-red-600" : "text-green-600"}>
          {isFull ? "Complet" : available}
        </strong>
      </p>
    </div>
  );
}
