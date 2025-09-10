import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amount = searchParams.get("amount") || "200";
  const ref = searchParams.get("ref") || "Mariage Vanessa & David";
  const phone = "+41789028758"; // ton numéro TWINT

  const payload = `TWINT:${phone}?amount=${amount}&ref=${encodeURIComponent(ref)}`;

  const png = await QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
  });

  // ✅ conversion en Uint8Array pour NextResponse
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
