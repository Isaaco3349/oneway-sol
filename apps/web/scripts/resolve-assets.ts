/**
 * Helper to discover 1Click asset IDs for quotes.
 * Fill in symbols, then paste output into root .env
 *
 * Usage (from repo root):
 *   pnpm --filter @oneway/web resolve-assets
 */
const TOKENS_API = "https://1click.chaindefuser.com/v0/tokens";

async function main() {
  const res = await fetch(TOKENS_API);
  if (!res.ok) {
    throw new Error(`tokens fetch failed: ${res.status}`);
  }
  const tokens = (await res.json()) as Array<{
    assetId?: string;
    symbol?: string;
    blockchain?: string;
  }>;

  const want = [
    { symbol: "USDC", blockchain: "base" },
    { symbol: "USDC", blockchain: "sol" },
  ];

  for (const q of want) {
    const match = tokens.find(
      (t) =>
        t.symbol?.toUpperCase() === q.symbol &&
        t.blockchain?.toLowerCase() === q.blockchain,
    );
    console.log(
      `${q.blockchain} ${q.symbol}:`,
      match?.assetId ?? "(not found — pick from list manually)",
    );
  }

  console.log("\nSet in .env:");
  console.log("ORIGIN_ASSET_ID=<base USDC assetId>");
  console.log("DESTINATION_ASSET_ID=<sol USDC assetId>");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
