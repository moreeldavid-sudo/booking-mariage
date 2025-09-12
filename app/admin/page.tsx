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

type Stock = {
  tipi140: number;
  tipi90: number;
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchReservations() {
    const res = await fetch("/api/admin/reservations");
    const data = await res.json();
    setReservations(data.items || []);
  }

  async function fetchStock() {
    const res = await fetch("/api/stock");
    const data = await res.json();
    // Adapter aux clés renvoyées par l’API
    setStock({
      tipi140: Number(data?.["tipi140"]?.remaining ?? 0),
      tipi90: Number(data?.["tipi90"]?.remaining ?? 0),
    });
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
    fetchStock(); // mettre à jour les compteurs
  }

  useEffect(() => {
    Promise.all([fetchReservations(), fetchStock()]).then(() =>
      setLoading(false)
    );
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin — Réservations</h1>

      {stock && (
        <div className="flex space-x-6 text-lg">
          <div>
            <strong>Tipis lit 140 :</strong> {stock.tipi140} restants
          </div>
          <div>
            <strong>Tipis lits 90 :</strong> {stock.tipi90} restants
          </div>
        </div>
      )}

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
                    r.paymentStatus === "paid"
                      ? "text-green-600"
                      : "text-red-600"
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
