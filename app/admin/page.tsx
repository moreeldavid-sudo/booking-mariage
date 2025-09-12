"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  lodgingName: string | null;
  qty: number;
  name: string;
  email: string;
  totalCHF: number;
  paymentStatus: string;
  createdAt: number;
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchReservations() {
    try {
      const res = await fetch("/api/admin/reservations");
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      setReservations(data.items || []);
    } catch (err) {
      console.error("Erreur fetch reservations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin — Réservations</h1>

      {loading ? (
        <p>Chargement…</p>
      ) : reservations.length === 0 ? (
        <p>Aucune réservation.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Nom</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Logement</th>
              <th className="border px-2 py-1">Qté</th>
              <th className="border px-2 py-1">Total CHF</th>
              <th className="border px-2 py-1">Paiement</th>
              <th className="border px-2 py-1">Créée</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.name}</td>
                <td className="border px-2 py-1">{r.email}</td>
                <td className="border px-2 py-1">{r.lodgingName}</td>
                <td className="border px-2 py-1">{r.qty}</td>
                <td className="border px-2 py-1">{r.totalCHF}</td>
                <td
                  className={`border px-2 py-1 ${
                    r.paymentStatus === "paid" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.paymentStatus}
                </td>
                <td className="border px-2 py-1">
                  {new Date(r.createdAt).toLocaleString("fr-CH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
