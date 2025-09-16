export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const d140 = await db.collection("lodgings").doc("tipis-lit140").get();
    const d90  = await db.collection("lodgings").doc("tipis-lits90").get();

    const a140 = d140.exists ? (d140.data() as any) : {};
    const a90  = d90.exists  ? (d90.data() as any)  : {};

    const remaining140 =
      Number(a140.totalUnits ?? 0) - Number(a140.reservedUnits ?? 0);
    const remaining90 =
      Number(a90.totalUnits ?? 0) - Number(a90.reservedUnits ?? 0);

    return NextResponse.json({
      tipi140: { remaining: Math.max(0, remaining140) },
      tipi90:  { remaining: Math.max(0, remaining90)  },
    });
  } catch (e: any) {
    console.error("GET /api/stock error:", e);
    return NextResponse.json({ tipi140: { remaining: 0 }, tipi90: { remaining: 0 } }, { status: 500 });
  }
}
