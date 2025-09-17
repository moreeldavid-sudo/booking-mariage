"use client";
import { useState } from "react";

type Props = {
  lodging: any;
  onClose: () => void;
};

// Taux EUR (modifiable via .env => NEXT_PUBLIC_EUR_RATE)
const EUR_RATE = Number(process.env.NEXT_PUBLIC_EUR_RATE ?? 1.075);

// Formatters
const fmtCHF = new Intl.NumberFormat("fr-CH");
const fmtEUR = new Intl.NumberFormat("fr-FR");

export default function ReserveModal({ lodging, onClose }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Prix unitaire côté client (même valeur que côté serveur)
  const UNIT_CHF = 200;

  const totalChf = (Number(quantity) || 0) * UNIT_CHF;
  const totalEur = Math.round(totalChf * EUR_RATE);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodgingId: lodging.id,
          quantity,
          firstName,
          lastName,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      setConfirmation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ===== Écran de confirmation =====
  if (confirmation) {
    const confChf = Number(confirmation.totalChf ?? totalChf);
    const confEur =
      typeof confirmation.totalEur === "number"
        ? Number(confirmation.totalEur)
        : Math.round(confChf * EUR_RATE);

    const ref = confirmation.reservationCode || confirmation.humanCode || confirmation.reservationId;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Merci {firstName} !</h2>

          <p className="mb-2">
            Votre réservation est confirmée.
            <br />
            Réf : <b>{ref}</b>
          </p>

          <p className="mt-2">
            Montant total :{" "}
            <b>
              {fmtCHF.format(confChf)} CHF / {fmtEUR.format(confEur)} €
            </b>
          </p>

          <p className="mt-2">Un email de confirmation vous a été envoyé.</p>

          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // ===== Formulaire =====
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Réserver {lodging.title || lodging.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nombre de tipis</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="w-full border rounded p-2"
            />
          </div>

          {/* Total CHF + EUR sur une seule ligne */}
          <div className="text-sm md:text-base font-semibold">
            Total : {fmtCHF.format(totalChf)}&nbsp;CHF&nbsp;/&nbsp;
            {fmtEUR.format(totalEur)}&nbsp;€
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Envoi..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
