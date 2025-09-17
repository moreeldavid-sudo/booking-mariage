export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    console.log("[admin-reservations] GET at", new Date().toISOString());
    const snap = await db.collection("reservations").orderBy("createdAt", "desc").get();

    const items = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id, // interne
        humanCode: data.humanCode ?? null, // ← NEW
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

    // on masque les annulées dans l’admin
    const filtered = items.filter((r) => r.status !== "cancelled");

    const res = NextResponse.json({ items: filtered });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (e: any) {
    console.error("GET /api/admin/reservations error:", e);
    const res = NextResponse.json({ items: [], error: e?.message ?? "Erreur" }, { status: 500 });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  }
}
