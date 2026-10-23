import type { SolanaExecutionStep } from "../aurora/types.js";
import {
  KAMINO_CUSDC_MINT,
  KAMINO_DEPOSIT_DISCRIMINATOR,
  KAMINO_LENDING_PROGRAM,
  KAMINO_MAIN_MARKET,
  KAMINO_MARKET_AUTHORITY,
  KAMINO_REFRESH_RESERVE_DISCRIMINATOR,
  KAMINO_SCOPE_ORACLE,
  KAMINO_USDC_LIQUIDITY_VAULT,
  KAMINO_USDC_RESERVE,
  SPL_TOKEN_PROGRAM,
  SYSVAR_INSTRUCTIONS,
  USDC_MINT,
} from "../constants/kamino.js";

export type KaminoStakeAmount =
  | { mode: "bridge-in" }
  | { mode: "steps-only"; liquidityAmountBaseUnits: string };

/**
 * Kamino USDC supply (refresh + deposit). For bridge-in, deposit amount uses {MIN_AMOUNT_OUT}.
 * @see https://docs.intents.aurora.dev/intents-connect/developer-guides/solana/kamino-stake-scenario
 */
export function buildKaminoUsdcStakeSteps(params: {
  intermediaryUsdcAta: string;
  intermediaryCusdcAta: string;
  amount: KaminoStakeAmount;
}): SolanaExecutionStep[] {
  const liquidityAmount =
    params.amount.mode === "bridge-in"
      ? "{MIN_AMOUNT_OUT}"
      : params.amount.liquidityAmountBaseUnits;

  const refresh: SolanaExecutionStep = {
    metadata: {
      name: "Refresh reserve",
      description: "Refresh Kamino USDC reserve price",
    },
    programId: KAMINO_LENDING_PROGRAM,
    discriminator: KAMINO_REFRESH_RESERVE_DISCRIMINATOR,
    args: [],
    accounts: [
      { pubkey: KAMINO_USDC_RESERVE, isSigner: false, isWritable: true },
      { pubkey: KAMINO_MAIN_MARKET, isSigner: false, isWritable: false },
      { pubkey: KAMINO_LENDING_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: KAMINO_LENDING_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: KAMINO_LENDING_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: KAMINO_SCOPE_ORACLE, isSigner: false, isWritable: false },
    ],
  };

  const deposit: SolanaExecutionStep = {
    metadata: {
      name: "Deposit into Kamino",
      description: "Supply USDC, receive cUSDC",
    },
    programId: KAMINO_LENDING_PROGRAM,
    discriminator: KAMINO_DEPOSIT_DISCRIMINATOR,
    args: [{ name: "liquidity_amount", type: "u64", value: liquidityAmount }],
    accounts: [
      { pubkey: "{INTERMEDIARY}", isSigner: true, isWritable: false },
      { pubkey: KAMINO_USDC_RESERVE, isSigner: false, isWritable: true },
      { pubkey: KAMINO_MAIN_MARKET, isSigner: false, isWritable: false },
      { pubkey: KAMINO_MARKET_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: KAMINO_USDC_LIQUIDITY_VAULT, isSigner: false, isWritable: true },
      { pubkey: KAMINO_CUSDC_MINT, isSigner: false, isWritable: true },
      { pubkey: params.intermediaryUsdcAta, isSigner: false, isWritable: true },
      { pubkey: params.intermediaryCusdcAta, isSigner: false, isWritable: true },
      { pubkey: SPL_TOKEN_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: SPL_TOKEN_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS, isSigner: false, isWritable: false },
    ],
  };

  return [refresh, deposit];
}
