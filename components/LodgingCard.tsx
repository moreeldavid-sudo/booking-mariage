"use client";

import React from "react";
import Image from "next/image";

type Lodging = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string; // ex: "/tipi.jpg"
  type?: "double_140" | "twin_90" | string;
  totalUnits?: number;
  reservedUnits?: number;
};

type Props = {
  lodging: Lodging;
  onReserve?: (lodging: Lodging) => void;
  onView?: (lodging: Lodging) => void;
  ctaLabel?: string;
};

const PRICE_PER_TIPI_TOTAL = 200; // CHF pour l’intégralité du séjour
const STAY_LABEL = "pour les 3 nuits (26–28 juin 2026)";

function formatChf(amount: number) {
  try {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback simple si Intl indisponible en edge/non-Node
    return `${amount} CHF`;
  }
}

export default function LodgingCard({
  lodging,
  onReserve,
  onView,
  ctaLabel = "Voir / Réserver",
}: Props) {
  const total = lodging.totalUnits ?? 0;
  const reserved = lodging.reservedUnits ?? 0;
  const remaining = Math.max(total - reserved, 0);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col">
      {/* Image */}
      <div className="relative h-48 w-full">
        <Image
          src={lodging.imageUrl || "/tipi.jpg"}
          alt={lodging.name}
          fill
          className="object-cover"
          priority={false}
        />
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug">{lodging.name}</h3>

          {/* Disponibilités */}
          <div
            className={`text-sm px-2 py-1 rounded-full whitespace-nowrap ${
              remaining > 5
                ? "bg-emerald-50 text-emerald-700"
                : remaining > 0
                ? "bg-amber-50 text-amber-700"
                : "bg-rose-50 text-rose-700"
            }`}
            title={`Disponibles: ${remaining}/${total}`}
          >
            {remaining > 0 ? `${remaining} dispo` : "Complet"}
          </div>
        </div>

        {/* Description */}
        {lodging.description && (
          <p className="text-sm text-gray-600">{lodging.description}</p>
        )}

        {/* PRIX FIXE POUR LE SÉJOUR */}
        <div className="mt-1">
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-900 font-medium">
              {formatChf(PRICE_PER_TIPI_TOTAL)}
            </span>
            <span className="text-gray-600">par tipi {STAY_LABEL}</span>
          </span>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Le prix est identique pour les deux styles (lit 140 cm / 2×90 cm).
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {onView && (
            <button
              onClick={() =>
