import { NextResponse } from "next/server";

/** Public config for the client (no secrets). */
export async function GET() {
  const originAsset = process.env.ORIGIN_ASSET_ID ?? "";
  const destinationAsset = process.env.DESTINATION_ASSET_ID ?? "";

  return NextResponse.json({
    originAsset,
    destinationAsset,
    hasServerApiKey: Boolean(process.env.AURORA_API_KEY),
    defaultOriginChain: process.env.NEXT_PUBLIC_DEFAULT_ORIGIN_CHAIN ?? "base",
  });
}
