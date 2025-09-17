export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL } from "@/lib/constants";

function absUrl(path: string) {
  const base = process.env.SITE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
  return base ? `${base}${path}` : path;
}

function cryptoRandom(len = 24) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[(Math.random() * alphabet.length) | 0];
  return out;
}

// Génère le code humain JJMMAA-## avec compteur global 01..40 (cycle)
async function generateHumanCode(db: FirebaseFirestore.Firestore) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const dayPart = `${dd}${mm}${yy}`;

  const counterRef = db.collection("counters").doc("global");
  let counterVal = 0;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = Number(snap.exists ? (snap.data() as any)?.value ?? 0 : 0);
    // fait avancer le compteur, boucle après 40 → 01
    const next = ((current % 40) + 1);
    tx.set(counterRef, { value: next, updatedAt: new Date() }, { merge: true });
    counterVal = next;
  });

  const twoDigits = String(counterVal).padStart(2, "0");
  return `${dayPart}-${twoDigits}`;
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

    // Transaction stock
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

    // Génération de la référence lisible
    const humanCode = await generateHumanCode(db);

    // Création réservation
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
      status: "confirmed",
      paymentStatus: "pending",
      humanCode,           // ← NEW
      cancelToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const reservationDoc = await db.collection("reservations").add(resDoc);
    const reservationId = reservationDoc.id;

    console.log("[reservations] created:", { reservationId, humanCode, lodgingId, qty, email });

    const cancelUrl = absUrl(`/api/reservations/cancel?token=${encodeURIComponent(cancelToken)}`);

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
      reservation_code: humanCode,     // ← NEW : pour tes templates
      // on n’envoie plus reservation_id dans l’objet, mais on peut le garder dans les params si tu veux
      reservation_id: reservationId,
      cancel_url: cancelUrl,
    };

    // Client
    const payloadClient = {
      service_id,
      template_id: template_id_client,
      user_id,
      template_params: {
        ...baseParams,
        to_email: email,
        // Sujet / ligne de résumé avec le code lisible
        summary_line: `Votre réservation — Réf ${humanCode}`,
      },
    };

    // Admin
    const payloadAdmin = admin_email
      ? {
          service_id,
          template_id: template_id_admin,
          user_id,
          template_params: {
            ...baseParams,
            to_email: admin_email,
            summary_line: `Nouvelle réservation ${humanCode} — ${lodgingData?.title ?? lodgingId} — ${qty} ${(qty > 1) ? "tipis" : "tipi"} — ${totalCHF} CHF`,
          },
        }
      : null;

    const promises: Promise<Response>[] = [
      fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payloadClient) }),
    ];
    if (payloadAdmin) {
      promises.push(fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payloadAdmin) }));
    }

    const results = await Promise.all(promises);
    results.forEach(async (r, i) => {
      if (!r.ok) {
        console.error(`EmailJS ${i === 0 ? "client" : "admin"} error:`, r.status, await r.text());
      }
    });

    console.log("[reservations] done in", Date.now() - t0, "ms");

    return NextResponse.json({
      ok: true,
      // on renvoie aussi le code lisible
      reservationCode: humanCode,
      reservationId, // (interne, peut servir à debugger)
      totalChf: totalCHF,
      reservedUnits: afterReserved,
      cancelUrl,
    });
  } catch (e: any) {
    console.error("🔥 Erreur /api/reservations:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
