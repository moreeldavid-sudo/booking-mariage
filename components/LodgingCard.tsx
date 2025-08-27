"use client";

import Image from "next/image";
import { useState } from "react";
import { db } from "../lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  serverTimestamp,
} from "firebase/firestore";

type Lodging = {
  id: string;
  title: string;
  note?: string;
  totalUnits: number;
  reservedUnits: number;
  unitCapacity: number;
  type: string;
};

type Props = { lodging: Lodging };

export default function LodgingCard({ lodging }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const available = Math.max(lodging.totalUnits - (lodging.reservedUnits || 0), 0);

  async function confirmReservation() {
    if (!name.trim()) {
      alert("Merci d’indiquer votre nom.");
      return;
    }
    setLoading(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "lodgings", lodging.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Hébergement introuvable");
        const data = snap.data() as Lodging;

        const left = data.totalUnits - (data.reservedUnits || 0);
        if (left < 1) throw new Error("Plus de disponibilités");

        // 1) Incrémente reservedUnits de +1
        tx.update(ref, { reservedUnits: (data.reservedUnits || 0) + 1 });

        // 2) Enregistre la réservation (collection top-level)
        const resRef = doc(collection(db, "reservations"));
        tx.set(resRef, {
          lodgingId: lodging.id,
          lodgingTitle: data.title,
          name,
          createdAt: serverTimestamp(),
        } as any);
      });

      setOpen(false);
      setName("");
      alert("Réservation enregistrée !");
    } catch (e: any) {
      alert(e?.message ?? "Erreur lors de la réservation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card overflow-hidden">
      {/* Image */}
      <div className="relative w-full h-44">
        <Image
          src="/tipi.jpg"
          alt={lodging.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold">{lodging.title}</h3>
        {lodging.note && <p className="text-sm text-gray-600">{lodging.note}</p>}

        {/* Prix & dates fixes (demande) */}
        <p className="text-sm text-gray-700">
          <strong>CHF 200.-</strong> • 2 nuits (26–28 juin 2025)
        </p>

        {/* Infos */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="badge bg-gray-100 text-gray-700">{lodging.type}</span>
          <span className="badge bg-emerald-100 text-emerald-700">
            {available} / {lodging.totalUnits} disp
          </span>
          <span className="badge bg-indigo-100 text-indigo-700">
            {lodging.unitCapacity} pers/unité
          </span>
        </div>

        <button className="btn-primary w-full mt-2" onClick={() => setOpen(true)}>
          Voir / Réserver
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90vw] max-w-md">
            <h4 className="text-lg font-semibold mb-3">
              Réserver – {lodging.title}
            </h4>

            <label className="block text-sm mb-2">Nom & prénom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Jeanne Dupont"
              className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring focus:ring-rose-200"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100"
              >
                Annuler
              </button>
              <button
                disabled={loading}
                onClick={confirmReservation}
                className="btn-primary px-4 py-2"
              >
                {loading ? "Enregistrement…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
