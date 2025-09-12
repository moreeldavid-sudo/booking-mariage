import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

const MAP: Record<"tipi140"|"tipi90", string> = {
  tipi140: "tipis-lit140",
  tipi90:  "tipis-lits90",
};

export async function GET() {
  try {
    const db = getAdminDb();
    const [d140, d90] = await Promise.all([
      db.collection("lodgings").doc(MAP.tipi140).get(),
      db.collection("lodgings").doc(MAP.tipi90).get(),
    ]);

    const a140 = d140.data() || {};
    const a90  = d90.data()  || {};

    const remaining140 = Math.max(0, (a140.totalUnits ?? 0) - (a140.reservedUnits ?? 0));
    const remaining90  = Math.max(0, (a90.totalUnits  ?? 0) - (a90.reservedUnits  ?? 0));

    return NextResponse.json({
      tipi140: { remaining: remaining140 },
      tipi90:  { remaining: remaining90  },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erreur" }, { status: 500 });
  }
}
