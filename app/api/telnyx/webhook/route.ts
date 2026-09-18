import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "Aridon Eva Telnyx webhook" });
}

export async function POST(request: NextRequest) {
  let event: any = null;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventType = event?.data?.event_type ?? event?.event_type ?? "unknown";
  console.log("[telnyx] webhook event:", eventType);

  return NextResponse.json({ ok: true });
}
