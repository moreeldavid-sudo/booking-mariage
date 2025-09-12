'use client';
import { useState } from 'react';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const next = new URLSearchParams(window.location.search).get('next') || '/admin';
      window.location.href = next;
    } else {
      const j = await res.json();
      setErr(j.error || 'Erreur de connexion');
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="font-serif text-3xl mb-4">Connexion admin</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input
          className="border rounded p-2"
          placeholder="PIN admin"
          value={pin}
          onChange={e => setPin(e.target.value)}
        />
        <button className="rounded-2xl bg-black text-white px-4 py-2">Se connecter</button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </main>
  );
}
