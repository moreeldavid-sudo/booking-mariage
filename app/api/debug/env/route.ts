import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      env: {
        FB_PROJECT_ID: process.env.FB_PROJECT_ID ? "OK" : "MISSING",
        FB_CLIENT_EMAIL: process.env.FB_CLIENT_EMAIL ? "OK" : "MISSING",
        FB_PRIVATE_KEY: process.env.FB_PRIVATE_KEY ? "OK" : "MISSING",
        SITE_BASE_URL: process.env.SITE_BASE_URL ? "OK" : "MISSING",
        EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY ? "OK" : "MISSING",
        EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID ? "OK" : "MISSING",
        EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID ? "OK" : "MISSING",
        EMAILJS_PRIVATE_KEY: process.env.EMAILJS_PRIVATE_KEY ? "OK" : "MISSING",
        RESERVATION_ADMIN_EMAIL: process.env.RESERVATION_ADMIN_EMAIL ? "OK" : "MISSING",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
