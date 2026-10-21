import { NextRequest, NextResponse } from "next/server";

const FIRECRAWL_API_URL = (process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev").replace(/\/$/, "");
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const ALLOWED_ACTIONS = new Set(["scrape", "crawl", "map", "search"]);

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const h = url.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local")) return false;
    if (/^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return false;
    const m = h.match(/^172\.(\d+)\./);
    if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "").toLowerCase();
    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: "Unsupported Firecrawl action" }, { status: 400 });
    }

    const payload = { ...(body?.payload || {}) };
    if (["scrape", "crawl", "map"].includes(action)) {
      if (!payload.url || !isPublicHttpUrl(String(payload.url))) {
        return NextResponse.json({ error: "A public http(s) URL is required" }, { status: 400 });
      }
    }
    if (action === "search" && (!payload.query || typeof payload.query !== "string")) {
      return NextResponse.json({ error: "A search query is required" }, { status: 400 });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (FIRECRAWL_API_KEY) headers.Authorization = `Bearer ${FIRECRAWL_API_KEY}`;

    const upstream = await fetch(`${FIRECRAWL_API_URL}/v1/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120000),
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Firecrawl gateway error", error);
    return NextResponse.json({ error: "Firecrawl gateway failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Aridon Firecrawl Gateway",
    actions: [...ALLOWED_ACTIONS],
    configured: Boolean(FIRECRAWL_API_URL),
    authenticated: Boolean(FIRECRAWL_API_KEY),
  });
}
