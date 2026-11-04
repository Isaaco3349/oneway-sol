import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RPCS = [
  process.env.SOLANA_RPC_URL,
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
].filter(Boolean) as string[];

export async function GET(req: Request) {
  const ata = new URL(req.url).searchParams.get("ata") ?? "";
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ata)) {
    return NextResponse.json({ error: "bad address" }, { status: 400 });
  }
  for (const url of RPCS) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountBalance",
          params: [ata],
        }),
        cache: "no-store",
      });
      const j = await r.json();
      if (j?.result?.value?.amount != null) {
        return NextResponse.json({ amount: String(j.result.value.amount) });
      }
      if (String(j?.error?.message ?? "").includes("could not find")) {
        return NextResponse.json({ amount: "0" });
      }
    } catch {
      // try the next RPC
    }
  }
  return NextResponse.json({ error: "rpc unavailable" }, { status: 502 });
}