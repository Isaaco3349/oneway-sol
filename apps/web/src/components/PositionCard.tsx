"use client";

import type { useStakeFlow } from "@/hooks/useStakeFlow";

type Flow = ReturnType<typeof useStakeFlow>;

const fmt = (base?: string) =>
  base == null ? "…" : (Number(base) / 1_000_000).toFixed(6);

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 14,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};
const btn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 600,
};

export function PositionCard({ flow }: { flow: Flow }) {
  const { balances, address } = flow;
  const busy = flow.withdrawStatus !== "idle" && flow.withdrawStatus !== "done";
  const hasPosition = balances != null && balances.cusdc !== "0";

  if (!address) return null;

  const label: Record<string, string> = {
    creating: "Creating withdrawal…",
    signing: "Sign in MetaMask…",
    submitting: "Submitting…",
  };

  return (
    <div style={card}>
      <div style={row}>
        <strong style={{ fontSize: 20 }}>Your positions</strong>
        <button
          style={btn}
          onClick={() => void flow.refreshBalances()}
          disabled={flow.balancesLoading}
        >
          {flow.balancesLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div style={row}>
        <span>Base wallet USDC</span>
        <span>{fmt(balances?.baseUsdc)}</span>
      </div>
      <div style={row}>
        <span>Kamino position (cUSDC)</span>
        <span>{fmt(balances?.cusdc)}</span>
      </div>
      <div style={row}>
        <span>USDC idle on Solana intermediary</span>
        <span>{fmt(balances?.solUsdc)}</span>
      </div>
      {balances && (
        <div style={{ fontSize: 13, opacity: 0.7, wordBreak: "break-all" }}>
          Intermediary: {balances.solanaAddress}
        </div>
      )}

      {flow.balancesError && (
        <div style={{ color: "#ff6b6b" }}>{flow.balancesError}</div>
      )}

      <button
        style={{
          ...btn,
          background: hasPosition && !busy ? "#1f8a5f" : "transparent",
          opacity: hasPosition && !busy ? 1 : 0.5,
        }}
        disabled={!hasPosition || busy}
        onClick={() => void flow.startWithdrawAll()}
      >
        {busy ? label[flow.withdrawStatus] : "Withdraw all to Base USDC"}
      </button>

      {flow.withdrawStatus === "done" && (
        <div style={{ color: "#19b37e" }}>
          Withdrawal submitted. USDC should reach your Base wallet in a few
          minutes. Press Refresh to check.
        </div>
      )}
      {flow.withdrawError && (
        <div style={{ color: "#ff6b6b", wordBreak: "break-word" }}>
          {flow.withdrawError}
        </div>
      )}

      <div style={{ fontSize: 13, opacity: 0.7 }}>
        To see another wallet, switch accounts in MetaMask. Each wallet has its
        own Solana intermediary.
      </div>
    </div>
  );
}