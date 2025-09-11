// app/api/admin/recount/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Sécurité : token admin
  if (token !== process.env.ADMIN_RESET_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    // 1) Récupérer toutes les réservations confirmées
    const reservationsSnap = await db
      .collection("reservations")
      .where("status", "==", "confirmed")
      .get();

    // 2) Additionner par lodgingId (en lisant bien "qty")
    const counts: Record<string, number> = {};
    reservationsSnap.forEach((doc) => {
      const data = doc.data() as any;
      const lodgingId = String(data.lodgingId || "");
      const qty = Number(data.qty ?? data.quantity ?? 0); // ← CORRECTION ICI

      if (!lodgingId) return;
      if (!Number.isFinite(qty)) return;

      counts[lodgingId] = (counts[lodgingId] || 0) + qty;
    });

    // 3) Mettre à jour chaque lodging.reservedUnits
    const lodgingsSnap = await db.collection("lodgings").get();
    const batch = db.batch();

    lodgingsSnap.forEach((doc) => {
      const id = doc.id;
      const reservedUnits = counts[id] || 0; // ceux non présents repassent à 0
      batch.update(doc.ref, { reservedUnits });
    });

    await batch.commit();

    return NextResponse.json({
      ok: true,
      computed: counts,
      confirmedCount: reservationsSnap.size,
    });
  } catch (err) {
    console.error("Erreur recount:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
