import bs58 from "bs58";

/**
 * Encode MetaMask personal_sign output for Aurora Intents Connect submit.
 * @see https://docs.intents.aurora.dev/intents-connect/developer-guides/submit-signing
 */
export function encodeEvmIntentSignature(signatureHex: `0x${string}`): string {
  const hex = signatureHex.startsWith("0x") ? signatureHex.slice(2) : signatureHex;
  const sigBytes = Buffer.from(hex, "hex");
  if (sigBytes.length !== 65) {
    throw new Error(`Expected 65-byte signature, got ${sigBytes.length}`);
  }
  if (sigBytes[64] >= 27) sigBytes[64] -= 27;
  return `secp256k1:${bs58.encode(sigBytes)}`;
}

export function payloadJsonToSign(payload: {
  payload_json?: string | Record<string, unknown>;
}): string {
  if (typeof payload.payload_json === "string") {
    return payload.payload_json;
  }
  if (payload.payload_json) {
    return JSON.stringify(payload.payload_json);
  }
  throw new Error("Missing payload_json on execution response");
}

export function quoteDeadline(minutesFromNow = 30): string {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString();
}

/** USDC 6 decimals */
export function usdcToBaseUnits(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  return Math.round(amount * 1_000_000).toString();
}
