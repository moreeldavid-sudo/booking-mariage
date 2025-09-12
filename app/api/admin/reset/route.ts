// app/api/admin/reset/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const EXPECTED_TOKEN =
  process.env.ADMIN_RESET_TOKEN || process.env.ADMIN_SECRET_TOKEN;

async function deleteCollection(
  db: FirebaseFirestore.Firestore,
  colPath: string,
  batchSize = 500
) {
  const colRef = db.collection(colPath).orderBy("__name__").limit(batchSize);
  // Supprime en lots jusqu'à ce que la collection soit vide
  // (utile si tu as fait beaucoup de tests)
  // NB: Firestore impose une suppression batchée côté admin.
  // On boucle tant qu'il reste des docs.
  // Si tu as énormément de docs, augmente batchSize.
  while (true) {
    const snap = await colRef.get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    if (snap.size < batchSize) break;
  }
}

async function resetLodgings(db: FirebaseFirestore.Firestore) {
  // Remet juste les compteurs à 20/0 (n'écrase pas les autres champs)
  const updates: Record<string, { totalUnits: number; reservedUnits: number }> =
    {
      "tipis-lit140": { totalUnits: 20, reservedUnits: 0 },
      "tipis-lits90": { totalUnits: 20, reservedUnits: 0 },
    };

  const batch = db.batch();
  Object.entries(updates).forEach(([id, data]) => {
    batch.set(db.collection("lodgings").doc(id), data, { merge: true });
  });
  await batch.commit();
}

async function handleReset() {
  const db = getAdminDb();

  // 1) Vider toutes les réservations (tests)
  await deleteCollection(db, "reservations");

  // 2) Remettre les deux tentes à 20 dispo, reservedUnits = 0
  await resetLodgings(db);

  return {
    ok: true,
    message:
      "Réinitialisation OK (réservations supprimées, compteurs remis à 20/0).",
  };
}

// On accepte GET pour un appel simple via URL
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!EXPECTED_TOKEN || token !== EXPECTED_TOKEN) {
    return NextResponse.json({ error: "Token invalide." }, { status: 401 });
  }
  try {
    const res = await handleReset();
    return NextResponse.json(res);
  } catch (e: any) {
    console.error("RESET ERROR (GET):", e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}

// Et POST si tu veux l’appeler via fetch/outil externe
export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const token = body?.token || "";

  if (!EXPECTED_TOKEN || token !== EXPECTED_TOKEN) {
    return NextResponse.json({ error: "Token invalide." }, { status: 401 });
  }

  try {
    const res = await handleReset();
    return NextResponse.json(res);
  } catch (e: any) {
    console.error("RESET ERROR (POST):", e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
