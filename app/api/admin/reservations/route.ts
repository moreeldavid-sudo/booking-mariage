export const runtime = "nodejs";
// Empêche tout cache côté Next/Vercel pour cette route
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();

    // Log côté serveur pour vérifier qu’on passe bien ici
    console.log("[admin-reservations] GET called at", new Date().toISOString());

    // Récupère TOUTES les réservations, triées par date desc
    const snap = await db
      .collection("reservations")
      .orderBy("createdAt", "desc")
      .get();

    const items = snap.docs.map((d) => {
      const data = d.data() as any;

      // Normaliser createdAt (Timestamp Firestore -> number ms)
      let createdAtMs = Date.now();
      const ca = data.createdAt;
      if (ca && typeof ca.toDate === "function") {
        createdAtMs = ca.toDate().getTime();
      } else if (typeof ca === "number") {
        createdAtMs = ca;
      }

      return {
        id: d.id,
        lodgingId: data.lodgingId ?? null,
        lodgingName: data.lodgingName ?? null,
        qty: Number(data.qty ?? 0),
        name: data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
        email: data.email ?? "",
        totalCHF: Number(data.totalCHF ?? 0),
        paymentStatus: data.paymentStatus ?? "pending",
        status: data.status ?? "confirmed",
        createdAt: createdAtMs,
      };
    });

    // Masquer les annulées (on garde l’historique en base)
    const filtered = items.filter((r) => r.status !== "cancelled");

    // Désactiver le cache HTTP côté CDN/navigateur
    const res = NextResponse.json({ items: filtered });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (e: any) {
    console.error("GET /api/admin/reservations error:", e);
    const res = NextResponse.json(
      { items: [], error: e?.message ?? "Erreur" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  }
}
