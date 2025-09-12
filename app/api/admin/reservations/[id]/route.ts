import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { decrementReserved } from "@/lib/db";

// Mettre à jour statut de paiement
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = getAdminDb();
  const { id } = params;

  const { paymentStatus } = await req.json();

  if (!paymentStatus) {
    return NextResponse.json({ error: "paymentStatus manquant" }, { status: 400 });
  }

  await db.collection("reservations").doc(id).update({ paymentStatus });

  return NextResponse.json({ success: true });
}

// Supprimer une réservation (et restituer le stock)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const db = getAdminDb();
  const { id } = params;

  const snap = await db.collection("reservations").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }
  const resData = snap.data() as any;

  // Restituer le stock
  await decrementReserved(resData.lodgingId, resData.qty);

  // Supprimer la réservation
  await db.collection("reservations").doc(id).delete();

  return NextResponse.json({ success: true });
}
