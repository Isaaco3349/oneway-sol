"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildKaminoUsdcStakeSteps,
  deriveCusdcAta,
  deriveUsdcAta,
  encodeEvmIntentSignature,
  quoteDeadline,
  usdcToBaseUnits,
  type CreateExecutionResult,
  type IntermediaryResponse,
} from "@oneway/connect";
import { auroraFetch } from "@/lib/aurora-api";
import { useEvmWallet } from "@/lib/evm-wallet";

export type FlowPhase =
  | "idle"
  | "loading-intermediary"
  | "creating"
  | "signing"
  | "submitting"
  | "awaiting-deposit"
  | "complete"
  | "error";

export type WithdrawStatus =
  | "idle"
  | "creating"
  | "signing"
  | "submitting"
  | "done";

export type Balances = {
  solanaAddress: string;
  baseUsdc: string; // base units (6 decimals)
  solUsdc: string; // base units
  cusdc: string; // base units
};

/* ---------- helpers for balances + withdraw (do not touch the stake flow) ---------- */

const BASE_USDC = "0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913";
const SOLANA_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
];

async function fetchSolana(address: string) {
  const data = await auroraFetch<IntermediaryResponse>(
    `/api/v1/executions/${address}/intermediary`,
  );
  const sol = data.result?.solana;
  if (!sol) throw new Error("Solana intermediary unavailable for this wallet");
  return sol;
}

async function tokenBalance(ata: string): Promise<string> {
  const r = await fetch(`/api/solana-balance?ata=${encodeURIComponent(ata)}`, {
    cache: "no-store",
  });
  const j = await r.json();
  if (!r.ok || j?.amount == null) {
    throw new Error("Could not reach the Solana RPC. Try Refresh in a moment.");
  }
  return String(j.amount);
}

async function baseUsdcBalance(addr: string): Promise<string> {
  const data =
    "0x70a08231" + addr.toLowerCase().replace("0x", "").padStart(64, "0");
  const r = await fetch("https://mainnet.base.org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: BASE_USDC, data }, "latest"],
    }),
  });
  const j = await r.json();
  const hex = String(j?.result ?? "0x0").replace("0x", "") || "0";
  return Number.parseInt(hex, 16).toString();
}

const KLEND = "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD";
const MARKET = "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF";
const MARKET_AUTH = "9DrvZvyWh1HuAoZxvYWMvkf2XCzryCpGgHqrMjyDWpmo";
const RESERVE = "D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const LIQ_SUPPLY = "Bgq7trRgVMeq33yt235zM2onQ4bRDBsY5EWiTetF4qw6";
const CUSDC_MINT = "B8V6WVjPxW1UGwVDfxH2d2r8SyT4cqn7dQRK6XneVa7D";
const ORACLE = "3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SYSVAR_IX = "Sysvar1nstructions1111111111111111111111111";

const acct = (pubkey: string, isSigner: boolean, isWritable: boolean) => ({
  pubkey,
  isSigner,
  isWritable,
});

function buildWithdrawSteps(
  cusdcAta: string,
  usdcAta: string,
  cusdcAmount: string,
  producerAmount: string,
) {
  return [
    {
      metadata: {
        name: "Refresh reserve",
        description: "Refresh the Kamino USDC reserve price",
      },
      programId: KLEND,
      discriminator: "02da8aeb4fc91966",
      args: [],
      accounts: [
        acct(RESERVE, false, true),
        acct(MARKET, false, false),
        acct(KLEND, false, false),
        acct(KLEND, false, false),
        acct(KLEND, false, false),
        acct(ORACLE, false, false),
      ],
    },
    {
      metadata: {
        name: "Withdraw from Kamino",
        description: "Burn cUSDC, receive USDC",
      },
      programId: KLEND,
      discriminator: "ea75b57db98edc1d",
      args: [{ name: "collateral_amount", type: "u64", value: cusdcAmount }],
      accounts: [
        acct("{INTERMEDIARY}", true, false),
        acct(MARKET, false, false),
        acct(RESERVE, false, true),
        acct(MARKET_AUTH, false, false),
        acct(USDC_MINT, false, false),
        acct(CUSDC_MINT, false, true),
        acct(LIQ_SUPPLY, false, true),
        acct(cusdcAta, false, true),
        acct(usdcAta, false, true),
        acct(TOKEN_PROGRAM, false, false),
        acct(TOKEN_PROGRAM, false, false),
        acct(SYSVAR_IX, false, false),
      ],
    },
    {
      metadata: {
        name: "Transfer to deposit address",
        description: "Send redeemed USDC to the bridge",
      },
      programId: TOKEN_PROGRAM,
      discriminator: "0c",
      args: [
        { name: "amount", type: "u64", value: producerAmount },
        { name: "decimals", type: "u8", value: 6 },
      ],
      accounts: [
        acct(usdcAta, false, true),
        acct(USDC_MINT, false, false),
        acct("{DEPOSIT_ADDRESS}", false, true),
        acct("{INTERMEDIARY}", true, false),
      ],
    },
  ];
}

/* ---------- the hook ---------- */

export function useStakeFlow(config: {
  originAssetId: string;
  destinationAssetId: string;
}) {
  const { address, isConnected, signIntentPayload } = useEvmWallet();

  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [intermediary, setIntermediary] = useState<IntermediaryResponse | null>(
    null,
  );
  const [execution, setExecution] = useState<CreateExecutionResult | null>(null);

  // balances + withdraw (separate state, so the stake UI is unaffected)
  const [balances, setBalances] = useState<Balances | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus>("idle");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawExecutionId, setWithdrawExecutionId] = useState<string | null>(
    null,
  );

  const solanaIntermediary = intermediary?.result?.solana ?? null;

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setExecution(null);
  }, []);

  const loadIntermediary = useCallback(async () => {
    if (!address) throw new Error("Connect an EVM wallet first");
    setPhase("loading-intermediary");
    setError(null);
    const data = await auroraFetch<IntermediaryResponse>(
      `/api/v1/executions/${address}/intermediary`,
    );
    setIntermediary(data);
    setPhase("idle");
    return data;
  }, [address]);

  const startBridgeInStake = useCallback(
    async (amountUsdc: number) => {
      if (!address) throw new Error("Connect wallet");
      if (!config.originAssetId || !config.destinationAssetId) {
        throw new Error(
          "Set ORIGIN_ASSET_ID and DESTINATION_ASSET_ID in .env (see README)",
        );
      }

      setError(null);
      setPhase("creating");

      const inter =
        intermediary?.result?.solana != null
          ? intermediary
          : await loadIntermediary();

      const sol = inter.result?.solana;
      if (!sol) {
        throw new Error("Solana intermediary unavailable for this wallet");
      }

      const steps = buildKaminoUsdcStakeSteps({
        intermediaryUsdcAta: deriveUsdcAta(sol),
        intermediaryCusdcAta: deriveCusdcAta(sol),
        amount: { mode: "bridge-in" },
      });

      const body = {
        version: "1.0" as const,
        type: "solana" as const,
        quote: {
          originAsset: config.originAssetId,
          amount: usdcToBaseUnits(amountUsdc),
          destinationAsset: config.destinationAssetId,
          slippageTolerance: 100,
          swapType: "EXACT_INPUT" as const,
          deadline: quoteDeadline(45),
        },
        steps,
        metadata: { title: "OneWay Kamino stake", intent: "kamino_stake" },
        dry: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await auroraFetch<any>(
        `/api/v1/executions/${address}`,
        { method: "POST", body: JSON.stringify(body) },
      );

      // Aurora wraps the execution inside "result"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exec: any = created?.result ?? created;
      console.log("Aurora execution:", exec);

      if (!exec?.id || !exec?.details?.payload) {
        throw new Error(
          "Unexpected: " + JSON.stringify(created).slice(0, 300),
        );
      }

      // The rest of the app reads executionId, Aurora returns id
      setExecution({ ...exec, executionId: exec.id } as CreateExecutionResult);
      setPhase("signing");

      const sigHex = await signIntentPayload(exec.details.payload);

      setPhase("submitting");
      await auroraFetch(`/api/v1/executions/${address}/submit`, {
        method: "POST",
        body: JSON.stringify({
          signature: encodeEvmIntentSignature(sigHex),
          executionId: exec.id,
        }),
      });

      setPhase("awaiting-deposit");
    },
    [
      address,
      config.destinationAssetId,
      config.originAssetId,
      intermediary,
      loadIntermediary,
      signIntentPayload,
    ],
  );

  const recordDeposit = useCallback(
    async (txHash: string) => {
      if (!execution?.quote?.depositAddress) {
        throw new Error("No deposit address on execution");
      }
      try {
        await auroraFetch("/api/v1/executions/deposit/submit", {
          method: "POST",
          body: JSON.stringify({
            txHash,
            depositAddress: execution.quote.depositAddress,
            ...(execution.quote.depositMemo
              ? { memo: execution.quote.depositMemo }
              : {}),
          }),
        });
      } catch (e) {
        console.warn("Deposit notify skipped:", e);
      }
      setPhase("complete");
    },
    [execution],
  );

  const depositInstructions = useMemo(() => {
    if (!execution?.quote?.depositAddress) return null;
    return {
      depositAddress: execution.quote.depositAddress,
      depositMemo: execution.quote.depositMemo,
      amountIn: execution.quote.amountIn,
      executionId: execution.executionId,
    };
  }, [execution]);

  /* ----- balances ----- */

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    setBalancesLoading(true);
    setBalancesError(null);
    try {
      const sol = await fetchSolana(address);
      const [solUsdc, cusdc, baseUsdc] = await Promise.all([
        tokenBalance(String(deriveUsdcAta(sol))),
        tokenBalance(String(deriveCusdcAta(sol))),
        baseUsdcBalance(address),
      ]);
      setBalances({ solanaAddress: String(sol), baseUsdc, solUsdc, cusdc });
    } catch (e) {
      setBalancesError(e instanceof Error ? e.message : String(e));
    } finally {
      setBalancesLoading(false);
    }
  }, [address]);

  // when the connected wallet changes: clear old data, load the new wallet's
  useEffect(() => {
    setIntermediary(null);
    setBalances(null);
    setWithdrawStatus("idle");
    setWithdrawError(null);
    setWithdrawExecutionId(null);
    if (address) void refreshBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  /* ----- withdraw: Kamino cUSDC -> USDC -> bridged to Base USDC ----- */

  const startWithdrawAll = useCallback(
    async (cusdcOverride?: string) => {
      if (!address) {
        setWithdrawError("Connect your wallet first");
        return;
      }
      if (!config.originAssetId || !config.destinationAssetId) {
        setWithdrawError("Asset IDs are not configured");
        return;
      }
      setWithdrawError(null);
      setWithdrawExecutionId(null);
      setWithdrawStatus("creating");

      try {
        const sol = await fetchSolana(address);
        const usdcAta = String(deriveUsdcAta(sol));
        const cusdcAta = String(deriveCusdcAta(sol));
        const cusdc = cusdcOverride ?? (await tokenBalance(cusdcAta));
        if (!cusdc || cusdc === "0") {
          throw new Error("No Kamino position (cUSDC) found for this wallet");
        }

        // Creating an execution moves no money, so it is safe to retry with a
        // slightly lower bridge amount if the first quote is rejected.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let exec: any = null;
        let lastErr: unknown = null;
        for (const factor of [1, 0.98, 0.95]) {
          const quoteAmount = String(Math.floor(Number(cusdc) * factor));
          const body = {
            version: "1.0",
            type: "solana",
            outOperation: true,
            quote: {
              originAsset: config.destinationAssetId, // Solana USDC
              destinationAsset: config.originAssetId, // Base USDC
              amount: quoteAmount,
              slippageTolerance: 100,
              swapType: "EXACT_INPUT",
              deadline: quoteDeadline(45),
              recipient: address,
            },
            steps: buildWithdrawSteps(cusdcAta, usdcAta, cusdc, quoteAmount),
            metadata: { title: "Withdraw from Kamino", intent: "kamino_withdraw" },
            dry: false,
          };
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const created = await auroraFetch<any>(
              `/api/v1/executions/${address}`,
              { method: "POST", body: JSON.stringify(body) },
            );
            const e = created?.result ?? created;
            if (e?.id && e?.details?.payload) {
              exec = e;
              break;
            }
            lastErr = new Error(
              "Unexpected: " + JSON.stringify(created).slice(0, 300),
            );
          } catch (err) {
            lastErr = err;
          }
        }
        if (!exec) {
          throw lastErr instanceof Error
            ? lastErr
            : new Error("Could not create the withdrawal");
        }

        setWithdrawStatus("signing");
        const sigHex = await signIntentPayload(exec.details.payload);

        setWithdrawStatus("submitting");
        await auroraFetch(`/api/v1/executions/${address}/submit`, {
          method: "POST",
          body: JSON.stringify({
            signature: encodeEvmIntentSignature(sigHex),
            executionId: exec.id,
          }),
        });

        setWithdrawExecutionId(String(exec.id));
        setWithdrawStatus("done");
      } catch (e) {
        setWithdrawError(e instanceof Error ? e.message : String(e));
        setWithdrawStatus("idle");
      }
    },
    [
      address,
      config.destinationAssetId,
      config.originAssetId,
      signIntentPayload,
    ],
  );

  return {
    address,
    isConnected,
    phase,
    error,
    setError,
    solanaIntermediary,
    intermediary,
    loadIntermediary,
    startBridgeInStake,
    recordDeposit,
    depositInstructions,
    reset,
    // new
    balances,
    balancesLoading,
    balancesError,
    refreshBalances,
    startWithdrawAll,
    withdrawStatus,
    withdrawError,
    withdrawExecutionId,
  };
}