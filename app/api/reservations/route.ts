export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL } from "@/lib/constants";

function absUrl(path: string) {
  const base =
    process.env.SITE_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";
  return base ? `${base}${path}` : path;
}

function cryptoRandom(len = 24) {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += alphabet[(Math.random() * alphabet.length) | 0];
  return out;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = await req.json();
    const { lodgingId, quantity, firstName, lastName, email } = body || {};

    // Validations
    if (!lodgingId || !quantity || !firstName || !lastName || !email) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: "Quantité invalide." }, { status: 400 });
    }

    const name = `${firstName} ${lastName}`.trim();
    const db = getAdminDb();
    const lodgingRef = db.collection("lodgings").doc(lodgingId);

    let afterReserved = 0;
    let lodgingData: any = null;

    // --- Transaction stock ---
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lodgingRef);
      if (!snap.exists) throw new Error("Hébergement introuvable.");
      const data = snap.data() as any;
      lodgingData = data;

      const totalUnits: number = Number(data.totalUnits ?? 0);
      const reservedUnits: number = Number(data.reservedUnits ?? 0);
      const remaining = totalUnits - reservedUnits;
      if (qty > remaining) throw new Error(`Plus que ${remaining} dispo.`);

      afterReserved = reservedUnits + qty;
      tx.update(lodgingRef, { reservedUnits: afterReserved });
    });

    // --- Création réservation ---
    const unitPriceCHF = PRICE_PER_TIPI_TOTAL;
    const totalCHF = unitPriceCHF * qty;
    const cancelToken = cryptoRandom();

    const resDoc = {
      lodgingId,
      lodgingName: lodgingData?.title ?? lodgingId,
      qty,
      firstName,
      lastName,
      name,
      email,
      unitPriceCHF,
      totalCHF,
      stayLabel: STAY_LABEL,
      status: "confirmed",          // ← important pour l’admin
      paymentStatus: "pending",
      cancelToken,
      createdAt: new Date(),         // Timestamp Firestore
      updatedAt: new Date(),
    };

    const reservationDoc = await db.collection("reservations").add(resDoc);
    const reservationId = reservationDoc.id;

    console.log("[reservations] created:", {
      reservationId,
      lodgingId,
      qty,
      email,
    });

    const cancelUrl = absUrl(
      `/api/reservations/cancel?token=${encodeURIComponent(cancelToken)}`
    );

    // ---- EmailJS ----
    const endpoint = "https://api.emailjs.com/api/v1.0/email/send";
    const headers = { "Content-Type": "application/json" };

    const service_id = process.env.EMAILJS_SERVICE_ID!;
    const user_id = process.env.EMAILJS_PUBLIC_KEY!;
    const template_id_client = process.env.EMAILJS_TEMPLATE_ID!;
    const template_id_admin = process.env.EMAILJS_TEMPLATE_ID_ADMIN!;
    const admin_email = process.env.RESERVATION_ADMIN_EMAIL || "";

    const baseParams = {
      customer_name: name,
      customer_email: email,
      lodging_id: lodgingId,
      lodging_name: lodgingData?.title ?? lodgingId,
      quantity: String(qty),
      total_chf: String(totalCHF),
      reservation_id: reservationId,
      cancel_url: cancelUrl,
    };

    const payloadClient = {
      service_id,
      template_id: template_id_client,
      user_id,
      template_params: {
        ...baseParams,
        to_email: email,
        summary_line: `Réservation confirmée : ${qty} ${
          qty > 1 ? "tipis" : "tipi"
        } — Total ${totalCHF} CHF`,
      },
    };

    const payloadAdmin = admin_email
      ? {
          service_id,
          template_id: template_id_admin,
          user_id,
          template_params: {
            ...baseParams,
            to_email: admin_email,
            summary_line: `Nouvelle réservation : ${qty} ${
              qty > 1 ? "tipis" : "tipi"
            } — ${lodgingData?.title ?? lodgingId} — Total ${totalCHF} CHF`,
          },
        }
      : null;

    const promises: Promise<Response>[] = [
      fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadClient),
      }),
    ];
    if (payloadAdmin) {
      promises.push(
        fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payloadAdmin),
        })
      );
    }

    const results = await Promise.all(promises);
    results.forEach(async (r, i) => {
      if (!r.ok) {
        console.error(
          `EmailJS ${i === 0 ? "client" : "admin"} error:`,
          r.status,
          await r.text()
        );
      }
    });

    console.log("[reservations] done in", Date.now() - t0, "ms");

    return NextResponse.json({
      ok: true,
      reservationId,
      totalChf: totalCHF,
      reservedUnits: afterReserved,
      cancelUrl,
    });
  } catch (e: any) {
    console.error("🔥 Erreur /api/reservations:", e);
    return NextResponse.json(
      { error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
