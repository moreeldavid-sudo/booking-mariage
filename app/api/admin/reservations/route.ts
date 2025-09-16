export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

function toMs(createdAt: any): number {
  // Accepte Timestamp Firestore, Date, number, string
  try {
    if (!createdAt) return Date.now();
    if (typeof createdAt?.toDate === "function") {
      return createdAt.toDate().getTime();
    }
    if (createdAt instanceof Date) return createdAt.getTime();
    if (typeof createdAt === "number") return createdAt;
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.getTime();
  } catch {}
  return Date.now();
}

export async function GET() {
  try {
    const db = getAdminDb();

    // ⚠️ on évite orderBy pour lever tout risque d’index/field manquant
    const snap = await db.collection("reservations").get();

    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        lodgingId: data.lodgingId ?? null,
        lodgingName: data.lodgingName ?? null,
        qty: Number(data.qty ?? 0),
        name:
          data.name ??
          `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
        email: data.email ?? "",
        totalCHF: Number(data.totalCHF ?? 0),
        paymentStatus: data.paymentStatus ?? "pending",
        status: data.status ?? "confirmed",
        createdAt: toMs(data.createdAt),
      };
    });

    // On trie côté serveur (desc)
    items.sort((a, b) => b.createdAt - a.createdAt);

    // On masque les annulées dans l’UI
    const filtered = items.filter((r) => r.status !== "cancelled");

    return NextResponse.json({ items: filtered });
  } catch (e: any) {
    console.error("GET /api/admin/reservations error:", e);
    return NextResponse.json(
      { items: [], error: e?.message ?? "Erreur" },
      { status: 500 }
    );
  }
}
