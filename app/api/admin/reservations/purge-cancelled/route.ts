export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * GET  /api/admin/reservations/purge-cancelled?olderThanDays=7&limit=0
 *   → DRY-RUN : ne supprime rien, renvoie comptage + échantillon
 *
 * POST /api/admin/reservations/purge-cancelled
 *   Body JSON (facultatif): { "olderThanDays": 0, "limit": 0 }
 *   → PURGE réelle
 *
 * NB : aucune combinaison where+orderBy → pas d’index composite requis.
 */

type QueryOpts = { olderThanDays?: number; limit?: number };

function toDateMaybe(v: any): Date | null {
  try {
    if (!v) return null;
    if (typeof v?.toDate === "function") return v.toDate();
    if (v instanceof Date) return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

async function collectCancelledIds(opts: QueryOpts = {}): Promise<string[]> {
  const { olderThanDays = 0, limit = 0 } = opts;
  const db = getAdminDb();

  // 1) Récupère TOUTES les réservations annulées (sans orderBy ni second where)
  const snap = await db.collection("reservations").where("status", "==", "cancelled").get();

  // 2) Filtre en mémoire (pas d’index requis)
  let ids = snap.docs.map((d) => d.id);

  if (olderThanDays > 0) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    ids = snap.docs
      .filter((d) => {
        const data = d.data() as any;
        const updatedAt = toDateMaybe(data?.updatedAt);
        const createdAt = toDateMaybe(data?.createdAt);
        const pivot = updatedAt || createdAt; // on prend updatedAt si dispo, sinon createdAt
        return pivot ? pivot < cutoff : false;
      })
      .map((d) => d.id);
  }

  if (limit > 0) ids = ids.slice(0, limit);
  return ids;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const olderThanDays = Number(url.searchParams.get("olderThanDays") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "0");

    const ids = await collectCancelledIds({ olderThanDays, limit });

    const res = NextResponse.json({
      ok: true,
      dryRun: true,
      olderThanDays,
      limit,
      totalMatched: ids.length,
      sampleIds: ids.slice(0, 20),
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (e: any) {
    console.error("purge-cancelled GET error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as QueryOpts;
    const olderThanDays = Number(body?.olderThanDays ?? 0);
    const limit = Number(body?.limit ?? 0);

    const db = getAdminDb();
    const ids = await collectCancelledIds({ olderThanDays, limit });

    // Suppression par lots (jusqu’à 400 par batch)
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 400) {
      const slice = ids.slice(i, i + 400);
      const batch = db.batch();
      slice.forEach((id) => batch.delete(db.collection("reservations").doc(id)));
      await batch.commit();
      deleted += slice.length;
    }

    const res = NextResponse.json({
      ok: true,
      dryRun: false,
      olderThanDays,
      limit,
      totalMatched: ids.length,
      totalDeleted: deleted,
      sampleIds: ids.slice(0, 20),
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (e: any) {
    console.error("purge-cancelled POST error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}
