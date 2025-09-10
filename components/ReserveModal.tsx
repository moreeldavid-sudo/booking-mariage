"use client";
import { useState } from "react";
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL } from "@/lib/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  lodging: { id: string; name: string; type?: string };
};

export default function ReserveModal({ open, onClose, lodging }: Props) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<{ id: string; total: number } | null>(null);

  const total = qty * PRICE_PER_TIPI_TOTAL;
  if (!open) return null;

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodgingId: lodging.id,
          quantity: qty,
          name: guestName,
          email: guestEmail,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur");
      setReservation({ id: data.reservationId, total: data.totalChf });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {!reservation ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Réserver – {lodging.name}</h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Prix: {PRICE_PER_TIPI_TOTAL} CHF / tipi {STAY_LABEL}</div>

              <label className="block">
                <span className="text-sm">Nom et prénom</span>
                <input value={guestName} onChange={e=>setGuestName(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
              </label>
              <label className="block">
                <span className="text-sm">Email</span>
                <input type="email" value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
              </label>
              <label className="block">
                <span className="text-sm">Nombre de tipis</span>
                <input type="number" min={1} max={10} value={qty} onChange={e=>setQty(Number(e.target.value||1))} className="mt-1 w-full rounded-lg border p-2" />
              </label>

              <div className="mt-2 rounded-xl bg-gray-50 p-3 text-sm">
                <div className="flex justify-between"><span>Total</span><strong>{total} CHF</strong></div>
              </div>

              <div className="flex gap-2 pt-3">
                <button onClick={onClose} className="flex-1 rounded-xl border px-4 py-2">Annuler</button>
                <button onClick={submit} disabled={loading || !guestName || !guestEmail} className="flex-1 rounded-xl bg-black px-4 py-2 text-white">
                  {loading ? "Envoi..." : "Confirmer"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Merci, réservation enregistrée ✅</h2>
            <p className="text-sm text-gray-700">
              Référence: <span className="font-mono">{reservation.id}</span><br/>
              Montant: <strong>{reservation.total} CHF</strong> — {STAY_LABEL}
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <p className="text-gray-700">Paiement par TWINT recommandé (ou cash à l’arrivée).</p>
              <img
                alt="QR TWINT"
                className="mx-auto rounded-lg border"
                src={`/api/qr?amount=${reservation.total}&ref=${encodeURIComponent("Resa " + reservation.id)}`}
              />
              <p className="text-gray-500 text-xs">
                Scannez ce QR avec l’app. Référence : Resa {reservation.id}.
              </p>
            </div>

            <div className="mt-4">
              <button onClick={onClose} className="w-full rounded-xl bg-black px-4 py-2 text-white">Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
