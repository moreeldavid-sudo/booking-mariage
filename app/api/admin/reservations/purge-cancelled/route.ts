export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * GET  /api/admin/reservations/purge-cancelled?olderThanDays=7
 *  -> DRY-RUN : ne supprime rien, renvoie juste le nombre et un échantillon d’IDs
 *
 * POST /api/admin/reservations/purge-cancelled
 *  Body JSON (facultatif):
 *    { "olderThanDays": 0, "limit": 0 }
 *  -> PURGE réelle : supprime les réservations annulées (status=="cancelled")
 *
 * NB: On ne touche PAS aux stocks (ils sont déjà ajustés à l’annulation).
 */

type QueryOpts = {
  olderThanDays?: number;
  limit?: number;
};

async function collectCancelledIds(
  opts: QueryOpts = {}
): Promise<string[]> {
  const { olderThanDays = 0, limit = 0 } = opts;
  const db = getAdminDb();

  let q: FirebaseFirestore.Query = db
    .collection("reservations")
    .where("status", "==", "cancelled");

  let cutoffDate: Date | null = null;
  if (olderThanDays > 0) {
    cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    // Firestore n’a pas d’OR : on filtre sur createdAt côté query, et on raffine côté code.
    q = q.where("createdAt", "<", cutoffDate);
  }

  const pageSize = 500;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  const found: string[] = [];

  while (true) {
    let query = q.orderBy("createdAt", "asc").limit(pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snap = await query.get();
    if (snap.empty) break;

    for (const d of snap.docs) {
      if (cutoffDate) {
        const data = d.data() as any;
        const updatedAt =
          data?.updatedAt?.toDate?.() ??
          (data?.updatedAt instanceof Date ? data.updatedAt : null);
        const createdAt =
          data?.createdAt?.toDate?.() ??
          (data?.createdAt instanceof Date ? data.createdAt : null);
        const pivot = updatedAt || createdAt;
        if (!pivot || pivot >= cutoffDate) continue;
      }
      found.push(d.id);
      if (limit > 0 && found.length >= limit) return found;
    }

    lastDoc = snap.docs[snap.docs.length - 1];
  }

  return found;
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

    // Suppression par lots (400)
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
