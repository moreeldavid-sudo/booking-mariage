"use client";
import { useState } from "react";

export default function ReserveModal({ lodging, onClose }: { lodging: any; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const PRICE = 200;
  const total = quantity * PRICE;

  async function handleReserve() {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodgingId: lodging.id,
          lodgingName: lodging.name,
          customerName: name,
          customerEmail: email,
          quantity,
        }),
      });

      if (!res.ok) throw new Error("Erreur réservation");

      setDone(true);
    } catch (err) {
      alert("Impossible d’enregistrer la réservation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        {!done ? (
          <>
            <h2 className="text-xl font-bold mb-4">Réserver {lodging.name}</h2>
            <label className="block mb-2">
              Nom :
              <input
                className="w-full border rounded px-2 py-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block mb-2">
              Email :
              <input
                className="w-full border rounded px-2 py-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block mb-4">
              Nombre de tipis :
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </label>
            <p className="mb-4 font-semibold">Total : {total} CHF</p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300">Annuler</button>
              <button
                onClick={handleReserve}
                disabled={loading}
                className="px-3 py-1 rounded bg-green-600 text-white"
              >
                {loading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4">Merci 🎉</h2>
            <p>Votre réservation est enregistrée.</p>
            <p className="mt-2">Vous allez recevoir un email de confirmation.</p>
            <button
              onClick={onClose}
              className="mt-4 px-3 py-1 rounded bg-blue-600 text-white"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
