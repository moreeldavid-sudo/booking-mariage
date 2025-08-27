'use client';
import { useState } from 'react';

export default function ReservationModal({
  lodgingId,
  onClose,
  onSuccess,
}: {
  lodgingId: string;
  onClose: () => void;
  onSuccess: (newReservedUnits: number, qty: number) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Vérif simple côté client
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Merci d’indiquer un email valide.');
      }
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lodgingId, quantity, name, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      onSuccess(json.reservedUnits, quantity);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Réserver — {lodgingId}</h2>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nom & prénom</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="ex. jeanne@exemple.com"
              className="mt-1 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Quantité</label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-gray-600 hover:bg-gray-100"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Envoi…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
