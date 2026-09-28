import { NextRequest, NextResponse } from "next/server";
import { getNetDepositsV4 } from "@/lib/v4history";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get("tokenId");
  const tickLower = Number(req.nextUrl.searchParams.get("tickLower"));
  const tickUpper = Number(req.nextUrl.searchParams.get("tickUpper"));
  if (!tokenId || Number.isNaN(tickLower) || Number.isNaN(tickUpper)) {
    return NextResponse.json({ error: "tokenId,tickLower,tickUpper required" }, { status: 400 });
  }
  const d = await getNetDepositsV4(tokenId, tickLower, tickUpper);
    return NextResponse.json({
    tokenId,
    ok: d.ok,
    dep0: d.dep0.toString(),
    dep1: d.dep1.toString(),
    txCount: d.txHashes.length,
    txHashes: d.txHashes,
    matched: d.matched,
    pmLogs: d.pmLogs,
    debug: d.debug,
  });
}
