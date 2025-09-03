// app/api/debug/env/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      FB_PROJECT_ID: process.env.FB_PROJECT_ID ? "present" : "MISSING",
      FB_CLIENT_EMAIL: process.env.FB_CLIENT_EMAIL ? "present" : "MISSING",
      FB_PRIVATE_KEY: process.env.FB_PRIVATE_KEY ? "present" : "MISSING",
      SITE_BASE_URL: process.env.SITE_BASE_URL ? "present" : "MISSING",
    },
  });
}
