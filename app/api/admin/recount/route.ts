import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  // Vérif du token admin
  if (token !== process.env.ADMIN_RESET_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    // Récupérer toutes les réservations confirmées
    const reservationsSnap = await db
      .collection("reservations")
      .where("status", "==", "confirmed")
      .get();

    // Calcul des quantités réservées par logement
    const counts: Record<string, number> = {};
    reservationsSnap.forEach((doc) => {
      const data = doc.data();
      const lodgingId = data.lodgingId as string;
      const qty = data.quantity as number;
      counts[lodgingId] = (counts[lodgingId] || 0) + qty;
    });

    // Mettre à jour chaque logement avec le bon reservedUnits
    const lodgingsSnap = await db.collection("lodgings").get();
    const batch = db.batch();

    lodgingsSnap.forEach((doc) => {
      const data = doc.data();
      const lodgingId = doc.id;
      const reservedUnits = counts[lodgingId] || 0;

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
