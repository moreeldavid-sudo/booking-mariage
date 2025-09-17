"use client";

import { useEffect, useRef, useState } from "react";

type Reservation = {
  id: string;                 // id interne Firestore
  humanCode?: string | null;  // Réf lisible (JJMMAA-##)
  lodgingName: string | null;
  lodgingId: string;
  qty: number;
  name: string;
  email: string;
  totalCHF: number;
  paymentStatus: "paid" | "pending" | string;
  status?: string;
  createdAt: number;
};

type Stock = { tipi140: number; tipi90: number };

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<string | null>(null);
  const [busyPurge, setBusyPurge] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ===== LOADERS =====
  async function fetchReservations() {
    const url = `/api/admin/reservations?ts=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("fetchReservations error", res.status, txt);
      setReservations([]);
      return;
    }
    const data = await res.json();
    let items: Reservation[] = Array.isArray(data?.items) ? data.items : [];
    // cacher les annulées
    items = items.filter((r) => (r.status || "confirmed") !== "cancelled");
    setReservations(items);
  }

  async function fetchStock() {
    const url = `/api/stock?ts=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("fetchStock error", res.status, txt);
      setStock({ tipi140: 0, tipi90: 0 });
      return;
    }
    const data = await res.json();
    setStock({
      tipi140: Number(data?.["tipi140"]?.remaining ?? 0),
      tipi90: Number(data?.["tipi90"]?.remaining ?? 0),
    });
  }

  // ===== ACTIONS RESA =====
  async function markPaid(id: string) {
    setRowLoading(id);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Erreur marquer payé (${res.status})\n${txt}`);
        return;
      }
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, paymentStatus: "paid" } : r)));
      await fetchReservations();
    } finally {
      setRowLoading(null);
    }
  }

  async function markPending(id: string) {
    setRowLoading(id);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "pending" }),
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Erreur remettre en attente (${res.status})\n${txt}`);
        return;
      }
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, paymentStatus: "pending" } : r)));
      await fetchReservations();
    } finally {
      setRowLoading(null);
    }
  }

  async function cancelReservation(id: string) {
    if (!confirm("Annuler cette réservation ?")) return;
    setRowLoading(id);
    const before = reservations;
    setReservations(before.filter((r) => r.id !== id)); // optimiste
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE",
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      await Promise.all([fetchReservations(), fetchStock()]);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Erreur annulation (${res.status})\n${txt}\nLa page a été resynchronisée.`);
      }
    } catch (e) {
      setReservations(before); // rollback si réseau HS
      alert("Erreur réseau pendant l’annulation. Réessaie.");
    } finally {
      setRowLoading(null);
    }
  }

  async function resetCounters() {
    if (!confirm("Remettre tous les compteurs à 0 (stock) ?")) return;
    const res = await fetch("/api/admin/stock/reset", { method: "POST", cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      alert(`Erreur réinitialisation (${res.status})\n${txt}`);
      return;
    }
    await fetchStock();
    alert("Compteurs remis à 0.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  // ===== PURGE ANNULÉES =====
  async function purgeCancelled() {
    try {
      setBusyPurge(true);

      // 1) Dry-run (GET) pour afficher combien seront supprimées
      const dry = await fetch(`/api/admin/reservations/purge-cancelled?olderThanDays=0&limit=0`, {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      }).then((r) => r.json());

      const count = Number(dry?.totalMatched ?? dry?.count ?? 0);
      if (count <= 0) {
        alert("Aucune réservation annulée à purger.");
        return;
      }

      if (
        !confirm(
          `Confirmer la purge ?\n${count} réservation(s) annulée(s) seront supprimées définitivement de Firestore.`
        )
      ) {
        return;
      }

      // 2) Purge réelle (POST)
      const res = await fetch(`/api/admin/reservations/purge-cancelled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ olderThanDays: 0, limit: 0 }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Erreur purge (${res.status})\n${j?.error || "Inconnue"}`);
        return;
      }

      const deleted = Number(j?.totalDeleted ?? j?.deleted ?? 0);
      alert(`Purge effectuée : ${deleted} réservation(s) supprimée(s).`);

      // 3) Rafraîchir la page admin
      await fetchReservations();
    } finally {
      setBusyPurge(false);
    }
  }

  // ===== INIT + POLLING =====
  useEffect(() => {
    (async () => {
      await Promise.all([fetchReservations(), fetchStock()]);
      setLoading(false);
    })();
    pollRef.current = setInterval(() => {
      fetchReservations();
      fetchStock();
    }, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ===== HELPERS =====
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
    const headers = ["Réf", "Nom", "Email", "Logement", "Qte", "Total CHF", "Paiement", "Date"];
    const rows = reservations.map((r) => [
      r.humanCode ?? "—",
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

  // ===== RENDER =====
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Admin — Réservations</h1>
          <div className="text-sm text-gray-600 mt-1">
            {reservations.length} réservation{reservations.length > 1 ? "s" : ""} affichée{reservations.length > 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 rounded bg-black text-white">
            Exporter CSV
          </button>
          <button onClick={resetCounters} className="px-3 py-2 rounded bg-gray-700 text-white" title="Remettre reservedUnits à 0">
            Réinitialiser compteurs
          </button>
          <button
            onClick={purgeCancelled}
            disabled={busyPurge}
            className={`px-3 py-2 rounded text-white ${busyPurge ? "bg-red-300" : "bg-red-600 hover:bg-red-700"}`}
            title="Supprimer définitivement les réservations annulées"
          >
            {busyPurge ? "Purge en cours…" : "Purger les annulées"}
          </button>
          <button onClick={logout} className="px-3 py-2 rounded bg-gray-500 text-white">
            Déconnexion
          </button>
          <button
            onClick={() => Promise.all([fetchReservations(), fetchStock()])}
            className="px-3 py-2 rounded bg-gray-200"
            title="Rafraîchir manuellement les données"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {stock && (
        <div className="flex flex-wrap gap-6 text-lg">
          <div><strong>Tipis lit 140 :</strong> {stock.tipi140} restants</div>
          <div><strong>Tipis lits 90 :</strong> {stock.tipi90} restants</div>
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
              <th className="border px-2 py-1 text-left">Réf</th>
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
            {reservations.map((r) => {
              const isBusy = rowLoading === r.id;
              return (
                <tr key={r.id} className={isBusy ? "opacity-60 pointer-events-none" : ""}>
                  <td className="border px-2 py-1">{r.humanCode ?? "—"}</td>
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
                    {r.paymentStatus === "paid" ? "Payé" : r.paymentStatus === "pending" ? "En attente de paiement" : r.paymentStatus}
                  </td>
                  <td className="border px-2 py-1">{formatDate(r.createdAt)}</td>
                  <td className="border px-2 py-1 space-x-2">
                    {r.paymentStatus !== "paid" ? (
                      <button
                        type="button"
                        className="px-2 py-1 bg-green-600 text-white rounded"
                        onClick={() => markPaid(r.id)}
                        disabled={isBusy}
                      >
                        Marquer payé
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="px-2 py-1 bg-amber-600 text-white rounded"
                        onClick={() => markPending(r.id)}
                        disabled={isBusy}
                      >
                        Remettre en attente
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      onClick={() => cancelReservation(r.id)}
                      disabled={isBusy}
                    >
                      Annuler
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
