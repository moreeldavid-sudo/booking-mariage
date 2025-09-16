export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

function toMs(createdAt: any): number {
  try {
    if (!createdAt) return Date.now();
    if (typeof createdAt?.toDate === "function") return createdAt.toDate().getTime();
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

    // On évite orderBy côté Firestore (pas d’index requis), on trie après
    const snap = await db.collection("reservations").get();

    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        lodgingId: data.lodgingId ?? null,
        lodgingName: data.lodgingName ?? null,
        qty: Number(data.qty ?? 0),
        name: data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
        email: data.email ?? "",
        totalCHF: Number(data.totalCHF ?? 0),
        paymentStatus: data.paymentStatus ?? "pending",
        status: data.status ?? "confirmed",
        createdAt: toMs(data.createdAt),
      };
    });

    // Tri desc par date
    items.sort((a, b) => b.createdAt - a.createdAt);

    // (Option) On masque les annulées ici si tu veux les cacher en admin :
    const filtered = items.filter((r) => r.status !== "cancelled");

    // Réponse no-store/no-cache
    const res = NextResponse.json({ items: filtered });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch (e: any) {
    console.error("GET /api/admin/reservations error:", e);
    const res = NextResponse.json({ items: [], error: e?.message ?? "Erreur" }, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
