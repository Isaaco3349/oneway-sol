"use client";

import { useEffect, useState } from "react";
import { useStakeFlow } from "@/hooks/useStakeFlow";
import { useEvmWallet } from "@/lib/evm-wallet";

type PublicConfig = {
  originAsset: string;
  destinationAsset: string;
  hasServerApiKey: boolean;
  defaultOriginChain: string;
};

export function StakePanel() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [amount, setAmount] = useState("1");
  const { connect, disconnect, isConnected } = useEvmWallet();

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const flow = useStakeFlow({
    originAssetId: config?.originAsset ?? "",
    destinationAssetId: config?.destinationAsset ?? "",
  });

  const configReady =
    config?.hasServerApiKey && config.originAsset && config.destinationAsset;

  async function onConnect() {
    try {
      flow.setError(null);
      await connect();
    } catch (e) {
      flow.setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onPreviewSolana() {
    try {
      flow.setError(null);
      await flow.loadIntermediary();
    } catch (e) {
      flow.setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onStake() {
    try {
      flow.setError(null);
      await flow.startBridgeInStake(Number(amount));
    } catch (e) {
      flow.setError(e instanceof Error ? e.message : String(e));
    }
  }

  const busy = ["creating", "signing", "submitting", "loading-intermediary"].includes(
    flow.phase,
  );

  return (
    <div className="panel">
      <p className="muted" style={{ marginTop: 0 }}>
        Path: {config?.defaultOriginChain ?? "base"} USDC, then Kamino on Solana via{" "}
        <a href="https://docs.intents.aurora.dev/intents-connect/developer-guides/solana/kamino-stake-scenario">
          Aurora Intents Connect
        </a>
        .
      </p>

      <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
        <label>
          <span className="muted">Amount (USDC on origin chain)</span>
          <input
            className="input"
            type="number"
            min={1}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Minimum 1 USDC recommended for bridge fees"
            disabled={flow.phase === "awaiting-deposit" || !isConnected}
          />
        </label>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {!isConnected ? (
            <button className="btn" type="button" onClick={onConnect}>
              Connect MetaMask
            </button>
          ) : (
            <>
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={onPreviewSolana}
              >
                {flow.phase === "loading-intermediary"
                  ? "Loading…"
                  : "Preview Solana address"}
              </button>
              <button
                className="btn"
                type="button"
                disabled={!configReady || !flow.solanaIntermediary || busy || flow.phase === "awaiting-deposit"}
                onClick={onStake}
              >
                {busy ? "Working…" : `Stake ${amount} USDC`}
              </button>
              <button className="btn secondary" type="button" onClick={() => disconnect()}>
                Disconnect
              </button>
            </>
          )}
        </div>

        {flow.address ? (
          <div className="address-block">
            <p className="muted" style={{ margin: "0 0 0.25rem" }}>
              <strong style={{ color: "var(--text)" }}>Your EVM wallet</strong> (you own this
              MetaMask account)
            </p>
            <code className="inline">{flow.address}</code>
          </div>
        ) : null}

        {flow.solanaIntermediary ? (
          <div className="address-block">
            <p className="muted" style={{ margin: "0 0 0.25rem" }}>
              <strong style={{ color: "var(--text)" }}>Your Solana intermediary</strong>
            </p>
            <p className="muted" style={{ margin: "0 0 0.35rem", fontSize: "0.88rem" }}>
              Aurora looks up a stable Solana account tied to your EVM address (you control it by
              signing with MetaMask). Kamino steps run from this account after your deposit settles.
            </p>
            <code className="inline">{flow.solanaIntermediary}</code>
          </div>
        ) : null}
      </div>

      {flow.depositInstructions ? (
        <div
          className="panel"
          style={{ marginTop: "1rem", background: "#0a101a", borderStyle: "dashed" }}
        >
          <strong>Send origin USDC</strong>
          <p className="muted" style={{ marginBottom: "0.35rem" }}>
            Send the quoted amount on {config?.defaultOriginChain ?? "Base"}, then paste the
            transaction hash.
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Deposit address:{" "}
            <code className="inline">{flow.depositInstructions.depositAddress}</code>
          </p>
          {flow.depositInstructions.depositMemo ? (
            <p style={{ margin: "0.25rem 0" }}>
              Memo: <code className="inline">{flow.depositInstructions.depositMemo}</code>
            </p>
          ) : null}
          <DepositHashForm
            onSubmit={async (hash) => {
              try {
                await flow.recordDeposit(hash);
              } catch (e) {
                flow.setError(e instanceof Error ? e.message : String(e));
              }
            }}
          />
        </div>
      ) : null}

      {flow.phase === "complete" ? (
        <p style={{ color: "var(--accent)", marginTop: "1rem" }}>
          Deposit recorded. After bridge settlement, check cUSDC on your Solana intermediary in
          Solscan.
        </p>
      ) : null}

      {flow.error ? <p className="error">{flow.error}</p> : null}
    </div>
  );
}

function DepositHashForm({ onSubmit }: { onSubmit: (hash: string) => Promise<void> }) {
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(hash.trim());
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        className="input"
        placeholder="Origin chain tx hash (0x…)"
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        required
      />
      <button className="btn secondary" type="submit" disabled={busy} style={{ marginTop: "0.5rem" }}>
        {busy ? "Submitting…" : "Record deposit"}
      </button>
    </form>
  );
}
