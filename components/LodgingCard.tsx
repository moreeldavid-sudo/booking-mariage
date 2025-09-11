"use client";

import React from "react";
import { Lodging } from "../types";
import { Badge } from "./ui/badge";

interface LodgingCardProps {
  lodging: Lodging;
  onReserve: (lodging: Lodging) => void;
}

export default function LodgingCard({ lodging, onReserve }: LodgingCardProps) {
  const available = lodging.totalUnits - lodging.reservedUnits;
  const isFull = available <= 0;

  return (
    <div className="card flex flex-col h-full">
      <img
        src="/tipi.jpg"
        alt={lodging.title}
        className="w-full h-48 object-cover rounded-t-xl"
      />

      <div className="p-4 flex flex-col flex-grow">
        {/* Titre plus grand */}
        <h2 className="text-xl md:text-2xl font-semibold mb-2">
          {lodging.title}
        </h2>

        {/* Badge de dispo */}
        {isFull ? (
          <Badge className="bg-red-500 text-white">Complet</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-700">
            {available} dispo
          </Badge>
        )}

        {/* Description agrandie */}
        <p className="mt-3 text-base md:text-lg text-gray-700">
          {lodging.description}
        </p>

        {/* Prix */}
        <div className="mt-4 flex items-center space-x-2">
          <span className="px-2 py-1 rounded-full bg-gray-100 font-semibold">
            200 CHF
          </span>
          <span className="text-sm md:text-base text-gray-600">
            par tipi pour les 3 nuits (26–28 juin 2026)
          </span>
        </div>

        {/* Petit texte */}
        <p className="mt-2 text-xs md:text-sm text-gray-500">
          Prix identique pour lit 140 cm et 2×90 cm.
        </p>

        {/* Bouton collé en bas */}
        <div className="mt-auto pt-4">
          <button
            className={`btn w-full ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isFull && onReserve(lodging)}
            disabled={isFull}
          >
            Voir / Réserver
          </button>
        </div>
      </div>
    </div>
  );
}
