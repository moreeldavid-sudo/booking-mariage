export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/admin/reservations/purge-cancelled
 *
 * Body JSON (facultatif) :
 * {
 *   "dryRun": true,            // si true, ne supprime rien, renvoie juste le comptage (défaut: false)
 *   "olderThanDays": 0,        // ne garder que les annulées plus vieilles que X jours (0 = toutes)
 *   "limit": 0                 // limite max de suppressions (0 = illimité)
 * }
 *
 * Réponses :
 * 200 { ok: true, dryRun, olderThanDays, totalMatched, totalDeleted, sampleIds: [...] }
 * 500 { error: "..." }
 *
 * Notes :
 * - Ne touche PAS aux stocks (ils sont ajustés lors de l’annulation).
 * - Protégé par ton middleware /api/admin → nécessite d’être connecté en admin.
 */
export async function POST(req: NextRequest) {
  try {
    const params = await req.json().catch(() => ({})) as {
      dryRun?: boolean;
      olderThanDays?: number;
      limit?: number;
    };

    const dryRun = !!params?.dryRun;
    const olderThanDays = Number.isFinite(params?.olderThanDays) ? Number(params!.olderThanDays) : 0;
    const limitInput = Number.isFinite(params?.limit) ? Number(params!.limit) : 0;

    const db = getAdminDb();
    let q: FirebaseFirestore.Query = db.collection("reservations").where("status", "==", "cancelled");

    // Filtre d'ancienneté (sur updatedAt si dispo, sinon createdAt)
    let cutoffDate: Date | null = null;
    if (olderThanDays > 0) {
      cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      // On essaie d'utiliser updatedAt si présent, sinon createdAt
      // Comme Firestore ne permet pas "OR", on fait en 2 passes plus bas si besoin.
      // Ici, on met un premier filtre sur createdAt pour limiter la charge.
      q = q.where("createdAt", "<", cutoffDate);
    }

    // On récupère en lots pour éviter les réponses trop lourdes
    const pageSize = 500;
    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    let matchedIds: string[] = [];

    while (true) {
      let query = q.orderBy("createdAt", "asc").limit(pageSize);
      if (lastDoc) query = query.startAfter(lastDoc);

      const snap = await query.get();
      if (snap.empty) break;

      for (const d of snap.docs) {
        // Double check si updatedAt existe et olderThanDays > 0
        if (cutoffDate) {
          const data = d.data() as any;
          const updatedAt = data?.updatedAt?.toDate ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : null);
          const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : null);
          const pivot = updatedAt || createdAt;
          if (!pivot || pivot >= cutoffDate) continue; // trop récent, on saute
        }
        matchedIds.push(d.id);
      }

      lastDoc = snap.docs[snap.docs.length - 1];

      if (limitInput > 0 && matchedIds.length >= limitInput) {
        matchedIds = matchedIds.slice(0, limitInput);
        break;
      }
    }

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        olderThanDays,
        totalMatched: matchedIds.length,
        totalDeleted: 0,
        sampleIds: matchedIds.slice(0, 20), // aperçu
      });
    }

    // Suppression en batch (par lots de 400 pour marge)
    let deleted = 0;
    for (let i = 0; i < matchedIds.length; i += 400) {
      const slice = matchedIds.slice(i, i + 400);
      const batch = db.batch();
      slice.forEach((id) => batch.delete(db.collection("reservations").doc(id)));
      await batch.commit();
      deleted += slice.length;
    }

    return NextResponse.json({
      ok: true,
      dryRun: false,
      olderThanDays,
      totalMatched: matchedIds.length,
      totalDeleted: deleted,
      sampleIds: matchedIds.slice(0, 20),
    });
  } catch (e: any) {
    console.error("purge-cancelled error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}
