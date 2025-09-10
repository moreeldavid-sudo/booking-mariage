"use client";
import { useState } from "react";
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL, TWINT_PHONE_E164 } from "@/lib/constants";

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
  const [copied, setCopied] = useState<string | null>(null);

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

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  const refText = reservation ? `Resa ${reservation.id}` : "";
  const phoneDisplay = "+41 78 902 87 58"; // affichage lisible

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

            {/* Bloc paiement TWINT – instructions + boutons copier */}
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-gray-700">Paiement par TWINT (recommandé) ou en espèces à l’arrivée.</p>

              <div className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-28 text-xs text-gray-500">Numéro</div>
                  <div className="font-medium">{phoneDisplay}</div>
                  <button
                    onClick={() => copy(TWINT_PHONE_E164, "phone")}
                    className="ml-auto rounded-lg border px-2 py-1 text-xs"
                  >
                    {copied === "phone" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-28 text-xs text-gray-500">Montant</div>
                  <div className="font-medium">{reservation.total} CHF</div>
                  <button
                    onClick={() => copy(String(reservation.total), "amount")}
                    className="ml-auto rounded-lg border px-2 py-1 text-xs"
                  >
                    {copied === "amount" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-28 text-xs text-gray-500">Référence</div>
                  <div className="font-medium break-all">{refText}</div>
                  <button
                    onClick={() => copy(refText, "ref")}
                    className="ml-auto rounded-lg border px-2 py-1 text-xs"
                  >
                    {copied === "ref" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>

              <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                <li>Ouvrez l’app TWINT.</li>
                <li>Choisissez <em>Envoyer de l’argent</em>.</li>
                <li>Collez le numéro, entrez le montant, ajoutez la référence.</li>
              </ol>
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
