// app/api/debug/env/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const body = {
    ok: true,
    env: {
      FB_PROJECT_ID: process.env.FB_PROJECT_ID ? "OK" : "MISSING",
      FB_CLIENT_EMAIL: process.env.FB_CLIENT_EMAIL ? "OK" : "MISSING",
      FB_PRIVATE_KEY: process.env.FB_PRIVATE_KEY ? "OK" : "MISSING",
      SITE_BASE_URL: process.env.SITE_BASE_URL ? "OK" : "MISSING",
    },
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
