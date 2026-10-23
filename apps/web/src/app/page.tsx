import { StakePanel } from "@/components/StakePanel";

export default function HomePage() {
  return (
    <main>
      <header style={{ marginBottom: "1.5rem" }}>
        <p className="muted" style={{ margin: 0, fontSize: "0.95rem", letterSpacing: "0.02em" }}>
          OneWay
        </p>
        <h1 style={{ margin: "0.25rem 0 0.5rem", fontSize: "2.25rem", lineHeight: 1.12 }}>
          Earn on Solana
          <span style={{ color: "var(--accent)" }}> from any chain</span>
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: "54ch", fontSize: "1.05rem" }}>
          Keep USDC on Base. Sign once. OneWay bridges and supplies Kamino on Solana. No bridge
          tabs. No SOL needed on your side for this flow.
        </p>
        <p className="muted" style={{ margin: "0.75rem 0 0", fontSize: "0.88rem" }}>
          Powered by{" "}
          <a href="https://docs.intents.aurora.dev/intents-connect/developer-guides/solana/kamino-stake-scenario">
            Aurora Intents Connect
          </a>{" "}
          on Solana mainnet (Kamino USDC).
        </p>
      </header>

      <StakePanel />

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Why it’s different</h2>
        <ul className="muted" style={{ margin: 0, paddingLeft: "1.1rem" }}>
          <li>
            <strong style={{ color: "var(--text)" }}>One flow.</strong> Intent sign, deposit,
            Kamino supply. Not a generic swap widget.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>Real composability.</strong> Bridge in, then{" "}
            <code className="inline">deposit_reserve_liquidity</code> on settlement.
          </li>
          <li>
            <strong style={{ color: "var(--text)" }}>Consumer first.</strong> For people who never
            wanted to learn bridges.
          </li>
        </ul>
      </section>

      <footer className="muted" style={{ marginTop: "2rem", fontSize: "0.8rem" }}>
        Encode Solana Hackathon 2026 · Aurora Intents Connect
      </footer>
    </main>
  );
}
