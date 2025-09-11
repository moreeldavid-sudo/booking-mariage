import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import nodemailer from "nodemailer";

// Prix fixe
const PRICE_PER_TIPI = 200;

export async function POST(req: Request) {
  try {
    const { lodgingId, quantity, customer_name, customer_email } = await req.json();

    if (!lodgingId || !quantity || !customer_name || !customer_email) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const db = getAdminDb();
    const lodgingRef = db.collection("lodgings").doc(lodgingId);

    // Transaction Firestore pour décrémenter les dispos
    const result = await db.runTransaction(async (tx) => {
      const lodgingDoc = await tx.get(lodgingRef);
      if (!lodgingDoc.exists) throw new Error("Hébergement introuvable");

      const lodging = lodgingDoc.data()!;
      const reserved = lodging.reserved || 0;
      const total = lodging.total || 0;

      if (reserved + quantity > total) {
        throw new Error("Plus assez de tipis disponibles");
      }

      // Update reserved
      tx.update(lodgingRef, { reserved: reserved + quantity });

      // Calcul du prix
      const totalPrice = quantity * PRICE_PER_TIPI;

      // Sauvegarde réservation
      const reservationRef = db.collection("reservations").doc();
      const reservationData = {
        id: reservationRef.id,
        lodgingId,
        lodgingName: lodging.name,
        quantity,
        customer_name,
        customer_email,
        totalPrice,
        status: "pending",
        createdAt: new Date(),
      };
      tx.set(reservationRef, reservationData);

      return { reservationId: reservationRef.id, totalPrice, lodgingName: lodging.name };
    });

    // 👉 Envoi email confirmation via EmailJS (ou nodemailer si SMTP)
    // Pour l’instant, on se contente d’un console.log
    console.log("Email de confirmation à envoyer :", {
      to: customer_email,
      name: customer_name,
      ref: result.reservationId,
      lodging: result.lodgingName,
      total: result.totalPrice,
    });

    return NextResponse.json({
      success: true,
      reservationId: result.reservationId,
      totalPrice: result.totalPrice,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
