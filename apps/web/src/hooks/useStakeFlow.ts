"use client";

import { useCallback, useMemo, useState } from "react";
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

      const created = await auroraFetch<{ result?: CreateExecutionResult }>(
        `/api/v1/executions/${address}`,
        { method: "POST", body: JSON.stringify(body) },
      );

      const result = created.result;
      if (!result?.details?.payload || !result.executionId) {
        throw new Error("Unexpected execution response — missing payload or id");
      }

      setExecution(result);
      setPhase("signing");

      const sigHex = await signIntentPayload(result.details.payload);

      setPhase("submitting");
      await auroraFetch(`/api/v1/executions/${address}/submit`, {
        method: "POST",
        body: JSON.stringify({
          signature: encodeEvmIntentSignature(sigHex),
          executionId: result.executionId,
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
  };
}
