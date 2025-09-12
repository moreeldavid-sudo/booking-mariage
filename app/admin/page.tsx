"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  lodgingName: string | null;
  lodgingId: string;
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

  async function markPaid(id: string) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    });
    fetchReservations();
  }

  async function cancelReservation(id: string) {
    if (!confirm("Annuler cette réservation ?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    fetchReservations();
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
              <th className="border px-2 py-1">Actions</th>
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
                <td className="border px-2 py-1 space-x-2">
                  {r.paymentStatus !== "paid" && (
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded"
                      onClick={() => markPaid(r.id)}
                    >
                      Marquer payé
                    </button>
                  )}
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => cancelReservation(r.id)}
                  >
                    Annuler
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
