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
  createdAt: number; // ms epoch
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
    fetchStock(); // mise à jour compteurs
  }

  async function resetCounters() {
    if (!confirm("Remettre tous les compteurs à 0 ?")) return;
    const res = await fetch("/api/admin/stock/reset", { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Erreur lors de la réinitialisation");
      return;
    }
    await fetchStock();
    await fetchReservations();
    alert("Compteurs remis à 0.");
  }

  useEffect(() => {
    Promise.all([fetchReservations(), fetchStock()]).then(() =>
      setLoading(false)
    );
  }, []);

  // ===== Helpers export & affichage =====
  function csvEscape(val: unknown) {
    const s = String(val ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }
  function formatDate(ms: number) {
    try {
      return new Date(ms).toLocaleString("fr-CH");
    } catch {
      return "";
    }
  }
  function statusFr(s: string) {
    if (s === "paid") return "Payé";
    if (s === "pending") return "En attente de paiement";
    if (s === "cancelled") return "Annulée";
    return s;
  }
  function exportCSV() {
    const headers = ["No", "Nom", "Email", "Logement", "Qte", "Total CHF", "Paiement", "Date"];
    const rows = reservations.map((r, i) => [
      String(i + 1),
      r.name,
      r.email,
      r.lodgingName ?? "",
      String(r.qty),
      String(r.totalCHF),
      statusFr(r.paymentStatus),
      formatDate(r.createdAt),
    ]);
    const sep = ";";
    const csvBody =
      headers.map(csvEscape).join(sep) +
      "\n" +
      rows.map((row) => row.map(csvEscape).join(sep)).join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvBody], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `reservations-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Admin — Réservations</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded bg-black text-white"
            title="Exporter toutes les réservations en CSV"
          >
            Exporter CSV
          </button>
          <button
            onClick={resetCounters}
            className="px-3 py-2 rounded bg-gray-700 text-white"
            title="Remettre reservedUnits à 0 pour tous les logements"
          >
            Réinitialiser compteurs
          </button>
        </div>
      </div>

      {stock && (
        <div className="flex flex-wrap gap-6 text-lg">
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
              <th className="border px-2 py-1 text-left">Nom</th>
              <th className="border px-2 py-1 text-left">Email</th>
              <th className="border px-2 py-1 text-left">Logement</th>
              <th className="border px-2 py-1 text-right">Qte</th>
              <th className="border px-2 py-1 text-right">Total CHF</th>
              <th className="border px-2 py-1 text-left">Paiement</th>
              <th className="border px-2 py-1 text-left">Créée</th>
              <th className="border px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.name}</td>
                <td className="border px-2 py-1">{r.email}</td>
                <td className="border px-2 py-1">{r.lodgingName}</td>
                <td className="border px-2 py-1 text-right">{r.qty}</td>
                <td className="border px-2 py-1 text-right">{r.totalCHF}</td>
                <td
                  className={`border px-2 py-1 ${
                    r.paymentStatus === "paid"
                      ? "text-green-600"
                      : r.paymentStatus === "pending"
                      ? "text-amber-700"
                      : "text-red-600"
                  }`}
                >
                  {statusFr(r.paymentStatus)}
                </td>
                <td className="border px-2 py-1">{formatDate(r.createdAt)}</td>
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
