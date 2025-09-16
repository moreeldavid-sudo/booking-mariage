export const runtime = "nodejs";
// force la route à être dynamique (pas de cache Vercel/Next)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();

    // On lit les 2 documents Firestore
    const [d140, d90] = await Promise.all([
      db.collection("lodgings").doc("tipis-lit140").get(),
      db.collection("lodgings").doc("tipis-lits90").get(),
    ]);

    const toCount = (snap: FirebaseFirestore.DocumentSnapshot) => {
      const data = (snap.exists ? (snap.data() as any) : {}) || {};
      const total = Number(data.totalUnits ?? 0);
      const reserved = Number(data.reservedUnits ?? 0);
      const remaining = Math.max(0, total - reserved);
      return { total, reserved, remaining };
    };

    const out = {
      // clés attendues par l’admin: "tipi140" et "tipi90"
      tipi140: toCount(d140),
      tipi90: toCount(d90),
    };

    const res = NextResponse.json(out);
    // no-store pour éviter le cache navigateur/CDN
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (e: any) {
    console.error("/api/stock error:", e);
    const res = NextResponse.json(
      { error: e?.message ?? "Erreur" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  }
}
