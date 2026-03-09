import { NextRequest, NextResponse } from "next/server";

const CLOB_URL = "https://clob.polymarket.com";
const PROXY_URL =
  process.env.PROXY_URL || "https://convergence-proxy.dipansrimany.workers.dev/proxy";

/** CLOB /book response: bids/asks are { price: string, size: string }[]. */
interface ClobBookLevel {
  price: string;
  size: string;
}

interface ClobBookResponse {
  bids?: ClobBookLevel[];
  asks?: ClobBookLevel[];
}

/** Proxy to Polymarket CLOB GET /book for one token; returns bids/asks (price 0–1, size). */
async function fetchBook(tokenId: string): Promise<ClobBookResponse> {
  const targetUrl = `${CLOB_URL}/book?token_id=${encodeURIComponent(tokenId)}`;
  const res = await fetch(PROXY_URL, {
    method: "GET",
    headers: {
      "X-Target-URL": targetUrl,
      Accept: "application/json",
      ...(process.env.PROXY_SECRET && {
        "X-Proxy-Secret": process.env.PROXY_SECRET,
      }),
    },
    next: { revalidate: 15 },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `CLOB book error: ${res.status}`);
  }
  return data as ClobBookResponse;
}

/** Map CLOB bids to [price_cents, size][] (sorted by price descending for bids). */
function toLevels(bids: ClobBookLevel[] | undefined): [number, number][] {
  if (!Array.isArray(bids)) return [];
  return bids
    .map((b) => {
      const p = parseFloat(b.price);
      const size = parseFloat(b.size);
      if (!Number.isFinite(p) || !Number.isFinite(size)) return null;
      const priceCents = Math.round(p * 100);
      if (priceCents < 0 || priceCents > 100) return null;
      return [priceCents, Math.max(0, Math.round(size))] as [number, number];
    })
    .filter((x): x is [number, number] => x != null)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 20);
}

/**
 * GET /api/polymarket/orderbook?yesTokenId=...&noTokenId=...
 * Returns { yes: [price_cents, size][], no: [price_cents, size][] } from CLOB books.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yesTokenId = searchParams.get("yesTokenId");
  const noTokenId = searchParams.get("noTokenId");

  if (!yesTokenId) {
    return NextResponse.json(
      { success: false, error: "Missing yesTokenId parameter" },
      { status: 400 }
    );
  }

  try {
    const [yesBook, noBook] = await Promise.all([
      fetchBook(yesTokenId),
      noTokenId ? fetchBook(noTokenId) : Promise.resolve({ bids: [] }),
    ]);

    const yes = toLevels(yesBook.bids);
    const no = toLevels(noBook.bids);

    return NextResponse.json({
      success: true,
      data: { yes, no },
    });
  } catch (err) {
    console.error("Polymarket orderbook proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch orderbook",
      },
      { status: 502 }
    );
  }
}
