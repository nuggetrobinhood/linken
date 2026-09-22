import { NextResponse } from "next/server";
import { getEnrichedPositions } from "@/lib/enrich";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache — read live each call

// GET /api/positions?address=0x...
// Slice 1 + 2: raw Uniswap v3 positions plus pool price and range status.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Pass a valid ?address=0x... (40 hex chars)" },
      { status: 400 }
    );
  }

  try {
    const positions = await getEnrichedPositions(address);
    return NextResponse.json({ address, count: positions.length, positions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
