// app/api/reservations/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { PRICE_PER_TIPI_TOTAL, STAY_LABEL } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📩 Requête reçue:", body);

    const { lodgingId, quantity, name, email } = body;

    // 1) Validations
    if (!lodgingId || !quantity || !name || !email) {
      console.error("❌ Champs manquants:", { lodgingId, quantity, name, email });
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("❌ Email invalide:", email);
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      console.error("❌ Quantité invalide:", quantity);
      return NextResponse.json({ error: "Quantité invalide." }, { status: 400 });
    }

    // 2) Firestore
    const db = getAdminDb();
    const lodgingRef = db.collection("lodgings").doc(lodgingId);

    let afterReserved = 0;
    let lodgingData: any = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lodgingRef);
      if (!snap.exists) throw new Error("Hébergement introuvable.");
      const data = snap.data() as any;
      lodgingData = data;

      const totalUnits: number = data.totalUnits ?? 0;
      const reservedUnits: number = data.reservedUnits ?? 0;
      const remaining = totalUnits - reservedUnits;
      if (qty > remaining) throw new Error(`Plus que ${remaining} disponibilité(s).`);

      afterReserved = reservedUnits + qty;
      tx.update(lodgingRef, { reservedUnits: afterReserved });
    });

    // 3) Prix / total
    const unitPriceCHF = PRICE_PER_TIPI_TOTAL;
    const totalCHF = unitPriceCHF * qty;

    // 4) Sauvegarder réservation
    const reservationRef = await db.collection("reservations").add({
      lodgingId,
      lodgingName: lodgingData?.title ?? lodgingId,
      qty,
      name,
      email,
      unitPriceCHF,
      totalCHF,
      stayLabel: STAY_LABEL,
      status: "confirmed",
      paymentStatus: "pending",
      createdAt: new Date(),
    });
    const reservationId = reservationRef.id;

    // 5) EmailJS
    const endpoint = "https://api.emailjs.com/api/v1.0/email/send";
    const headers = { "Content-Type": "application/json" };

    const service_id = process.env.EMAILJS_SERVICE_ID;
    const user_id = process.env.EMAILJS_PUBLIC_KEY;
    const template_id_client = process.env.EMAILJS_TEMPLATE_ID;
    const template_id_admin = process.env.EMAILJS_TEMPLATE_ID_ADMIN || template_id_client;
    const admin_email = process.env.RESERVATION_ADMIN_EMAIL || "";

    // Log de présence des env (sans afficher leurs valeurs)
    console.log("🔧 ENV presence:", {
      SERVICE_ID: !!service_id,
      TEMPLATE_ID_CLIENT: !!template_id_client,
      TEMPLATE_ID_ADMIN: !!template_id_admin,
      PUBLIC_KEY: !!user_id,
      ADMIN_EMAIL: !!admin_email,
    });

    const formatCHF = (n: number) =>
      new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF" }).format(n);

    const total_chf = String(totalCHF); // on laisse le "CHF" au template
    const lodging_name = lodgingData?.title ?? lodgingId;
    const lodging_id = lodgingId;
    const quantity_str = String(qty);
    const customer_name = name;
    const customer_email = email;
    const reservation_id = reservationId;
    const summary_line = `${qty} ${qty > 1 ? "tipis" : "tipi"} — ${lodging_name}`;
    const cancel_url = ""; // pas encore

    const baseParams = {
      customer_name,
      customer_email,
      lodging_id,
      lodging_name,
      quantity: quantity_str,
      total_chf,
      reservation_id,
      summary_line,
      cancel_url,
    };

    const payload_admin = {
      service_id,
      template_id: template_id_admin,
      user_id,
      template_params: { ...baseParams, to_email: admin_email },
    };

    const payload_client = {
      service_id,
      template_id: template_id_client,
      user_id,
      template_params: { ...baseParams, to_email: customer_email },
    };

    const [r1, r2] = await Promise.all([
      fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload_admin) }),
      fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload_client) }),
    ]);

    // 🔍 Logs détaillés EmailJS
    if (!r1.ok) console.error("EmailJS admin error:", r1.status, await r1.text());
    if (!r2.ok) console.error("EmailJS client error:", r2.status, await r2.text());

    return NextResponse.json({
      ok: true,
      reservationId,
      totalChf: totalCHF,
      reservedUnits: afterReserved,
    });
  } catch (e: any) {
    console.error("🔥 Erreur /api/reservations:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
