import { NextResponse } from "next/server";
import { getRawPositions } from "@/lib/parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache — read live each call (Layer 0/1)

// GET /api/positions?address=0x...
// Slice 1: returns the wallet's raw Uniswap v3 positions on Robinhood Chain.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Pass a valid ?address=0x… (40 hex chars)" },
      { status: 400 }
    );
  }

  try {
    const positions = await getRawPositions(address);
    return NextResponse.json({ address, count: positions.length, positions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
