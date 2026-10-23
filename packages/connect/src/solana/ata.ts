import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { SPL_TOKEN_PROGRAM, USDC_MINT, KAMINO_CUSDC_MINT } from "../constants/kamino.js";

export function deriveUsdcAta(intermediaryBase58: string): string {
  const owner = new PublicKey(intermediaryBase58);
  const mint = new PublicKey(USDC_MINT);
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    new PublicKey(SPL_TOKEN_PROGRAM),
  ).toBase58();
}

export function deriveCusdcAta(intermediaryBase58: string): string {
  const owner = new PublicKey(intermediaryBase58);
  const mint = new PublicKey(KAMINO_CUSDC_MINT);
  return getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    new PublicKey(SPL_TOKEN_PROGRAM),
  ).toBase58();
}
