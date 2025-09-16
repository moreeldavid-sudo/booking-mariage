export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();

    // Récupère TOUTES les réservations, triées par date desc
    const snap = await db
      .collection("reservations")
      .orderBy("createdAt", "desc")
      .get();

    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      // Normaliser createdAt (Firestore Timestamp -> number ms)
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
        qty: data.qty ?? 0,
        name: data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
        email: data.email ?? "",
        totalCHF: data.totalCHF ?? 0,
        paymentStatus: data.paymentStatus ?? "pending",
        status: data.status ?? "confirmed",
        createdAt: createdAtMs,
      };
    });

    // Masquer les annulées dans l’admin (on garde l’historique en base)
    const filtered = items.filter((r) => r.status !== "cancelled");

    return NextResponse.json({ items: filtered });
  } catch (e: any) {
    console.error("GET /api/admin/reservations error:", e);
    return NextResponse.json({ items: [], error: e?.message ?? "Erreur" }, { status: 500 });
  }
}
